import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {EXPECTED,HOSTS,measureHost,runHostTiming,summarize,formatReport} from './map-host-timing.js';

const source=readFileSync(new URL('../assets/earth/Terrain_Master_3306x1558.png',import.meta.url));
assert.equal(source.length,EXPECTED.bytes);
assert.equal(createHash('sha256').update(source).digest('hex'),EXPECTED.sha256);
assert(HOSTS[1].url.includes('@ce01dd4ac62c2f0da8f02cb780b8363fb358400a/'));
assert(!HOSTS.some(h=>/api\/|token|lat=|lon=/.test(h.url)));
let clock=0,active=0,peak=0;
const options={now:()=>clock,
  fetcher:async(_,opts)=>{
    assert.equal(opts.credentials,'omit');assert.equal(opts.referrerPolicy,'no-referrer');assert.equal(opts.cache,'no-store');
    active++;peak=Math.max(peak,active);clock+=120;
    return {ok:true,status:200,headers:new Headers({'Content-Type':'image/png'}),arrayBuffer:async()=>{clock+=50;active--;return {byteLength:EXPECTED.bytes};}};
  },decode:async()=>{clock+=15;return [3306,1558];},hash:async()=>{clock+=30;return EXPECTED.sha256;}
};
const row=await measureHost(HOSTS[0],options);
assert(row.ok);assert.equal(row.totalMs,185);assert.equal(row.downloadMs,170);assert.equal(row.imageLoadMs,15); // Hash excluded.
for(const first of [0,1]){
  const rows=await runHostTiming({...options,first});
  assert.equal(peak,1);assert.equal(rows.length,6);assert(rows.every(r=>r.ok));
  assert.deepEqual(rows.map(r=>r.host),first===0?['vercel','jsdelivr','jsdelivr','vercel','vercel','jsdelivr']:['jsdelivr','vercel','vercel','jsdelivr','jsdelivr','vercel']);
  assert.deepEqual(summarize(rows).map(r=>r.repeatMeanMs),[185,185]);
  const report=JSON.parse(formatReport(rows));assert.equal(report.results.length,6);
  rows[0].totalMs=9999;assert.equal(summarize(rows)[0].repeatMeanMs,185); // First round excluded.
  rows[2].ok=false;assert(summarize(rows).some(r=>r.repeatMeanMs===null)); // No partial mean.
}
for(const [override,error] of [
  [{fetcher:async()=>new Response('fail',{status:503})},'http_503'],
  [{fetcher:async()=>new Response('html',{headers:{'Content-Type':'text/html'}})},'not_png'],
  [{hash:async()=>'bad'},'different_file'],
  [{decode:async()=>[1102,519]},'different_dimensions']
])assert.equal((await measureHost(HOSTS[0],{...options,...override})).error,error);
const timeout=await measureHost(HOSTS[0],{timeoutMs:5,fetcher:async(_,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(Error('abort')),{once:true}))});
assert.equal(timeout.error,'timeout');
const controller=new AbortController();controller.abort();
assert.deepEqual(await runHostTiming({...options,signal:controller.signal}),[]);
const midRun=new AbortController();
const partial=await runHostTiming({...options,signal:midRun.signal,onResult:()=>midRun.abort()});
assert.equal(partial.length,1);assert(summarize(partial).every(r=>r.repeatMeanMs===null));
console.log('PASS: source identity, immutable alternate CDN, sequential alternating rounds, phase timing, hash exclusion, first/repeat separation, incomplete results, HTTP/type/hash/dimension failures, timeout and cancel. Synthetic data only.');
