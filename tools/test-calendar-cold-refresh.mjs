import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createAnnualProviderCache} from '../lib/calendar-bridge/annual-provider-cache.js';
const tick=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const old=[{uid:'old'}],fresh=[{uid:'new'}];
function setup({prepare,fetcher}={}) {
  const record={version:2,startedAt:100000,until:160000,retainUntil:1000000,
    events:old,revision:createHash('sha256').update(JSON.stringify(old)).digest('hex')};
  const tasks=[],read=createAnnualProviderCache({now:()=>200000,background:p=>tasks.push(p),ioMs:100,
    remote:()=>({get:async()=>structuredClone(record),set:async()=>{}})});
  return {read:(requireFresh=true)=>read('account',fetcher,{requireFresh,prepareSnapshot:prepare}),tasks};
}

test('cold TODAY starts provider I/O before stale validation and still waits for current data',async()=>{
  const network=deferred(),validation=deferred();let started=false,prepared=false,calls=0;
  const context=setup({fetcher:async()=>{started=true;calls++;return network.promise;},prepare:async e=>{
    if(e.events[0]?.uid==='old'){assert(started,'Provider read must start first');await validation.promise;prepared=true;}
  }});
  let done=false;const today=context.read().then(r=>{done=true;return r;});
  await tick();assert(started);assert(!prepared);assert(!done);
  const month=context.read(false);
  validation.resolve();const stale=await month;
  assert.equal(stale.state,'STALE');assert.deepEqual(stale.entry.events,old);assert(!done);assert.equal(calls,1);
  network.resolve(fresh);const result=await today;
  assert.equal(result.state,'REFRESH');assert.deepEqual(result.entry.events,fresh);
  assert.equal(result.entry.startedAt,200000);assert.equal(result.entry.until,260000);
  await Promise.all(context.tasks);
});

test('provider rejection retains only a completely validated fallback, including async preparation',async()=>{
  for(const invalid of [false,true]) {
    const gate=deferred();let started=false;
    const context=setup({fetcher:async()=>{started=true;throw Error('provider unavailable');},prepare:async e=>{
      if(e.events[0]?.uid==='old'){assert(started);await gate.promise;if(invalid)throw Error('invalid snapshot');}
    }});
    const pending=context.read();const rejected=invalid?assert.rejects(pending,/provider unavailable/):null;
    await tick();gate.resolve();
    if(invalid)await rejected;
    else {const result=await pending;assert.equal(result.state,'STALE-ERROR');assert.deepEqual(result.entry.events,old);assert.equal(result.entry.until,160000);}
    await Promise.all(context.tasks);
  }
});

test('invalid old shared data never hides fresh data or becomes an empty success',async()=>{
  const context=setup({fetcher:async()=>fresh,prepare:e=>{if(e.events[0]?.uid==='old')throw Error('invalid snapshot');}});
  const result=await context.read();assert.equal(result.state,'MISS');assert.deepEqual(result.entry.events,fresh);
  await Promise.all(context.tasks);
});
