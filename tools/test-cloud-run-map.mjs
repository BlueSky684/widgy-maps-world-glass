// Real local HTTP + the pre-change route as an image oracle. Synthetic GPS and
// fake providers only; no credentials, network providers, quota or cloud writes.
// Run: node --experimental-vm-modules tools/test-cloud-run-map.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import vm from 'node:vm';
import {once} from 'node:events';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createMapServer, validateConfiguration} from '../services/map-server/server.mjs';
import {createLocationCache} from '../services/map-server/location-cache.mjs';
import {encodeValue, decodeValue} from '../services/map-server/firestore.mjs';
import {authorizeLocation, locationErrorStatus} from '../lib/location/shared.js';

const token = 'synthetic-cloud-run-token-'.repeat(2);
const previousToken = process.env.WIDGY_LOCATION_ACCESS_TOKEN;
process.env.WIDGY_LOCATION_ACCESS_TOKEN = token;
const config = {WIDGY_LOCATION_ACCESS_TOKEN: token};
const logs = [], originalInfo = console.info;
let prepared;
console.info = value => {
  logs.push(value);
  const event = JSON.parse(value);
  if (event.event === 'night_map_response_v1' && event.phase === 'prepared') prepared?.();
};
const cityFor = point => point.latitude === 10 ? 'Synthetic City A' : 'Synthetic City B';
const lookup = async point => ({entry: {...point, city: cityFor(point)}, state: 'MEMORY'});
const pathFor = changes => '/api/night-map?' + new URLSearchParams({
  shared_location: '1', location_key: token, lat: '10', lon: '20',
  mode: 'live', width: '3306', presentation: 'glass', atlas: 'r6', reuse: '60', ...changes
});
const servers = [];
async function start(options = {}) {
  const server = createMapServer({env: () => config, lookup, logger: value => logs.push(value), ...options});
  servers.push(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return (path, method = 'GET', headers = {}) => new Promise((resolve, reject) => {
    const request = http.request({host: '127.0.0.1', port: server.address().port, path, method, headers}, response => {
      const chunks = [];
      response.on('data', b => chunks.push(b)); response.on('error', reject);
      response.on('end', () => resolve({status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks)}));
    });
    request.on('error', reject); request.end();
  });
}

// Pin the deployed pre-migration route, rather than comparing the adapter to
// itself. All renderer files remain unchanged from this commit.
const baseline = execFileSync('git', ['show', '6fcfc958a62fafdf7fdfac937b7db0feaadaa5d3:api/night-map.js'], {encoding: 'utf8'});
async function baselineImage(url) {
  const context = vm.createContext({URL, URLSearchParams, Date, Buffer, performance,
    process: {env: config}, console: {info() {}, error() {}}});
  async function moduleFor(name) {
    let values;
    if (name === '../lib/location/shared.js') values = {authorizeLocation, locationErrorStatus};
    else if (name === '../lib/location/map-city.js') values = {resolveMapCity: async point => ({city: cityFor(point), state: 'MEMORY'})};
    else values = await import(name.startsWith('.') ? new URL(name, new URL('../api/night-map.js', import.meta.url)) : name);
    return new vm.SyntheticModule(Object.keys(values), function() {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, {context});
  }
  const mod = new vm.SourceTextModule(baseline, {context, importModuleDynamically: async name => {
    const m = await moduleFor(name); await m.link(() => {}); await m.evaluate(); return m;
  }});
  await mod.link(moduleFor); await mod.evaluate();
  const res = {setHeader() {}, status(code) {this.code = code; return this;},
    send(body) {this.body = body;}, json(body) {this.body = body;}, end() {}};
  await mod.namespace.default({url, method: 'GET', headers: {}}, res);
  assert.equal(res.code, 200);
  return res.body;
}

const rows = [];
try {
  const request = await start();
  assert.equal((await request('/healthz')).status, 200);
  assert.equal((await request('/private.json')).status, 404);
  assert.equal((await request(pathFor({}), 'POST')).status, 405);
  assert.equal((await request(pathFor({location_key: 'invalid'}))).status, 403);
  assert.equal((await request(pathFor({}) + '&location_key=' + token)).status, 403);
  assert.equal((await request(pathFor({lat: '91'}))).status, 400);
  assert.equal((await request(pathFor({width: '17'}))).status, 400);
  assert.equal((await request(pathFor({at: 'invalid'}))).status, 400);
  for (const changes of [
    {at: '2026-10-14T12:00:00Z'},
    {at: '2026-10-14T00:00:00Z', lat: '-25', lon: '145'}
  ]) {
    const path = pathFor(changes), expected = await baselineImage(path), actual = await request(path);
    assert.equal(actual.status, 200);
    assert.equal(actual.headers['content-type'], 'image/png');
    assert.equal(actual.headers['x-map-time-mode'], 'fixed-test');
    assert.equal(Number(actual.headers['content-length']), actual.body.length);
    assert(actual.body.equals(expected), 'PNG differs from deployed pre-migration route');
    const meta = await sharp(actual.body).metadata();
    assert.equal(meta.width, 3306); assert.equal(meta.height, 1558); assert(meta.icc?.length);
    await sharp(actual.body).raw().toBuffer();
    rows.push({at: changes.at, bytes: actual.body.length,
      sha256: createHash('sha256').update(actual.body).digest('hex'), byteIdenticalToBaseline: true});
  }
  assert.notEqual(rows[0].sha256, rows[1].sha256);
  const live = await request(pathFor({t: 'one'}));
  assert.equal(live.headers['x-map-time-mode'], 'server-now');
  assert.equal(live.headers['x-map-cache'], 'MISS');
  const cached = await request(pathFor({t: 'two'}));
  assert.equal(cached.headers['x-map-cache'], 'HIT'); assert(cached.body.equals(live.body));
  const conditional = await request(pathFor({}), 'GET', {'If-None-Match': live.headers.etag});
  assert.equal(conditional.status, 304); assert.equal(conditional.body.length, 0);
  const head = await request(pathFor({}), 'HEAD');
  assert.equal(head.status, 200); assert.equal(head.body.length, 0);
  assert.match(live.headers['cache-control'], /^private, max-age=\d+, must-revalidate$/);

  // An unresolved city task must complete while request-billed CPU still runs.
  // Hold the fake provider until PNG preparation, then release it. This checks
  // the lifecycle boundary without relying on a guessed renderer duration.
  let release, pointSeen, received = false;
  const late = await start({cityDeadlineMs: 5, lookup: point => {
    pointSeen = point; return new Promise(resolve => { release = resolve; });
  }});
  const ready = new Promise(resolve => {prepared = resolve;});
  const pending = late(pathFor({layer: 'location', width: '1102'})).then(value => {received = true; return value;});
  await ready; prepared = null;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(received, false, 'Response ended before pending city work completed');
  release({entry: {...pointSeen, city: 'Synthetic Late City'}, state: 'LOOKUP'});
  const lateResult = await pending;
  assert.equal(lateResult.status, 200); assert.equal(lateResult.headers['x-location-cache'], 'TIMEOUT');

  const providerFailure = await start({lookup: async () => {throw Error('synthetic provider failure');}});
  const fallback = await providerFailure(pathFor({layer: 'location', width: '1102'}));
  assert.equal(fallback.status, 200); assert.equal(fallback.headers['x-location-cache'], 'UNAVAILABLE');
  assert.equal(fallback.headers['content-type'], 'image/png');

  // Exercise the real server's default lookup wiring with Google REST and BDC
  // fixtures. A hidden Redis dependency would fail this allowlisted transport.
  const priorFetch = globalThis.fetch, documents = new Map();
  let providerCalls = 0, revision = 0;
  documents.set('widgyControl/bdc-budget-v1', {schema: 1, state: 'active', days: {}, minute: 0, rate: 0,
    migrationId: '12345678-1234-1234-1234-123456789012'});
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    const response = (data, status = 200) => ({ok: status === 200, status, json: async () => data});
    if (url.hostname === 'metadata.google.internal') return response({access_token: 'synthetic-google', expires_in: 3600});
    if (url.hostname === 'api-bdc.net') {
      providerCalls++;
      return response({latitude: 10, longitude: 20, city: 'Synthetic City A', countryName: 'Synthetic Country'});
    }
    assert.equal(url.hostname, 'firestore.googleapis.com', 'Unexpected runtime dependency');
    const path = url.pathname.split('/documents/')[1];
    if (init.method === 'PATCH') {
      documents.set(path, decodeValue({mapValue: {fields: JSON.parse(init.body).fields}})); revision++;
    }
    if (!documents.has(path)) return response({error: {status: 'NOT_FOUND'}}, 404);
    return response({fields: encodeValue(documents.get(path)).mapValue.fields, updateTime: `2026-10-14T18:00:00.${String(revision).padStart(6, '0')}Z`});
  };
  try {
    const environment = () => ({...config, BIGDATACLOUD_API_KEY: 'synthetic-bdc', FIRESTORE_PROJECT_ID: 'synthetic-project'});
    const first = await start({lookup: undefined, env: environment});
    const locationPath = pathFor({at: '2026-10-14T12:00:00Z', layer: 'location', width: '1102'});
    const cold = await first(locationPath);
    assert.equal(cold.status, 200); assert.equal(cold.headers['x-location-cache'], 'LOOKUP');
    const second = await start({lookup: undefined, env: environment});
    const reused = await second(locationPath);
    assert.equal(reused.status, 200); assert.equal(reused.headers['x-location-cache'], 'SHARED');
    const cityPath = '/api/fetch-probe?' + new URLSearchParams({location_shared: '1', location_key: token, lat: '10', lon: '20'});
    const city = await second(cityPath);
    assert.equal(city.status, 200); assert.equal(city.headers['access-control-allow-origin'], '*');
    assert.equal(JSON.parse(city.body).entry.countryName, 'Synthetic Country');
    assert.equal((await second(cityPath, 'OPTIONS')).status, 204);
    assert.equal((await second(cityPath.replace(token, 'invalid'))).status, 403);
    assert.equal((await second(cityPath + '&lat=11')).status, 400);
    assert.equal(providerCalls, 1);
    assert.equal(Object.values(documents.get('widgyControl/bdc-budget-v1').days).reduce((sum, n) => sum + n, 0), 1);
  } finally {globalThis.fetch = priorFetch;}

  // Cache data stays private and expires even if Firestore TTL deletion lags.
  let cachedDocument, clock = 1800000000000;
  const entry = {latitude: 10, longitude: 20, city: 'Synthetic City A'};
  const cache = createLocationCache({now: () => clock, store: {
    get: async path => {assert.equal(path, 'widgyCityCache/' + 'a'.repeat(64)); return cachedDocument;},
    put: async (path, value) => {assert.equal(path, 'widgyCityCache/' + 'a'.repeat(64)); cachedDocument = {value};}
  }});
  const key = 'a'.repeat(64);
  assert.equal(await cache.get(key), null);
  await cache.set(key, entry, {ttl: 21600});
  assert.deepEqual(await cache.get(key), entry);
  clock += 21600000;
  assert.equal(await cache.get(key), null);
  await assert.rejects(cache.get('plain-location'), /invalid_cache_key/);
  await assert.rejects(cache.set(key, entry, {ttl: 999999}), /invalid_cache_ttl/);
  validateConfiguration({WIDGY_LOCATION_ACCESS_TOKEN: token, BIGDATACLOUD_API_KEY: 'synthetic', FIRESTORE_PROJECT_ID: 'synthetic-project'});
  assert.throws(() => validateConfiguration({}), /Missing configuration/);

  const serializedLogs = logs.join('\n');
  for (const secret of [token, 'Synthetic City', 'Synthetic Late City', 'location_key=', 'latitude=', '/api/night-map?']) {
    assert(!serializedLogs.includes(secret), 'Sensitive data in application logs');
  }
  const summary = {passed: true, baselineCommit: '6fcfc958a62fafdf7fdfac937b7db0feaadaa5d3', rows,
    liveCacheAnd304: true, head: true, accessGuards: true, cityWorkFinishesBeforeResponse: true,
    cityOutageStillReturnsPNG: true, privateCacheTTL: true, sanitizedApplicationLogs: true,
    defaultLookupUsesFirestoreWithoutUpstash: true,
    calendarCityEndpointAndCORS: true,
    peakRSSMiB: Math.round(process.resourceUsage().maxRSS / 1024),
    containerBuild: 'pending; no Docker daemon in local environment',
    cloudRunAndNativePhone: 'pending Google project deployment'};
  originalInfo(JSON.stringify(summary, null, 2));
} finally {
  console.info = originalInfo;
  if (previousToken === undefined) delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;
  else process.env.WIDGY_LOCATION_ACCESS_TOKEN = previousToken;
  for (const server of servers) {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}
}
