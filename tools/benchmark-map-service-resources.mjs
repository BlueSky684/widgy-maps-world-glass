// Offline sizing only: actual route, synthetic coordinates, no HTTP or user data.
// Run in a fresh process: node tools/benchmark-map-service-resources.mjs
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const round = n => +n.toFixed(3);
const memory = () => ({...process.memoryUsage(), maxRSSKiB: process.resourceUsage().maxRSS});
const beforeImport = memory(), importStart = performance.now();
const {default: handler} = await import('../api/night-map.js');
const importMs = round(performance.now() - importStart), afterImport = memory();
const samples = [];
async function request(id, latitude, longitude) {
  const res = {headers: {}, code: null, body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(code) { this.code = code; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; }};
  const query = new URLSearchParams({mode:'live', width:'3306', presentation:'glass',
    atlas:'r6', reuse:'60', lat:String(latitude), lon:String(longitude)});
  const cpu = process.cpuUsage(), started = performance.now();
  await handler({method:'GET', url:'/api/night-map?' + query, headers:{}}, res);
  const durationMs = round(performance.now() - started), usedCPU = process.cpuUsage(cpu);
  // Sample before hashing so digest overhead is outside the request sample.
  const resources = memory();
  assert.equal(res.code, 200);
  assert.equal(res.headers['cdn-cache-control'], 'no-store');
  assert.equal(res.body.readUInt32BE(16), 3306);
  assert.equal(res.body.readUInt32BE(20), 1558);
  const sample = {id, durationMs, cpuMs:round((usedCPU.user + usedCPU.system)/1000),
    cache:res.headers['x-map-cache'], bytes:res.body.length,
    renderedAt:res.headers['x-map-rendered-at'],
    sha256:createHash('sha256').update(res.body).digest('hex'), ...resources};
  samples.push(sample);
  return sample;
}
const first = await request('first-render', 0, 0);
const repeated = await request('same-map-ready', 0, 0);
assert.equal(first.cache, 'MISS');
assert.equal(repeated.cache, 'HIT');
assert.equal(first.sha256, repeated.sha256);
for (const [lat,lon] of [[20,20],[-20,-20],[45,90]]) await request('new-synthetic-location', lat, lon);
const retained = await request('first-map-still-retained', 0, 0);
assert.equal(retained.cache, 'HIT');
assert.equal(retained.sha256, first.sha256);
console.log(JSON.stringify({schema:1, kind:'offline-service-sizing-not-host-or-device-speed',
  measuredAt:new Date().toISOString(), baseline:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  node:process.version, platform:process.platform, importMs, beforeImport, afterImport, samples,
  limits:[
    'Fresh local process import is not a measured Vercel or Railway cold start.',
    'No network transfer, Widgy decoding, GPS acquisition, calendar or weather fetch is included.',
    'RSS is this local process, not a hosted memory bill or Widgy memory.',
    'CPU time sums process threads and is not equivalent to wall time or a guaranteed host allocation.',
    'Four synthetic cache entries; not a production concurrency or sustained workload test.',
    'Existing renderer, source masters, cache lifetime and response format are unchanged.'
  ]},null,2));
