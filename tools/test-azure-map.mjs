// Actual local HTTP, synthetic coordinates/credentials and fake geocoding only.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createAzureMapServer, validateConfiguration} from '../services/azure-map/server.mjs';
import {createNightMapHandler} from '../api/night-map.js';
import {createSharedLocation} from '../lib/location/shared.js';

const key = 'synthetic-azure-local-test-key-'.repeat(2);
const transfer = '11111111-2222-4333-8444-555555555555';
const values = {WIDGY_MAP_FILE_ACCESS_TOKEN: key, WIDGY_MAP_FILE_CITY_BACKEND: 'vercel-bdc',
  BIGDATACLOUD_API_KEY: 'synthetic-provider-key', UPSTASH_REDIS_REST_URL: 'https://synthetic.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'synthetic-quota-key'};
const originalEnv = Object.fromEntries(Object.keys(values).map(k => [k, process.env[k]]));
Object.assign(process.env, values);
const info = console.info, logs = [], servers = [], rows = [];
console.info = value => logs.push(value);
const lookup = async point => ({entry: {...point, city: 'SYNTHETIC AZURE CITY'}, state: 'MEMORY'});
const pathFor = (changes = {}) => '/api/night-map?' + new URLSearchParams({
  delivery: 'vercel-file-v1', location_key: key, lat: '10.12345', lon: '20.12345',
  width: '2400', shared_location: '1', mode: 'live', presentation: 'glass', atlas: 'r6',
  reuse: '60', native_file: '1', transfer_id: transfer, ...changes
});
async function start(options = {}) {
  const server = createAzureMapServer({lookup, logger: value => logs.push(value), ...options});
  servers.push(server);
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return (path, options) => fetch(`http://127.0.0.1:${server.address().port}${path}`, options);
}
const test = async (name, fn) => { await fn(); rows.push({name, passed: true}); };
const baseline = createNightMapHandler({resolveFileCity: async () => ({city: 'SYNTHETIC AZURE CITY', state: 'MEMORY'})});
async function baselineImage(path) {
  const res = {statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; },
    json(body) { this.body = body; }, end() {}};
  await baseline({url: path, method: 'GET', headers: {}}, res);
  assert.equal(res.statusCode, 200);
  return res.body;
}
try {
  await test('Startup rejects missing credentials, wrong backend and invalid quota-store origin', async () => {
    validateConfiguration(values);
    for (const k of Object.keys(values)) assert.throws(() => validateConfiguration({...values, [k]: ''}));
    for (const url of ['http://synthetic.upstash.io', 'https://upstash.io.attacker.invalid', 'https://x:y@synthetic.upstash.io'])
      assert.throws(() => validateConfiguration({...values, UPSTASH_REDIS_REST_URL: url}));
  });
  let lookups = 0;
  const request = await start({lookup: async p => {lookups++; return lookup(p);}});
  await test('Health works; unrelated routes and unsafe methods are rejected', async () => {
    assert.equal((await request('/health')).status, 200);
    assert.equal((await request('/api/fetch-probe')).status, 404);
    assert.equal((await request(pathFor(), {method: 'POST'})).status, 405);
  });
  await test('Authentication and native-delivery contract fail before geocoding', async () => {
    for (const changes of [{location_key: 'bad'}, {lat: '91'}, {native_file: '0'},
      {transfer_id: 'invalid'}, {delivery: 'other'}, {width: '3306'}, {shared_location: '0'},
      {layer: 'base'}, {format: 'webp-exact-v1'}]) {
      assert([400, 403].includes((await request(pathFor(changes))).status));
    }
    for (const extra of [`&location_key=${key}`, '&width=2400', '&shared_location=1'])
      assert([400, 403].includes((await request(pathFor() + extra)).status));
    assert.equal(lookups, 0);
  });
  for (const at of ['2026-11-15T06:00:00Z', '2026-11-15T18:00:00Z']) {
    await test(`Complete PNG bytes match unchanged production handler at ${at}`, async () => {
      const path = pathFor({at}), expected = await baselineImage(path);
      const res = await request(path), actual = Buffer.from(await res.arrayBuffer());
      assert.equal(res.status, 200); assert(actual.equals(expected));
      assert.equal(res.headers.get('content-type'), 'application/octet-stream');
      assert.equal(res.headers.get('content-length'), String(actual.length));
      assert.match(res.headers.get('cache-control'), /no-store/);
      assert.equal(res.headers.get('x-map-service'), 'vercel-file-v1');
      assert.equal(res.headers.get('x-map-host'), 'azure-container-apps-trial-v1');
      assert(actual.includes(Buffer.from('WorldGlassTransfer\0' + transfer)));
      const meta = await sharp(actual).metadata();
      assert.equal(meta.width, 2400); assert.equal(meta.height, 1131); assert(meta.hasProfile);
      await sharp(actual).raw().toBuffer();
    });
  }
  await test('Live requests stay complete with conditional headers; HEAD has no body', async () => {
    const res = await request(pathFor(), {headers: {'If-None-Match': '*'}});
    assert.equal(res.status, 200); assert((await res.arrayBuffer()).byteLength > 1000);
    const head = await request(pathFor(), {method: 'HEAD'});
    assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
  });
  await test('Unavailable city still returns a valid tagged map', async () => {
    const failed = await start({lookup: async () => { throw Error('synthetic outage'); }});
    const res = await failed(pathFor());
    assert.equal(res.status, 200); assert.equal(res.headers.get('x-location-cache'), 'UNAVAILABLE');
    const image = Buffer.from(await res.arrayBuffer());
    assert(image.includes(Buffer.from('WorldGlassTransfer\0' + transfer)));
    await sharp(image).raw().toBuffer();
  });
  await test('Pending city work does not hold the HTTP response open', async () => {
    let release;
    const delayed = await start({cityDeadlineMs: 1, lookup: () => new Promise(resolve => { release = resolve; })});
    const res = await delayed(pathFor(), {signal: AbortSignal.timeout(15000)});
    assert.equal(res.status, 200); assert.equal(res.headers.get('x-location-cache'), 'TIMEOUT');
    assert((await res.arrayBuffer()).byteLength > 1000);
    release(await lookup({latitude: 10.12345, longitude: 20.12345}));
  });
  await test('Unavailable persistent quota blocks provider calls', async () => {
    let contacted = false;
    const resolve = createSharedLocation({env: () => ({...values, WIDGY_LOCATION_ACCESS_TOKEN: key}),
      cache: () => {throw Error('no cache');}, reserve: async () => {throw Error('budget_unavailable');},
      fetcher: async () => {contacted = true; throw Error('must not contact provider');}, defer: () => {}});
    await assert.rejects(resolve({latitude: 10, longitude: 20})); assert.equal(contacted, false);
  });
  await test('Bounded concurrency returns 503 without starting another city lookup', async () => {
    let entered, release, calls = 0;
    const ready = new Promise(resolve => { entered = resolve; });
    const limited = await start({maxInFlight: 1, cityDeadlineMs: 10000, lookup: p => {
      calls++; entered(); return new Promise(resolve => { release = () => resolve(lookup(p)); });
    }});
    const first = limited(pathFor()); await ready;
    const second = await limited(pathFor()); assert.equal(second.status, 503); assert.equal(calls, 1);
    release(); const res = await first; assert.equal(res.status, 200); await res.arrayBuffer();
  });
  await test('Logs retain hashed transfer correlation without keys, GPS, city or raw UUID', async () => {
    const joined = logs.join('\n');
    for (const secret of [key, transfer, 'SYNTHETIC AZURE CITY', '10.12345', '20.12345', 'location_key='])
      assert(!joined.includes(secret));
    const correlation = createHash('sha256').update('world-glass-transfer-v1:' + transfer).digest('hex').slice(0, 24);
    assert(logs.some(line => JSON.parse(line).transferCorrelation === correlation));
    assert(logs.some(line => JSON.parse(line).event === 'azure_map_http_v1'));
  });
} finally {
  for (const server of servers) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await server.drainBackground(20);
  }
  console.info = info;
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
}
console.log(JSON.stringify({checks: rows.length, results: rows, scope: 'Local HTTP only; Azure and iPhone not tested'}, null, 2));
