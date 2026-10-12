// Actual route and approved full-resolution renderer, with synthetic city
// service failures. No network, private GPS, provider quota or server mutation.
// Run: node --experimental-vm-modules tools/test-map-city-resilience-15.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {authorizeLocation,locationErrorStatus,createSharedLocation} from '../lib/location/shared.js';
import {resolveMapCity,MAP_CITY_DEADLINE_MS} from '../lib/location/map-city.js';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import {sharedLocationText} from './shared-location-widget.js';

const hash=b=>createHash('sha256').update(b).digest('hex');
const point={latitude:1,longitude:2},token='x'.repeat(43);
const env={WIDGY_LOCATION_ACCESS_TOKEN:token,BIGDATACLOUD_API_KEY:'synthetic'};
const at='2026-10-12T12:00:00.000Z';
const query=new URLSearchParams({shared_location:'1',location_key:token,lat:'1',lon:'2',at,width:'3306',presentation:'glass',atlas:'r6'});
const request='/api/night-map?'+query;
const good=async()=>({entry:{...point,city:'Test City'},state:'MEMORY'});
const current=fs.readFileSync(new URL('../api/night-map.js',import.meta.url),'utf8');
const beforePath=new URL('../work/private/city-fix-15-before-route.js',import.meta.url);
const rows=[];

async function route(source,{lookup=good,url=request,config=env}={}) {
  const events=[];
  const context=vm.createContext({URL,URLSearchParams,Date,Buffer,performance,process:{env:config},console:{info:v=>events.push(JSON.parse(v)),error(){}}});
  async function moduleFor(name) {
    let values;
    if(name==='../lib/location/shared.js')values={authorizeLocation:(u,e=config,o)=>authorizeLocation(u,e,o),locationErrorStatus,sharedLocation:lookup};
    else if(name==='../lib/location/map-city.js')values={resolveMapCity:p=>resolveMapCity(p,{lookup,deadlineMs:15,defer(){}})};
    else values=await import(name.startsWith('.')?new URL(name,new URL('../api/night-map.js',import.meta.url)):name);
    return new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v] of Object.entries(values))this.setExport(k,v);},{context});
  }
  const mod=new vm.SourceTextModule(source,{context,importModuleDynamically:async name=>{const m=await moduleFor(name);await m.link(()=>{});await m.evaluate();return m;}});
  await mod.link(moduleFor);await mod.evaluate();
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){return this;}};
  await mod.namespace.default({url,method:'GET',headers:{}},res);
  return {...res,events};
}

const expected=await renderHomeMap({date:new Date(at),location:{...point,city:'',source:'coordinates'},width:3306,presentation:'glass',atlas:'r6'});
async function validPNG(name,result,expectedBytes=expected) {
  assert.equal(result.statusCode,200);
  assert.equal(result.headers['Content-Type'],'image/png');
  assert(Buffer.isBuffer(result.body));
  assert(result.body.equals(expectedBytes),name+' changed approved pixels/geometry');
  const meta=await sharp(result.body).metadata();
  assert.equal(meta.width,3306);assert.equal(meta.height,1558);
  await sharp(result.body).raw().toBuffer(); // Complete decoding, not header only.
  rows.push({case:name,status:200,bytes:result.body.length,cityState:result.headers['X-Location-Cache'],sha256:hash(result.body)});
}
const failingLookup=createSharedLocation({env:()=>env,cache:()=>({get:async()=>null}),reserve:async()=>({used:1}),fetcher:async()=>{throw Error('synthetic provider outage');}});
const failed=await route(current,{lookup:failingLookup});
await validPNG('provider_failure_empty_cache',failed);
assert.equal(failed.headers['X-Location-Cache'],'UNAVAILABLE');
await validPNG('city_timeout',await route(current,{lookup:()=>new Promise(()=>{})}));
await validPNG('wrong_coordinate_result',await route(current,{lookup:async()=>({entry:{latitude:3,longitude:4,city:'Wrong'},state:'STALE'})}));
await validPNG('caller_city_ignored_on_failure',await route(current,{lookup:failingLookup,url:request+'&city=Wrong'}));
const missingProvider={WIDGY_LOCATION_ACCESS_TOKEN:token};
await validPNG('provider_unconfigured_but_authorized',await route(current,{config:missingProvider,lookup:createSharedLocation({env:()=>missingProvider})}));
const healthy=await route(current);
const healthyOracle=await renderHomeMap({date:new Date(at),location:{...point,city:'Test City',source:'coordinates'},width:3306,presentation:'glass',atlas:'r6'});
await validPNG('healthy_city',healthy,healthyOracle);
if(fs.existsSync(beforePath)) {
  const before=fs.readFileSync(beforePath,'utf8');
  const oldHealthy=await route(before);
  assert(oldHealthy.body.equals(healthy.body),'Healthy map changed relative to deployed baseline');
  const oldFailure=await route(before,{lookup:failingLookup});
  assert.equal(oldFailure.statusCode,502);assert(!Buffer.isBuffer(oldFailure.body));
}
for(const [name,url,config,status] of [
  ['bad_token',request.replace(token,'z'.repeat(43)),env,403],
  ['missing_token',request.replace('location_key='+token,'unused=1'),env,403],
  ['invalid_coordinate',request.replace('lat=1','lat=91'),env,400],
  ['duplicate_coordinate',request+'&lat=3',env,400],
  ['access_unconfigured',request,{},503]
]) {
  let calls=0;const r=await route(current,{url,config,lookup:async()=>{calls++;return good();}});
  assert.equal(r.statusCode,status,name);assert.equal(calls,0,name);assert(!Buffer.isBuffer(r.body));
}
assert.equal(MAP_CITY_DEADLINE_MS,1500);
let settle,background;
const delayed=resolveMapCity(point,{lookup:()=>new Promise(r=>{settle=r;}),deadlineMs:10,defer:p=>{background=p;}});
const timed=await delayed;assert.equal(timed.state,'TIMEOUT');
settle(await good());await background;assert.equal(timed.city,null);

// Run the exact serialized native script in a controlled JS context. Native
// Widgy scheduling remains a device gate; these cover the script's own logic.
async function client(fetcher,{abort=true,timers=true,lat='1'}={}) {
  const values=[],pendingTimers=new Map();let id=0,abortCount=0,fetches=0;
  const sandbox={sendToWidgy:v=>values.push(v),fetch:(...args)=>{fetches++;return fetcher(...args);}};
  if(timers){sandbox.setTimeout=(fn,ms)=>{assert.equal(ms,4000);pendingTimers.set(++id,fn);return id;};sandbox.clearTimeout=n=>pendingTimers.delete(n);}
  if(abort)sandbox.AbortController=class{signal={};abort(){abortCount++;}};
  vm.runInNewContext('('+sharedLocationText.toString()+')('+JSON.stringify(lat)+',"2","https://synthetic.invalid/location")',sandbox);
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  await flush();
  return {values,pendingTimers,flush,fire:async()=>{for(const fn of [...pendingTimers.values()])fn();await flush();},aborts:()=>abortCount,fetches:()=>fetches};
}
const response=entry=>({ok:true,json:async()=>({entry})});
const entry={...point,city:'Test City',countryName:'Country'};
const ok=await client(async()=>response(entry));assert.deepEqual(ok.values,['Test City, Country']);assert.equal(ok.pendingTimers.size,0);
let finishFetch;const pending=await client(()=>new Promise(r=>{finishFetch=r;}));
await pending.fire();assert.deepEqual(pending.values,['Location unavailable']);assert.equal(pending.aborts(),1);
finishFetch(response(entry));await pending.flush();assert.equal(pending.values.length,1);
const stalledBody=await client(async()=>({ok:true,json:()=>new Promise(()=>{})}),{abort:false});await stalledBody.fire();assert.deepEqual(stalledBody.values,['Location unavailable']);
for(const fetcher of [async()=>({ok:false}),async()=>{throw Error('offline');},()=>{throw Error('synchronous');},async()=>response({...entry,latitude:3})]) {
  const r=await client(fetcher);assert.deepEqual(r.values,['Location unavailable']);assert.equal(r.pendingTimers.size,0);
}
const noTimers=await client(async()=>response(entry),{timers:false});assert.deepEqual(noTimers.values,['Location unavailable']);assert.equal(noTimers.fetches(),0);
const invalid=await client(async()=>response(entry),{lat:'${widgy.unresolved}'});assert.deepEqual(invalid.values,['Location unavailable']);assert.equal(invalid.fetches(),0);
console.log(JSON.stringify({passed:true,rows,authorizationGuards:5,healthyImageByteIdentical:true,lateResultCannotOverwrite:true,clientDeadlineMs:4000,networkCalls:0,nativeWidgyVerification:'pending'},null,2));
