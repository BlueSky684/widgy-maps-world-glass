import {createMapURLDiagnostics} from '../lib/map-url-diagnostics.js';
import {observeMapResponseCompletion} from '../lib/map-response-completion.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {createCityReuseCache} from '../lib/city-reuse-cache.js';
import {createMapRenderCache} from '../lib/map-render-cache.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';
import {compareMapRequestKeys, readCityTimingTrace} from '../lib/map-request-key-diagnostics.js';
import {buildCityMapScript} from './widgy-city-map-script.mjs';
import {withServerCityReuse} from './server-city-reuse.js';

const scope='a'.repeat(32), start=1791475033000;
let now=start, geocodes=0, reads=0, renders=0;
class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const logs=[];
function instance() {
  const ctx={observeMapResponseCompletion,Date:Clock,URLSearchParams,createMapURLDiagnostics,Buffer,randomUUID,compareMapRequestKeys,readCityTimingTrace,
    performance:{now:()=>now},console:{info:s=>logs.push(JSON.parse(s)),error(){}},
    parseMapRequest,resolveLocation,REVISION:'synthetic',precomputedState:()=> 'HIT',
    createCityReuseCache:()=>createCityReuseCache({now:()=>now}),
    createMapRenderCache:()=>createMapRenderCache({now:()=>now}),
    async renderHomeMap(options){renders++;return Buffer.from(JSON.stringify(options));}};
  const code=readFileSync(new URL('../api/night-map.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
  vm.runInNewContext(code,ctx);
  return async function request(url,method='GET') {
    const res={headers:{},code:null,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},status(c){this.code=c;return this},send(b){this.body=b;return this},json(b){this.body=b;return this},end(){return this}};
    await ctx.handler({url,method,headers:{}},res);return res;
  };
}
const route=instance();
const input=process.argv[2]?JSON.parse(readFileSync(process.argv[2],'utf8')):{'1':[],'3':'Control','4':'Control','36':[{'1':'map_request','3':{'66':[{'5':'Javascript','6':'Async + No main()','10':buildCityMapScript('https://example.test/api/night-map?width=3306&atlas=r6&presentation=glass',{enabled:true,reuseSeconds:60,cityReuseSeconds:3600})}]}}]};
const get=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const snapshot=structuredClone(input),output=withServerCityReuse(input,scope),restored=structuredClone(output);
restored['3']=input['3'];restored['4']=input['4'];get(restored)['10']=get(input)['10'];
assert.deepEqual(restored,input,'Only one script and identifying metadata change');assert.deepEqual(input,snapshot);
const script=get(output)['10'];new vm.Script(script);
async function phone({lat='0',lon='0',server=route,cacheFailure=false,cacheData=null,geoFailure=false,memory=null,syncFailure=false}={}) {
  const sent=[],calls=[];
  const ctx={Date:Clock,sendToWidgy:u=>sent.push(u),fetch(url){
    calls.push(url);
    if(url.includes('reverse-geocode-client')) {
      geocodes++;
      if(geoFailure)return Promise.reject(Error('offline'));
      const u=new URL(url);return Promise.resolve({ok:true,json:async()=>({latitude:Number(u.searchParams.get('latitude')),longitude:Number(u.searchParams.get('longitude')),city:'Example',lookupSource:'coordinates'})});
    }
    reads++;
    if(syncFailure)throw Error('cache unavailable');
    if(cacheFailure)return Promise.reject(Error('cache unavailable'));
    return cacheData?Promise.resolve({ok:true,json:async()=>cacheData}):server(url).then(r=>({ok:r.code===200,json:async()=>r.body}));
  }};
  if(memory)ctx.__homeGlassCityV1=memory;
  vm.runInNewContext(script.replace(/\$\{widgy\.([^}]+)\}/g,(_,name)=>({map_latitude_max5:lat,map_longitude_max5:lon,Latitude:lat,Longitude:lon}[name])),ctx);
  for(let n=0;n<50;n++)await Promise.resolve();
  assert.equal(sent.length,1,'Exactly one final map callback');
  return {url:new URL(sent[0]),calls};
}
const cold=await phone();assert.equal(geocodes,1);assert.equal(cold.calls.length,2);
assert.equal(cold.url.searchParams.get('city'),'Example');assert.equal(cold.url.searchParams.get('city_cache_time'),String(now));
const image=await route(cold.url.href);assert.equal(image.code,200);
const original=new URL(cold.url);for(const p of ['city_cache_v1','city_cache_scope','city_cache_time'])original.searchParams.delete(p);
assert.deepEqual((await route(original.href)).body,image.body,'New parameters do not alter rendered image or cache identity');
now+=10000;
const warm=await phone();assert.equal(geocodes,1,'Fresh JS context reuses server city');assert.equal(warm.calls.length,1);
assert.equal(warm.url.searchParams.get('city_cache_time'),String(start));
assert.equal((await route(warm.url.href)).headers['x-map-cache'],'HIT');
const readURL=new URL(warm.calls[0]);
const json=await route(readURL.href);assert.equal(json.body.state,'HIT');assert.equal(json.headers['cache-control'],'private, max-age=3590, must-revalidate');
assert.equal(json.headers['cdn-cache-control'],'no-store');assert.equal(json.headers['vercel-cdn-cache-control'],'no-store');
const otherScope=new URL(readURL);otherScope.searchParams.set('city_cache_scope','b'.repeat(32));assert.equal((await route(otherScope.href)).body.state,'MISS');
const changed=await phone({lat:'0.00001'});assert.equal(changed.calls.length,2,'Exact GPS change requires fresh city');assert.equal(changed.url.searchParams.get('lat'),'0.00001');
const freshInstance=await phone({server:instance()});assert.equal(freshInstance.calls.length,2,'Cold instance safely falls back');
const invalidScope=new URL(readURL);invalidScope.searchParams.append('city_cache_scope',scope);assert.equal((await route(invalidScope.href)).code,400);
assert.equal((await route(readURL.href,'POST')).code,405);assert.equal((await route(readURL.href,'HEAD')).body,null);
const priorRenders=renders;await route(readURL.href);assert.equal(renders,priorRenders,'City read never renders a map');
for(const options of [{cacheFailure:true},{syncFailure:true},{cacheData:{state:'HIT',entry:{latitude:1,longitude:0,city:'Wrong',observedAt:now}}},{cacheData:{state:'HIT',entry:{latitude:0,longitude:0,city:'Stale',observedAt:now-3600000}}},{cacheData:{state:'HIT',entry:{latitude:0,longitude:0,city:'Future',observedAt:now+1}}}]) {
  const result=await phone(options);assert.equal(result.calls.length,2);assert.equal(result.url.searchParams.get('city'),'Example');
}
const failed=await phone({cacheFailure:true,geoFailure:true});assert.equal(failed.url.searchParams.get('city'),null);assert.equal(failed.url.searchParams.get('lat'),'0');
const invalid=await phone({lat:''});assert.equal(invalid.calls.length,0);assert.equal(invalid.url.searchParams.get('lat'),'');
const mem=await phone({memory:{latitude:0,longitude:0,city:'Example',time:start}});assert.equal(mem.calls.length,0);assert.equal(mem.url.searchParams.get('city_cache_time'),String(start));
now=start+3599999;await route(warm.url.href);assert.equal((await route(readURL.href)).body.state,'HIT');
now=start+3600000;await route(warm.url.href);assert.equal((await route(readURL.href)).body.state,'MISS','Repeated maps must not extend TTL');
assert.equal((await phone()).calls.length,2,'Expired city triggers fresh phone geocoder');
const small=createCityReuseCache({now:()=>now,maxEntries:2});
function seed(n,time=now){const u=new URL(cold.url);u.searchParams.set('lat',String(n));u.searchParams.set('city_cache_time',String(time));small.remember(u);u.searchParams.set('city_cache_v1','read');return u;}
const a=seed(0),b=seed(1);small.read(a);seed(2);assert.equal(small.read(b).state,'MISS','LRU is bounded');assert.equal(small.read(a).state,'HIT');
const old=seed(0,now-1000);assert.equal(small.read(old).entry.observedAt,now,'Older observations cannot overwrite newer data');
for(const secret of [scope,'Example','city_cache_scope','lat=','lon='])assert(!JSON.stringify(logs).includes(secret),'No private cache contents in logs');
assert.throws(()=>withServerCityReuse(input,'invalid'));
console.log('PASS: one-script delta; fresh-context cache reuse; exact GPS/scope isolation; no renderer on city read; stable image bytes/cache identity; expiry without extension; bounded LRU; cold/error/invalid cache fallback; one callback; unchanged GPS; private HTTP/logging.');
