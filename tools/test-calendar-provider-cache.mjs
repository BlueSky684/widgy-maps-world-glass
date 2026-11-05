import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../lib/calendar-bridge/provider-cache.js',import.meta.url),'utf8')
  .replace(/^import.*\n/,'').replaceAll('export ','');
const create=vm.runInNewContext(code+'\ncreateProviderCache',{
  setTimeout,clearTimeout,Date,getCache:()=>{},waitUntil:()=>{}
});
let time=100000,calls=0,gets=0,sets=0;
const data=new Map(),tasks=[];
const remote=()=>({get:async key=>{gets++;return structuredClone(data.get(key));},
  set:async(key,value,{ttl})=>{sets++;assert(ttl>0&&ttl<=60);data.set(key,structuredClone(value));}});
const createInstance=opts=>create({remote,now:()=>time,background:p=>tasks.push(p),...opts});
const events=[{title:'אימון "צוות" ${text}',start:'2026-11-05T09:00:00Z',end:'2026-11-05T10:00:00Z',allDay:false}];
const fetcher=async()=>{calls++;return structuredClone(events);};
const first=createInstance();
let result=await first('A',fetcher);
assert.equal(result.state,'MISS');assert.equal(result.entry.until,160000);
await Promise.all(tasks);
assert.equal(sets,1);
time+=10000;
result=await first('A',fetcher);assert.equal(result.state,'REUSE');assert.equal(calls,1);assert.equal(gets,1);
// A genuinely different cache instance must reuse the shared value.
const second=createInstance();
result=await second('A',fetcher);assert.equal(result.state,'SHARED');assert.equal(calls,1);
assert.equal(result.entry.until,160000);assert.deepEqual(await result.entry.pending,events);
time=159999;result=await second('A',fetcher);assert.equal(calls,1);assert.equal(result.entry.until,160000);
time=160000;result=await second('A',fetcher);assert.equal(result.state,'MISS');assert.equal(calls,2);
await Promise.all(tasks);
await second('other-token-or-month',fetcher);assert.equal(calls,3);
// Twenty simultaneous requests in one process make one provider call.
let release;const pending=new Promise(r=>release=r), single=createInstance();let flightCalls=0;
const burst=Array.from({length:20},()=>single('burst',async()=>{flightCalls++;await pending;return [];}));
await new Promise(r=>setTimeout(r,5));assert.equal(flightCalls,1);release();await Promise.all(burst);
// Rejections evict just the failed entry and the next request can recover.
const recover=createInstance();
await assert.rejects(recover('error',()=>Promise.reject(Error('provider'))));
assert.equal((await recover('error',fetcher)).state,'MISS');
// Cache unavailability and non-settling reads cannot block the provider.
for(const get of [()=>{throw Error('cache')},()=>new Promise(()=>{})]){
  const uncached=createInstance({remote:()=>({get}),ioMs:5});
  assert.equal((await uncached('unavailable',fetcher)).state,'MISS');
}
// Invalid, future, expired, wrong-version, and renewed deadlines are misses.
for(const bad of [null,{version:2,events:[]},{version:1,startedAt:time+1,until:time+60001,events:[]},
  {version:1,startedAt:time-60000,until:time,events:[]},
  {version:1,startedAt:time-10000,until:time+60000,events:[]},
  {version:1,startedAt:time,until:time+60000,events:'invalid'}]){
  const reject=createInstance({remote:()=>({get:()=>bad})});
  assert.equal((await reject('invalid',fetcher)).state,'MISS');
}
// Slow provider work keeps the deadline anchored to its start.
const slow=createInstance();
result=await slow('slow',async()=>{time+=61000;return [];});
assert(result.entry.until<time);
// Memory is bounded and evicts old entries without changing the remote TTL.
const memory=createInstance({remote:()=>({get:()=>undefined})});let memoryCalls=0;
for(let i=0;i<51;i++)await memory(String(i),async()=>{memoryCalls++;return [];});
await memory('0',async()=>{memoryCalls++;return [];});assert.equal(memoryCalls,52);
await Promise.all(tasks);
console.log('Provider cache: cross-instance reuse, 60s boundary, isolation, single-flight, errors, slow cache, invalid records and capacity passed.');
