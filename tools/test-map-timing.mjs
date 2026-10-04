import assert from 'node:assert/strict';
import {MAP_TIMING_CASES,measureMapRequest,runMapTiming,formatResults} from './widgy-map-timing.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/home-map-v122.js';

assert.equal(MAP_TIMING_CASES.length,4);
assert.equal(MAP_TIMING_CASES[2].url,MAP_TIMING_CASES[3].url);
for(const test of MAP_TIMING_CASES){
  assert(test.url.startsWith('/') && !test.url.startsWith('//'));
  assert(!/token|calendar|geocode/.test(test.url));
  if(!test.url.startsWith('/api/'))continue;
  const u=parseMapRequest(test.url);
  assert.equal(u.searchParams.get('width'),'3306');
  const location=resolveLocation(u,{'x-vercel-ip-latitude':'12','x-vercel-ip-longitude':'45','x-vercel-ip-city':'Ignored'});
  if(test.id==='live-plain')assert.equal(location,null);
  else{assert.equal(location.latitude,0);assert.equal(location.longitude,0);assert.equal(location.city,'Example');}
}
let clock=0;
const options={
  now:()=>clock,
  fetcher:async(url,opts)=>{
    assert.equal(opts.credentials,'omit');assert.equal(opts.cache,'no-store');assert(!opts.signal.aborted);
    clock+=120;
    return {ok:true,status:200,headers:new Headers({'Content-Type':'image/png','Server-Timing':'map;dur=40.1','X-Map-Cache':'HIT'}),blob:async()=>{clock+=50;return {size:4075465};}};
  },
  decode:async blob=>{assert.equal(blob.size,4075465);clock+=15;return {width:3306,height:1558};}
};
const row=await measureMapRequest(MAP_TIMING_CASES[0],options);
assert.equal(row.ok,true);assert.equal(row.headersMs,120);assert.equal(row.bodyMs,50);assert.equal(row.decodeMs,15);assert.equal(row.totalMs,185);
assert.equal(row.serverTiming,'map;dur=40.1'); // Server duration stays a subset, not added again.
const order=[];
const rows=await runMapTiming({...options,onStart:t=>order.push('start:'+t.id),onResult:r=>order.push('end:'+r.id)});
assert.equal(rows.length,4);assert(rows.every(r=>r.ok));
assert.deepEqual(order,MAP_TIMING_CASES.flatMap(t=>['start:'+t.id,'end:'+t.id]));
assert.equal(JSON.parse(formatResults(rows)).results.length,4);
const failed=await measureMapRequest(MAP_TIMING_CASES[0],{...options,fetcher:async()=>new Response('Error',{status:503})});
assert.equal(failed.error,'http_503');assert.equal(failed.ok,false);assert.equal(failed.bytes,undefined);
const notPNG=await measureMapRequest(MAP_TIMING_CASES[0],{...options,fetcher:async()=>new Response('{}',{headers:{'Content-Type':'application/json'}})});
assert.equal(notPNG.error,'not_png');
const wrongSize=await measureMapRequest(MAP_TIMING_CASES[0],{...options,decode:async()=>({width:1653,height:779})});
assert.equal(wrongSize.error,'unexpected_dimensions');
const controller=new AbortController();controller.abort();
let requests=0;
assert.deepEqual(await runMapTiming({...options,signal:controller.signal,fetcher:async()=>{requests++;}}),[]);
assert.equal(requests,0);
const timeout=await measureMapRequest(MAP_TIMING_CASES[0],{timeoutMs:5,fetcher:async(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}))});
assert.equal(timeout.error,'timeout');
const midRun=new AbortController();
const partial=await runMapTiming({...options,signal:midRun.signal,onResult:()=>midRun.abort()});
assert.equal(partial.length,1);
console.log('Passed: explicit synthetic location overrides IP fallback, four serial requests, phase timings without double-counting server time, JSON copy report, HTTP/type/size errors, timeout and cancellation. No real network, location or calendar requests.');
