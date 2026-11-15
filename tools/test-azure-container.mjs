// Run through docker exec in the production image with --network none.
// Synthetic credentials only; no Azure, real location, or quota-store access.
import assert from 'node:assert/strict';
import sharp from 'sharp';

assert.notEqual(process.getuid(), 0, 'container must run as non-root');
const origin = 'http://127.0.0.1:8080';
let health;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    health = await fetch(origin + '/health', {signal: AbortSignal.timeout(1000)});
    if (health.ok) break;
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 200));
}
assert.equal(health?.status, 200, 'image must start with all required assets');
assert.equal((await fetch(origin + '/unrelated')).status, 404);

const transfer = '11111111-2222-4333-8444-555555555555';
const params = new URLSearchParams({
  delivery: 'vercel-file-v1', native_file: '1', width: '2400',
  shared_location: '1', mode: 'live', presentation: 'glass', atlas: 'r6',
  transfer_id: transfer, lat: '10.12345', lon: '20.12345',
  at: '2026-11-15T18:00:00Z', reuse: '60',
});
assert.equal((await fetch(origin + '/api/night-map?' + params)).status, 403);
params.set('location_key', process.env.WIDGY_MAP_FILE_ACCESS_TOKEN);
const response = await fetch(origin + '/api/night-map?' + params, {
  signal: AbortSignal.timeout(30000),
});
assert.equal(response.status, 200);
assert.equal(response.headers.get('content-type'), 'application/octet-stream');
assert.equal(response.headers.get('x-map-host'), 'azure-container-apps-trial-v1');
const png = Buffer.from(await response.arrayBuffer());
assert.equal(Number(response.headers.get('content-length')), png.length);
assert(png.includes(Buffer.from('WorldGlassTransfer\0' + transfer)));
const metadata = await sharp(png).metadata();
assert.equal(metadata.width, 2400);
assert.equal(metadata.height, 1131);
assert(metadata.hasProfile);
await sharp(png).raw().toBuffer();
console.log(JSON.stringify({result: 'ok', width: metadata.width, height: metadata.height,
  byteCount: png.length, uid: process.getuid(), externalNetwork: 'disabled'}));
