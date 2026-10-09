import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {withCalendarCountryPair,calendarLocationPair} from './calendar-country-pair.js';
import {flatten} from './compact-widget-structure.js';
import {createCityReuseCache} from '../lib/city-reuse-cache.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';

const input=JSON.parse(readFileSync('../outputs/Widgy_Home_Direct_Data_1.json'));
const before=structuredClone(input),scope='e'.repeat(32),out=withCalendarCountryPair(input,scope);
const variable=(w,name)=>w['36'].find(v=>v['1']===name),source=(w,name)=>variable(w,name)['3']['66'][0];
const original=source(input,'map_request')['10'],script=source(out,'map_request')['10'];
const cal=w=>w['1'].find(n=>n.d0===247),row=w=>cal(w)['1'].find(n=>n.d0===81871);
assert.deepEqual(input,before,'Transform must not mutate baseline');
const restored=structuredClone(out);
restored['3']=input['3'];restored['4']=input['4'];
source(restored,'map_request')['10']=original;
restored['36']=restored['36'].filter(v=>!['calendar_native_country','calendar_location_pair'].includes(v['1']));
cal(restored)['1']=cal(restored)['1'].filter(n=>n.d0!==83204);
cal(restored)['1'][cal(restored)['1'].findIndex(n=>n.d0===81871)]=structuredClone(row(input));
assert.deepEqual(restored,input,'Every other field, action, source and Home layer is exact');
assert.deepEqual(row(out)['1'][0]['1'],row(input)['1'],'Native full-country branches retained verbatim');
assert.equal(flatten(out['1']).length,1192);assert.equal(out['36'].length,63);
const nodes=flatten(out['1']),ids=new Set(nodes.map(n=>n.d0));assert.equal(ids.size,nodes.length);
for(const n of nodes)if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id));
for(const n of [cal(out)['1'].find(n=>n.d0===83204),...row(out)['1'][1]['1']])
 for(const k of ['b','c','d','e','f','1'])assert.deepEqual(n[k],row(input)['1'][0][k],'Text font/geometry unchanged');
const visible=(ns,values)=>ns.flatMap(n=>{
 if(n.o1){const v=values[n.o1['0']]??'';if((n.o1['1']===0&&v!==n.o1['2'])||(n.o1['1']===1&&v===n.o1['2']))return [];}
 return n.z==='13'?visible(n['1'],values):[n];
});
const nc=variable(out,'calendar_native_city')['0'],co=variable(out,'calendar_native_country')['0'],pa=variable(out,'calendar_location_pair')['0'];
const pairLayer=cal(out)['1'].find(n=>n.d0===83204);
for(const city of ['Ashqelon','Ashkelon','Paris',''])for(const country of ['Israel','France',''])for(const pair of ['', 'Ashkelon, Israel']){
 const shown=visible([row(out),pairLayer],{[nc]:city,[co]:country,[pa]:pair});assert.equal(shown.length,1);
 assert.equal(shown[0].d0,pair?83204:country?(city==='Ashqelon'?81870:81869):(city==='Ashqelon'?83203:83202));
 if(!pair&&!country)assert(!JSON.stringify(shown[0]['66']).includes(', '),'No dangling comma when country missing');
}
const clock=Date.now(), cache=createCityReuseCache({now:()=>clock});
class Clock extends Date {static now(){return clock;}}
async function run(runtime=script,{lat='0',lon='0',geo={},cacheData=null,offline=false,memory=null}={}){
 const sent=[],calls=[];
 const ctx={Date:Clock,sendToWidgy:s=>sent.push(s),fetch(url){
  calls.push(url);
  if(url.includes('reverse-geocode-client')){
   if(offline)return Promise.reject(Error('offline'));
   return Promise.resolve({ok:true,json:async()=>({latitude:Number(lat),longitude:Number(lon),lookupSource:'coordinates',city:'Ashkelon',countryName:'Israel',...geo})});
  }
  return Promise.resolve({ok:true,json:async()=>cacheData||cache.read(new URL(url))});
 }};
 if(memory)ctx.__homeGlassCityCountryV1=memory;
 vm.runInNewContext(runtime.replaceAll('${widgy.map_latitude_max5}',lat).replaceAll('${widgy.map_longitude_max5}',lon),ctx);
 for(let i=0;i<60;i++)await Promise.resolve();
 assert.equal(sent.length,1,'Exactly one final callback');return {url:new URL(sent[0]),calls};
}
const cold=await run();assert.equal(cold.calls.length,2);assert.equal(cold.url.searchParams.get('country_name'),'Israel');
assert.equal(calendarLocationPair(cold.url.href),'Ashkelon, Israel');cache.remember(cold.url);
const warm=await run();assert.equal(warm.calls.length,1);assert.equal(warm.url.searchParams.get('country_name'),'Israel');
assert.equal(warm.url.searchParams.get('city_cache_time'),String(clock));
const mem=await run(script,{memory:{latitude:0,longitude:0,city:'Ashkelon',countryName:'Israel',time:clock}});assert.equal(mem.calls.length,0);
const old=await run(original,{cacheData:{state:'MISS'}});
const stripped=new URL(cold.url);stripped.searchParams.delete('country_name');stripped.searchParams.set('city_cache_scope',old.url.searchParams.get('city_cache_scope'));
assert.equal(stripped.href,old.url.href,'Map URL delta limited to isolated scope and country metadata');
assert.deepEqual(resolveLocation(parseMapRequest(cold.url.href),{}),resolveLocation(parseMapRequest(old.url.href),{}),'Rendered GPS, city and time unchanged');
for(const [geo,want] of [
 [{city:'Ashqelon'},'Ashkelon, Israel'],[{city:'Paris',countryName:'France'},'Paris, France'],
 [{city:'Mumbai',countryName:'India'},'Mumbai, India'],[{city:'Yamoussoukro',countryName:"Côte d'Ivoire"},"Yamoussoukro, Côte d'Ivoire"],
 [{city:'A "quoted" \\ city',countryName:'Country & Islands'},'A "quoted" \\ city, Country & Islands'],
 [{city:'東京',countryName:'日本'},'東京, 日本'],[{countryName:''},''],[{countryName:null},''],
 [{lookupSource:'ipGeolocation'},''],[{latitude:1},''],[{city:''},'']]){
 const result=await run(script,{geo,cacheData:{state:'MISS'}});assert.equal(calendarLocationPair(result.url.href),want);assert.equal(result.calls.length,2);
 const displayScript=source(out,'calendar_location_pair')['10'].replace('${widgy.map_request}',result.url.href);
 const ctx={};vm.runInNewContext(displayScript,ctx);assert.equal(ctx.main(),want,'Real text template tolerates encoded names');
 const prior=await run(original,{geo,cacheData:{state:'MISS'}});assert.equal(result.calls.length,prior.calls.length,'No additional network calls');
}
for(const opts of [{lat:''},{lon:'181'},{offline:true,cacheData:{state:'MISS'}}]){
 const result=await run(script,opts);assert.equal(calendarLocationPair(result.url.href),'');
}
const changed=await run(script,{lat:'0.00001',geo:{city:'Other',countryName:'Elsewhere'}});assert.equal(changed.calls.length,2);assert.equal(calendarLocationPair(changed.url.href),'Other, Elsewhere');
for(const bad of ['', '${widgy.map_request}',cold.url.href+'&country_name=Other',cold.url.href.replace('country_name=Israel','country_name=%FF')])assert.equal(calendarLocationPair(bad),'');
for(const observed of [clock-3600000,clock+60000]){const u=new URL(cold.url);u.searchParams.set('city_cache_time',String(observed));assert.equal(calendarLocationPair(u.href),'');}
const legacy=new URL(old.url);cache.remember(legacy);legacy.searchParams.set('city_cache_v1','read');assert(!('countryName' in cache.read(legacy).entry),'Legacy response shape retained');
const read=new URL(cold.url);read.searchParams.set('city_cache_v1','read');assert.equal(cache.read(read).entry.countryName,'Israel');
let definitions=0;function check(x){if(!x||typeof x!=='object')return;for(const [k,v]of Object.entries(x))if(k==='10'&&x['5']==='Javascript'){new vm.Script(v);definitions++}else check(v)}check(out);
console.log(JSON.stringify({exactOtherFields:true,nativeFallbackPreserved:true,allNavigationUnchanged:true,layers:nodes.length,variables:out['36'].length,scriptDefinitions:definitions,coldFetches:2,warmFetches:1,memoryFetches:0,noAddedGeocoderRequest:true,pairedCountrySurvivesCache:true,exactGPSIsolation:true,invalidCountryKeepsMap:true,nativeRuntimeStillRequiresConfirmation:true}));
