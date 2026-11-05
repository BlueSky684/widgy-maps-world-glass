import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash,timingSafeEqual} from 'node:crypto';
const code=readFileSync(new URL('../lib/location/shared.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','');
const timers=[];let remote=new Map(),tasks=[],providerCalls=0,time=10000000,providerOffline=false;
const env={BIGDATACLOUD_API_KEY:'provider',WIDGY_LOCATION_ACCESS_TOKEN:'x'.repeat(43)};
const ctx=vm.createContext({URL,URLSearchParams,Buffer,AbortSignal,createHash,timingSafeEqual,Number,Promise,Map,
  Date:class extends Date {static now(){return time;}},process:{env},console:{info(){}},
  setTimeout,clearTimeout,reserveBudget:async()=>{},waitUntil:p=>tasks.push(p),
  getCache:()=>({get:async k=>remote.get(k),set:async(k,v)=>remote.set(k,v)}),
  fetch:async url=>{providerCalls++;if(providerOffline)throw Error('offline');return {ok:true,json:async()=>({latitude:Number(url.searchParams.get('latitude')),longitude:Number(url.searchParams.get('longitude')),city:'Ashqelon',countryName:'Israel'})};}});
const api=vm.runInContext(code+'\n({createSharedLocation,locationClientMaxAge,locationHandler,coordinates})',ctx);
const point={latitude:1,longitude:2};
const options={env:()=>env,now:()=>time,reserve:async()=>{},defer:p=>tasks.push(p)};
const first=api.createSharedLocation(options);
const burst=await Promise.all(Array.from({length:20},()=>first(point)));
assert.equal(providerCalls,1);assert(burst.every(v=>v.entry.city==='Ashkelon'));await Promise.all(tasks);
assert.equal((await api.createSharedLocation(options)(point)).state,'SHARED');assert.equal(providerCalls,1);
const fresh=burst[0];assert.equal(api.locationClientMaxAge(fresh,time),60);
assert.equal(api.locationClientMaxAge(fresh,time+3598001),1);
assert.equal(api.locationClientMaxAge(fresh,time+3599001),0);
assert.equal(api.locationClientMaxAge(fresh,time+3600000),0);
for(const bad of [null,{state:'STALE',entry:fresh.entry},{state:'UNKNOWN',entry:fresh.entry},{state:'LOOKUP',entry:{observedAt:time+1}},{state:'LOOKUP',entry:{observedAt:'10000000'}},{state:'LOOKUP',entry:{observedAt:NaN}}])assert.equal(api.locationClientMaxAge(bad,time),0);
// The response must settle while the cache write is still unresolved.
let release,writeStarted=false,writeFinished=false;
const paused=api.createSharedLocation({...options,cache:()=>({get:async()=>null,set:()=>{writeStarted=true;return new Promise(r=>{release=()=>{writeFinished=true;r();};});}})});
const quick=await Promise.race([paused(point),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Response waited for cache write')),100);timers.push(t);})]);
assert.equal(quick.entry.city,'Ashkelon');assert.equal(writeStarted,true);assert.equal(writeFinished,false);release();await Promise.all(tasks);
for(const setter of [()=>{throw Error('sync');},()=>Promise.reject(Error('async')),()=>new Promise(()=>{})]) {
  const failed=api.createSharedLocation({...options,cache:()=>({get:async()=>null,set:setter}),defer:p=>tasks.push(p)});
  assert.equal((await failed(point)).state,'LOOKUP');assert.equal((await failed(point)).state,'MEMORY');
}
// Failed lifecycle registration is optional and must not affect the city.
assert.equal((await api.createSharedLocation({...options,defer:()=>{throw Error('no lifecycle');},cache:()=>({get:async()=>null,set:async()=>{}})})(point)).state,'LOOKUP');
await Promise.all(tasks);
const response=()=>({headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;},end(){return this;}});
async function request(method,query='') {
 const res=response();await api.locationHandler({method,url:'/api/fetch-probe?location_shared=1'+query},res);
 assert.equal(res.headers['cdn-cache-control'],'no-store');assert.equal(res.headers['vercel-cdn-cache-control'],'no-store');
 assert.equal(res.headers['access-control-allow-origin'],'*');return res;
}
const query='&location_key='+env.WIDGY_LOCATION_ACCESS_TOKEN+'&lat=1&lon=2';
const success=await request('GET',query);assert.equal(success.code,200);assert.equal(success.headers['cache-control'],'private, max-age=60, must-revalidate');
const callsBefore=providerCalls;
for(const [method,q,status] of [['GET','&lat=1&lon=2',403],['GET',query.replace('lat=1','lat=91'),400],['POST',query,405],['OPTIONS','',204]]){
 const r=await request(method,q);assert.equal(r.code,status);assert.equal(r.headers['cache-control'],'private, no-store');
}
assert.equal(providerCalls,callsBefore,'Auth/validation/preflight cannot call provider');
// Exact-coordinate, credential and source freshness behavior is unchanged.
await first({latitude:3,longitude:4});assert.equal(providerCalls,callsBefore+1);
time+=3600001;providerOffline=true;
const stale=await request('GET',query);assert.equal(stale.code,200);assert.equal(stale.body.state,'STALE');assert.equal(stale.headers['cache-control'],'private, no-store');
time+=21600000;const unavailable=await request('GET',query);assert.equal(unavailable.code,502);assert.equal(unavailable.headers['cache-control'],'private, no-store');
for(const t of timers)clearTimeout(t);await Promise.all(tasks);
console.log('PASS: nonblocking cache persistence, lifecycle/write failures, single-flight, shared reuse, exact coordinates, private bounded TTL, auth/CORS/methods and stale/error no-store.');
