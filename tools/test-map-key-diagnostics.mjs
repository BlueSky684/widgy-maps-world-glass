import {createMapURLDiagnostics} from '../lib/map-url-diagnostics.js';
import {observeMapResponseCompletion} from '../lib/map-response-completion.js';
import {createCityReuseCache} from '../lib/city-reuse-cache.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import vm from 'node:vm';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {compareMapRequestKeys, readCityTimingTrace} from '../lib/map-request-key-diagnostics.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';

let now = Date.parse('2026-10-08T14:47:59Z');
class Clock extends Date {constructor(...args){super(...(args.length ? args : [now]));} static now(){return now;}}
const route = readFileSync(new URL('../api/night-map.js', import.meta.url), 'utf8');
const parent = execFileSync('git', ['show', '7edf1016331e233dcb3ccdf02fe541d51b10345c:api/night-map.js'], {encoding:'utf8'});
function instance(source) {
  const logs = []; let renders = 0;
  const context = {observeMapResponseCompletion,Date:Clock, Buffer, URLSearchParams,createMapURLDiagnostics,createCityReuseCache:()=>createCityReuseCache({now:()=>now}), randomUUID, compareMapRequestKeys, readCityTimingTrace,
    performance:{now:()=>now}, console:{info:line=>logs.push(JSON.parse(line)), error(){}},
    parseMapRequest, resolveLocation, REVISION:'synthetic', precomputedState:()=> 'HIT',
    createMapRenderCache:()=>createMapRenderCache({now:()=>now}),
    async renderHomeMap(options){renders++; await Promise.resolve(); return Buffer.from(JSON.stringify(options));}};
  vm.runInNewContext(source.replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler'), context);
  return {logs, get renders(){return renders;}, async request(changes={}, headers={}, method='GET'){
    const query = new URLSearchParams({mode:'live', width:'3306', presentation:'glass', atlas:'r6', reuse:'60',
      lat:'0', lon:'0', city:'PRIVATE_CITY_SENTINEL', token:'PRIVATE_TOKEN_SENTINEL', ...changes});
    const response = {headers:{}, code:null, body:null,
      setHeader(k,v){this.headers[k.toLowerCase()]=v;}, status(c){this.code=c;return this;},
      send(b){this.body=b;return this;}, json(b){this.body=b;return this;}, end(){return this;}};
    await context.handler({url:'/api/night-map?'+query, method, headers}, response);
    return {code:response.code, body:response.body, headers:response.headers};
  }};
}
const before = instance(parent), after = instance(route);
async function compare(changes={}, headers={}, method='GET') {
  const [a,b] = await Promise.all([before.request(changes,headers,method), after.request(changes,headers,method)]);
  assert.deepEqual(b,a,'Instrumentation must not change the HTTP response');
  assert.equal(after.renders,before.renders,'Instrumentation must not add renderer calls');
  return b;
}
const prepared = () => after.logs.at(-1);
const first = await compare();
assert.equal(prepared().previousKeyComparison,'first');
assert.equal(prepared().instanceRequest,1);
assert.equal(prepared().urlForRenderKey,'first');
now += 2000;
const nextMinute = await compare({t:'next-minute'});
assert.equal(nextMinute.headers['x-map-cache'],'HIT');
assert.equal(prepared().previousKeyComparison,'same','Timestamp query is not a render-cache key');
assert.equal(prepared().previousRequestAgeMs,2000);
assert.equal(prepared().urlForRenderKey,'changed');
assert.equal(prepared().imageForRenderKey,'same');
assert.deepEqual(prepared().urlChangesForRenderKey,['minute_stamp']);
await compare({t:'next-minute'});
assert.equal(prepared().urlForRenderKey,'same');
await compare({}, {'if-none-match':first.headers.etag});
await compare({}, {}, 'HEAD');
await compare({lat:'0.00001'});
assert.deepEqual(prepared().previousKeyChanges,['coordinates']);
assert.equal(prepared().cache,'MISS','Exact GPS differences still invalidate the cache');
await compare({lat:'0.00001',city:'OTHER_PRIVATE_CITY'});
assert.deepEqual(prepared().previousKeyChanges,['city']);
await compare({lat:'0.00002'});
assert.deepEqual(prepared().previousKeyChanges,['coordinates','city']);
await compare({lat:''});
assert.deepEqual(prepared().previousKeyChanges,['location_availability']);
await compare({lat:'',width:'1653'});
assert.deepEqual(prepared().previousKeyChanges,['render_options']);
await compare({at:'2026-10-08T14:48:00Z'});
assert.equal(prepared().previousKeyComparison,'bypass');
await compare({lat:'',width:'1653'});
assert.equal(prepared().previousKeyComparison,'same','Bypass must not replace the previous reusable key');
now += 61000;
await compare({lat:'',width:'1653'});
assert.equal(prepared().cache,'MISS');
assert.equal(prepared().previousKeyComparison,'same','Same previous key does not imply an unexpired cache entry');
assert.equal(prepared().previousRequestAgeMs,61000);

now += 61000;
const [oldBurst,newBurst] = await Promise.all([
  Promise.all(Array.from({length:8},()=>before.request())),
  Promise.all(Array.from({length:8},()=>after.request()))
]);
assert.deepEqual(newBurst,oldBurst,'In-flight coalescing remains identical');
assert.equal(after.renders,before.renders);
assert.equal(newBurst.filter(r=>r.headers['x-map-cache']==='COALESCED').length,7);
const records = after.logs.filter(r=>r.phase==='prepared');
assert.equal(new Set(records.map(r=>r.instanceRequest)).size,records.length);
assert.equal(new Set(records.map(r=>r.instance)).size,1);
const other = instance(route);
await other.request();
assert.notEqual(other.logs[0].instance,after.logs[0].instance);
assert.equal(other.logs.at(-1).previousKeyComparison,'first');
const logText = JSON.stringify([...after.logs,...other.logs]);
for (const secret of ['PRIVATE_CITY_SENTINEL','OTHER_PRIVATE_CITY','PRIVATE_TOKEN_SENTINEL','lat=', 'lon=', '0.00001', first.headers.etag])
  assert(!logText.includes(secret),'No sensitive request/key/image contents in logs');
await compare({city_trace_v1:'fetch:2345'});
assert.equal(prepared().clientCityPath,'fetch');
assert.equal(prepared().clientCityScriptMs,2345);
assert.equal(prepared().cache,'HIT','Client timing must not change render-cache identity');
await compare({city_trace_v1:'PRIVATE_UNTRUSTED_SENTINEL'});
assert.equal(prepared().clientCityPath,undefined);
assert(!JSON.stringify(after.logs).includes('PRIVATE_UNTRUSTED_SENTINEL'));
const withoutCountry = await compare();
const withCountry = await compare({country_name:'PRIVATE_COUNTRY_SENTINEL'});
assert.deepEqual(withCountry.body, withoutCountry.body, 'Country metadata cannot change image contents');
assert.equal(withCountry.headers.etag, withoutCountry.headers.etag);
assert.equal(withCountry.headers['x-map-cache'], 'HIT', 'Country metadata cannot invalidate the render cache');
assert.equal(prepared().previousKeyComparison, 'same');
assert(!JSON.stringify(after.logs).includes('PRIVATE_COUNTRY_SENTINEL'));
console.log('PASS: parent-equivalent responses, exact GPS/city changes, minute crossing, expiry, bypass, concurrent coalescing, independent instance identity and private diagnostic fields.');
