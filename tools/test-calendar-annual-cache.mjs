import assert from 'node:assert/strict';
import {createAnnualProviderCache} from '../lib/calendar-bridge/annual-provider-cache.js';
const tick=()=>new Promise(r=>setTimeout(r,0));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
let time=100000,calls=0,gets=0,sets=0;
const rows=[{uid:'A',title:'Original',start:'2026-11-05',end:'2026-11-06',color:0}];
const remoteData=new Map(),tasks=[];
const remote=()=>({get:async k=>{gets++;return structuredClone(remoteData.get(k));},
  set:async(k,v,{ttl})=>{sets++;assert(ttl>0 && ttl<=900);remoteData.set(k,structuredClone(v));}});
const create=opts=>createAnnualProviderCache({remote,now:()=>time,background:p=>tasks.push(p),ioMs:5,...opts});
const fetcher=async()=>{calls++;return structuredClone(rows);};
const read=create();
let result=await read('A',fetcher);assert.equal(result.state,'MISS');assert.equal(calls,1);
const original=result.entry;original.monthViews=new Map([['November',{png:'original PNG'}]]);original.dayIndex={days:'original days'};
assert.equal(original.until,160000);assert.equal(original.retainUntil,1000000);
await Promise.all(tasks);assert.equal(sets,1);
time+=10000;assert.equal((await read('A',fetcher)).entry,original);assert.equal(gets,1);
const second=create();assert.equal((await second('A',fetcher)).state,'SHARED');assert.equal(calls,1);

// A month immediately receives the complete prior snapshot. TODAY joins the
// same pending refresh and waits; neither path starts another provider call.
time=160000;const gate=deferred();let refreshCalls=0;
const refresh=async()=>{refreshCalls++;return gate.promise;};
result=await read('A',refresh);assert.equal(result.state,'STALE');assert.equal(result.entry,original);
await tick();assert.equal(refreshCalls,1);
let todayDone=false;const today=read('A',refresh,{requireFresh:true}).then(x=>{todayDone=true;return x;});
await tick();assert.equal(todayDone,false);
for(let i=0;i<12;i++)assert.equal((await read('A',refresh)).entry,original);
assert.equal(refreshCalls,1);gate.resolve(structuredClone(rows));
const renewed=await today;await Promise.all(tasks);
assert.equal(renewed.entry.until,220000);assert.equal(original.until,160000,'Old readers keep original freshness metadata');
assert.equal(renewed.entry.monthViews,original.monthViews);assert.equal(renewed.entry.dayIndex,original.dayIndex);
assert.equal(renewed.entry.events,original.events,'Unchanged validated content retains parsed event identities');

// Edits/additions/deletions invalidate every old rendered view; no merge can
// resurrect removed events. A genuine successful empty calendar is valid.
time=220000;const changed=[{...rows[0],title:'Edited'}, {...rows[0],uid:'B',title:'New'}];
const updated=await read('A',async()=>changed,{requireFresh:true});
assert.deepEqual(updated.entry.events,changed);assert.equal(updated.entry.monthViews,undefined);assert.equal(updated.entry.dayIndex,undefined);
time+=60000;const removed=await read('A',async()=>[changed[1]],{requireFresh:true});assert.deepEqual(removed.entry.events,[changed[1]]);
time+=60000;assert.deepEqual((await read('A',async()=>[],{requireFresh:true})).entry.events,[]);

// A failing or invalid refresh cannot replace a last good complete snapshot.
const safety=create();let tries=0;
const good=await safety('safe',fetcher);await Promise.all(tasks);const lastRemote=remoteData.get('safe');
time+=60000;
const fail=async()=>{tries++;throw Error('provider outage');};
result=await safety('safe',fail,{requireFresh:true});assert.equal(result.state,'STALE-ERROR');assert.equal(result.entry,good.entry);
assert.equal(remoteData.get('safe'),lastRemote);assert.equal(tries,1);
time+=14000;assert.equal((await safety('safe',fail)).state,'STALE-ERROR');assert.equal(tries,1);
time+=1000;await safety('safe',fail,{requireFresh:true});assert.equal(tries,2,'Backoff expires; hits do not slide it');
time=good.entry.retainUntil;await assert.rejects(safety('safe',fail));assert.equal(good.entry.retainUntil,lastRemote.retainUntil);
await assert.rejects(safety('other-account',fail),'Never use another account as fallback');

// Validation completes before publication; malformed success is not a new
// generation. Capacity errors can explicitly bypass stale fallback.
time+=20000;const validation=create();let prepared=0;
const prepareSnapshot=e=>{prepared++;if(e.events.some(x=>x.invalid))throw Error('invalid event');e.dayIndex={validated:true};};
const v=await validation('validated',fetcher,{prepareSnapshot});await Promise.all(tasks);time+=60000;
const invalid=await validation('validated',async()=>[{invalid:true}],{requireFresh:true,prepareSnapshot});
assert.equal(invalid.state,'STALE-ERROR');assert.equal(invalid.entry,v.entry);assert.equal(prepared,2);
time+=15000;await assert.rejects(validation('validated',async()=>{throw Object.assign(Error('dense'),{code:'event_limit'});},
 {requireFresh:true,canServeStale:e=>e.code!=='event_limit'}));

// A fresh process can serve a retained shared snapshot before the provider
// returns, then publish the complete refreshed result through background work.
time+=20000;const warm=create();await warm('remote-stale',fetcher);await Promise.all(tasks);time+=60000;
const remoteGate=deferred(),newProcess=create();let remoteFetch=0;
result=await newProcess('remote-stale',()=>{remoteFetch++;return remoteGate.promise;});
assert.equal(result.state,'STALE');await tick();assert.equal(remoteFetch,1);
remoteGate.resolve(rows);await Promise.all(tasks);

// All cold concurrent readers share one pending provider operation.
const single=create(),burstGate=deferred();let burstCalls=0;
const burst=Array.from({length:20},()=>single('burst',()=>{burstCalls++;return burstGate.promise;}));
await tick();assert.equal(burstCalls,1);burstGate.resolve([]);await Promise.all(burst);

// Cache failures stay optional, and the snapshot deadline is never invented,
// renewed by a hit, accepted from the future, or accepted with corrupt content.
for(const get of [()=>{throw Error('cache')},()=>new Promise(()=>{})]) {
 const instance=create({remote:()=>({get,set:()=>new Promise(()=>{})})});assert.equal((await instance('cache-failed',fetcher)).state,'MISS');
}
const freshRecord=structuredClone(remoteData.get('remote-stale'));
for(const patch of [{version:99},{startedAt:time+1},{until:time+60001},{events:[{corrupt:true}]},{revision:'wrong'},{retainUntil:time}]) {
 const instance=create({remote:()=>({get:()=>({...freshRecord,...patch})})});assert.equal((await instance('invalid',fetcher)).state,'MISS');
}
const limited=create({remote:()=>({get:()=>undefined}),background:()=>{throw Error('no lifecycle');}});let limitedCalls=0;
for(let i=0;i<51;i++)await limited(String(i),async()=>{limitedCalls++;return [];});
await limited('0',async()=>{limitedCalls++;return [];});assert.equal(limitedCalls,52);
await Promise.all(tasks);
console.log('PASS: 60s freshness/15m retention, immediate stale return, TODAY waits, single-flight, unchanged PNG reuse, additions/edits/deletions/empty success, last-good failure retention, validation-before-publication, non-sliding backoff, shared cache, isolation, corruption and capacity bounds.');
