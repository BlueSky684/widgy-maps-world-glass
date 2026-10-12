import assert from 'node:assert/strict';
import handler from '../api/fetch-probe.js';

const saved = Object.fromEntries(['BIGDATACLOUD_API_KEY', 'WIDGY_LOCATION_ACCESS_TOKEN'].map(k => [k, process.env[k]]));
const response = () => ({
  headers: {},
  setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
  status(v) { this.code = v; return this; },
  json(v) { this.body = v; return this; },
  end() { return this; },
});
async function request(method, query = '', headers = {}) {
  const res = response();
  await handler({method, url: '/api/fetch-probe?location_shared=1' + query, headers: {origin: 'null', ...headers}}, res);
  assert.equal(res.headers['access-control-allow-origin'], '*');
  assert.equal(res.headers['access-control-allow-credentials'], undefined);
  assert.equal(res.headers['cache-control'], 'private, no-store');
  assert.equal(res.headers['cdn-cache-control'], 'no-store');
  assert.equal(res.headers['vercel-cdn-cache-control'], 'no-store');
  return res;
}
try {
  delete process.env.BIGDATACLOUD_API_KEY;
  delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;
  // Preflight must never depend on geocoding, GPS, a token, or provider config.
  const preflight = await request('OPTIONS', '', {
    'access-control-request-method': 'GET',
    'access-control-request-headers': 'accept,accept-language',
  });
  assert.equal(preflight.code, 204);
  assert.equal(preflight.body, undefined);
  assert.equal(preflight.headers['access-control-allow-methods'], 'GET, OPTIONS');
  for (const name of ['accept', 'accept-language']) {
    assert(preflight.headers['access-control-allow-headers'].toLowerCase().split(/,\s*/).includes(name));
  }
  assert.equal((await request('GET', '&lat=1&lon=2')).code, 503);
  process.env.BIGDATACLOUD_API_KEY = 'test-provider-key';
  process.env.WIDGY_LOCATION_ACCESS_TOKEN = 'x'.repeat(43);
  const forbidden = await request('GET', '&lat=1&lon=2');
  assert.equal(forbidden.code, 403);
  assert.deepEqual(forbidden.body, {error: 'Location unavailable'});
  assert.equal((await request('GET', '&location_key=' + 'z'.repeat(43) + '&lat=1&lon=2')).code, 403);
  assert.equal((await request('GET', '&location_key=' + 'x'.repeat(43) + '&lat=91&lon=2')).code, 400);
  const post = await request('POST');
  assert.equal(post.code, 405);
  assert.equal(post.headers.allow, 'GET, OPTIONS');
  console.log('PASS: dispatched opaque-origin CORS; preflight without provider/auth; private errors; actual GET still enforces token/GPS; POST forbidden');
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
