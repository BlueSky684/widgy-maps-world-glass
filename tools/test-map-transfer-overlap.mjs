// Real HTTP and real PNGs; a gated fake city provider reproduces the wait.
// No live credentials, external requests, quota or cloud writes.
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createMapServer} from '../services/map-server/server.mjs';

const token = 'synthetic-transfer-test-token-'.repeat(2);
const previousToken = process.env.WIDGY_LOCATION_ACCESS_TOKEN;
process.env.WIDGY_LOCATION_ACCESS_TOKEN = token;
const oldInfo = console.info, reports = [], servers = [], releases = [];
let onPrepared, onServerReport;
console.info = text => {
  const event = JSON.parse(text);
  reports.push(event);
  if (event.event === 'night_map_response_v1' && event.phase === 'prepared') onPrepared?.();
};
const pathFor = changes => '/api/night-map?' + new URLSearchParams({
  shared_location: '1', location_key: token, lat: '0', lon: '0',
  width: '3306', mode: 'live', presentation: 'glass', atlas: 'r6',
  at: '2026-10-20T12:00:00Z', ...changes
});
function gate() {
  let release;
  const promise = new Promise(resolve => {release = resolve;});
  releases.push(release);
  return {promise, release};
}
async function deadline(promise, label, ms = 3000) {
  let timer;
  try {return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(Error(label)), ms);
  })]);} finally {clearTimeout(timer);}
}
async function start(options = {}) {
  const server = createMapServer({env: () => ({WIDGY_LOCATION_ACCESS_TOKEN: token}),
    lookup: async () => {throw Error('synthetic unavailable');},
    logger: text => {const event = JSON.parse(text); reports.push(event); onServerReport?.(event);}, ...options});
  servers.push(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return (path, {method = 'GET', headers = {}, data, response: observe} = {}) => {
    let ended = false;
    const done = new Promise((resolve, reject) => {
      const request = http.request({host: '127.0.0.1', port: server.address().port, path, method, headers}, response => {
        observe?.(response);
        const chunks = [];
        response.on('data', chunk => {chunks.push(chunk); data?.(chunk, response);});
        response.on('error', reject);
        response.on('close', () => {if (!response.complete) reject(Error('Incomplete HTTP response'));});
        response.on('end', () => {ended = true; resolve({status: response.statusCode,
          headers: response.headers, body: Buffer.concat(chunks)});});
      });
      request.on('error', reject); request.end();
    });
    // Keep deliberate client-disconnect failures handled until asserted below.
    done.catch(() => {});
    return {done, get ended() {return ended;}};
  };
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  const plain = await start();
  const expected = await plain(pathFor({})).done;
  assert.equal(expected.status, 200);
  assert.equal(Number(expected.headers['content-length']), expected.body.length);
  const pendingCity = gate(), prefixReceived = gate(), prepared = gate();
  let cacheCompleted = false, receivedBytes = 0;
  const slow = await start({cityDeadlineMs: 1, lookup: async point => {
    await pendingCity.promise;
    cacheCompleted = true;
    return {entry: {...point, city: 'Synthetic delayed city'}, state: 'LOOKUP'};
  }});
  onPrepared = () => prepared.release();
  const streamed = slow(pathFor({}), {data: chunk => {
    receivedBytes += chunk.length;
    if (receivedBytes >= expected.body.length - 1) prefixReceived.release();
  }});
  await deadline(prepared.promise, 'PNG was not prepared'); onPrepared = null;
  const readyAt = performance.now();
  // This assertion fails against the old server: it sends no bytes until the
  // provider is released. The client must now receive the image while it waits.
  await deadline(prefixReceived.promise, 'PNG transfer blocked behind pending city work', 1200);
  const prefixAfterReadyMs = Math.round(performance.now() - readyAt);
  assert.equal(cacheCompleted, false);
  assert.equal(streamed.ended, false, 'HTTP completed before the city task');
  assert.equal(receivedBytes, expected.body.length - 1, 'Partial PNG must remain incomplete');
  pendingCity.release();
  const actual = await deadline(streamed.done, 'Response did not complete after city work');
  assert.equal(cacheCompleted, true);
  assert.equal(actual.status, 200);
  assert.equal(actual.headers['x-location-cache'], 'TIMEOUT');
  assert.equal(actual.headers['transfer-encoding'], 'chunked');
  assert.equal(actual.headers['content-length'], undefined, 'Do not combine HTTP framing methods');
  assert(actual.body.equals(expected.body), 'Streaming changed PNG bytes');
  const meta = await sharp(actual.body).metadata();
  assert.equal(meta.width, 3306); assert.equal(meta.height, 1558);
  await sharp(actual.body).raw().toBuffer();
  const completion = reports.find(e => e.event === 'cloud_map_http_v1' &&
    e.id === actual.headers['x-map-request-id'] && e.phase === 'finished');
  assert.equal(completion.bodyBytes, actual.body.length, 'Chunked response lost byte-count diagnostics');

  // A hung provider must retain the existing bounded drain and valid fallback.
  const never = gate();
  const bounded = await start({cityDeadlineMs: 1, drainDeadlineMs: 60, lookup: () => never.promise});
  const timed = await deadline(bounded(pathFor({layer: 'location', width: '1102'})).done, 'Unbounded city drain');
  assert.equal(timed.status, 200);
  await sharp(timed.body).raw().toBuffer();
  assert(reports.some(e => e.id === timed.headers['x-map-request-id'] && e.phase === 'city_completion_timeout'));
  never.release();

  // Client disconnect after the first chunk must never be logged as finished.
  const disconnectCity = gate(), disconnected = gate(), serverClosed = gate();
  let disconnectCacheCompleted = false, disconnectID;
  const abortable = await start({cityDeadlineMs: 1, lookup: async point => {
    await disconnectCity.promise; disconnectCacheCompleted = true;
    return {entry: {...point, city: 'Synthetic late abort city'}, state: 'LOOKUP'};
  }});
  onServerReport = event => {
    if (event.id === disconnectID && ['closed_early', 'finished'].includes(event.phase)) serverClosed.release(event);
  };
  const aborted = abortable(pathFor({layer: 'location', width: '1102'}), {
    response: res => {disconnectID = res.headers['x-map-request-id'];},
    data: (_, res) => {res.destroy(); disconnected.release();}
  });
  await deadline(disconnected.promise, 'No bytes received before client disconnect');
  await assert.rejects(deadline(aborted.done, 'Disconnect did not terminate the response'), /incomplete|aborted/i);
  assert.equal((await deadline(serverClosed.promise, 'Server did not observe client disconnect')).phase, 'closed_early');
  onServerReport = null;
  disconnectCity.release();
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert(disconnectCacheCompleted);
  const abortRecords = reports.filter(e => e.event === 'cloud_map_http_v1' && e.id === disconnectID);
  assert.equal(abortRecords.filter(e => e.phase === 'closed_early').length, 1);
  assert(!abortRecords.some(e => e.phase === 'finished' || e.phase === 'handler_failed'));

  // HEAD, 304 and JSON errors keep their existing framing and no image chunks.
  const head = await bounded(pathFor({layer: 'location', width: '1102'}), {method: 'HEAD'}).done;
  assert.equal(head.body.length, 0); assert.equal(head.headers['transfer-encoding'], undefined);
  const livePath = pathFor({at: '', reuse: '60', layer: 'location', width: '1102'}).replace('&at=', '');
  const live = await plain(livePath).done;
  const conditional = await plain(livePath, {headers: {'If-None-Match': live.headers.etag}}).done;
  assert.equal(conditional.status, 304); assert.equal(conditional.body.length, 0);
  assert.equal(conditional.headers['transfer-encoding'], undefined);
  const rejected = await plain(pathFor({location_key: 'invalid'})).done;
  assert.equal(rejected.status, 403); assert.equal(rejected.headers['content-type'], 'application/json');
  assert.equal(Number(rejected.headers['content-length']), rejected.body.length);
  assert.equal(rejected.headers['transfer-encoding'], undefined);
  const invalid = await plain(pathFor({width: '17'})).done;
  assert.equal(invalid.status, 400); assert.equal(invalid.headers['transfer-encoding'], undefined);
  assert(!JSON.stringify(reports).includes(token));
  assert(!JSON.stringify(reports).includes('Synthetic delayed city'));
  oldInfo(JSON.stringify({passed: true, imageBytes: actual.body.length, sha256: sha(actual.body),
    prefixAfterReadyMs, fullResolutionBytesUnchanged: true, transferBeforeCityCompletion: true,
    responseEndsAfterCityCompletion: true, partialPNGWithheld: true, drainStillBounded: true,
    disconnectNotSuccess: true, head304ErrorsUnchanged: true, accurateBodyByteCount: true,
    hostedProxyAndPhone: 'not tested; this is a controlled local HTTP result'}, null, 2));
} finally {
  onPrepared = null; onServerReport = null;
  releases.forEach(release => release());
  console.info = oldInfo;
  if (previousToken === undefined) delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;
  else process.env.WIDGY_LOCATION_ACCESS_TOKEN = previousToken;
  for (const server of servers) {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
}
