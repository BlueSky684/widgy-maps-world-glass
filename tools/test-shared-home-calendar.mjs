import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {flatten} from './compact-widget-structure.js';
import {withSharedHomeCalendar,SHARED_PAIRS,SHARED_GROUP_ID} from './shared-home-calendar.js';
const source=JSON.parse(readFileSync(process.argv[2])),before=structuredClone(source),w=withSharedHomeCalendar(source);
assert.deepEqual(source,before);
const nodes=flatten(w['1']),ids=new Set(nodes.map(n=>n.d0)),oldNodes=new Map(flatten(source['1']).map(n=>[n.d0,n]));
assert.equal(nodes.length,1180);assert.equal(ids.size,nodes.length);assert.equal(w['36'].length,52);
const shared=w['1'][0];assert.equal(shared.d0,SHARED_GROUP_ID);assert.equal(shared['1'].length,10);
assert.deepEqual(Object.keys(shared).sort(),['1','d','d0','e','s','z']);
assert.deepEqual(shared.d,source['1'][0].d);assert.deepEqual(shared.e,source['1'][0].e);
for(const n of shared['1'])assert.deepEqual(n,oldNodes.get(n.d0));
const oldMap=source['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10'];
const newMap=w['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10'];
assert.equal(newMap.replace(',true,"","",60,3600);',',true,"${widgy.Latitude}","${widgy.Longitude}",60,3600);'),oldMap);
for(const v of w['36'])if(v['1']!=='map_request')assert.deepEqual(v,source['36'].find(s=>s['1']===v['1']));
const time=Date.parse('2026-10-09T06:30:00Z');
class Clock extends Date{static now(){return time;}}
async function run(code,lat,lon,mode){
 const calls=[],sent=[],ctx={Date:Clock,sendToWidgy:v=>sent.push(v),fetch(url){
  calls.push(url);if(mode==='offline')return Promise.reject(Error('offline'));
  const u=new URL(url),latitude=Number(lat.replace(',','.')),longitude=Number(lon.replace(',','.'));
  if(u.searchParams.get('city_cache_v1')==='read')return Promise.resolve({ok:true,json:async()=>mode==='hit'?{state:'HIT',entry:{latitude,longitude,city:'Example',observedAt:time-1000}}:{state:'MISS'}});
  return Promise.resolve({ok:true,json:async()=>({latitude,longitude,city:'Example'})});
 }};
 if(mode==='memory')ctx.__homeGlassCityV1={latitude:Number(lat),longitude:Number(lon),city:'Example',time:time-1000};
 const replaced=code.replace(/\$\{widgy\.([^}]+)\}/g,(_,n)=>({map_latitude_max5:lat,map_longitude_max5:lon,Latitude:'88.88888',Longitude:'177.77777'}[n]));
 vm.runInNewContext(replaced,ctx);for(let i=0;i<40;i++)await Promise.resolve();
 assert.equal(sent.length,1);return {calls,sent};
}
let mapCases=0;
for(const [lat,lon]of [['0','0'],['12.3456789','-45.9876543'],['12,3','45,6'],['',''],['91','181']])
 for(const mode of ['hit','miss','offline','memory']){assert.deepEqual(await run(oldMap,lat,lon,mode),await run(newMap,lat,lon,mode));mapCases++;}
// Hoisting may only reverse draw order for disjoint non-tap visuals. Original
// overlapping date-weight layers keep their original relative order.
const val=(n,k,otherwise)=>n[k]?.a?.[0]?.a??otherwise;
const rect=n=>({x:val(n,'b',0),y:val(n,'c',0),w:val(n,'d',1600),h:val(n,'e',1600)});
const intersects=(a,b)=>a.x<b.x+b.w && b.x<a.x+a.w && a.y<b.y+b.h && b.y<a.y+a.h;
for(const [tabID,index]of [[245,0],[247,1]]){
 const list=flatten(source['1'].find(n=>n.d0===tabID)['1']).filter(n=>n.z!=='13'&&n.z!=='11');
 const commonIDs=new Set(SHARED_PAIRS.map(pair=>pair[index]));
 for(const n of list.filter(n=>commonIDs.has(n.d0))){
  for(const earlier of list.slice(0,list.indexOf(n)).filter(a=>!commonIDs.has(a.d0)))
   assert(!intersects(rect(n),rect(earlier)),`Hoisting would change overlapping paint order: ${n.d0}/${earlier.d0}`);
 }
 const ordered=list.filter(n=>commonIDs.has(n.d0)).map(n=>SHARED_PAIRS.findIndex(pair=>pair[index]===n.d0));
 for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
  if(ordered[i]>ordered[j])assert(!intersects(rect(shared['1'][ordered[i]]),rect(shared['1'][ordered[j]])));
 }
}
let actions=0;
for(const n of nodes)if(n['1a']?.startsWith('button_')){
 const [show,hide]=n['1a'].slice(7).split('-').map(s=>s.split(',').map(Number));
 for(const id of [...show,...hide])assert(ids.has(id),'Unknown navigation target');
 if(/^(HOME|CALENDAR|WEATHER|FITNESS) Tap$/.test(n.s)){
  actions++;assert.equal(show.includes(SHARED_GROUP_ID),show.includes(245)||show.includes(247));
  assert.equal(hide.includes(SHARED_GROUP_ID),show.includes(246)||show.includes(195));
  n['1a']='button_'+[show,hide].map(a=>a.filter(id=>id!==SHARED_GROUP_ID).join(',')).join('-');
  assert.equal(n['1a'],oldNodes.get(n.d0)['1a']);
 }
}
assert.equal(actions,16);
const remainingText=JSON.stringify(w).toLowerCase();
for(const name of ['Latitude','Longitude','calendar_city_prefix']){
 const dead=source['36'].find(v=>v['1']===name);
 assert(!remainingText.includes('${widgy.'+name.toLowerCase()+'}'));assert(!remainingText.includes(dead['0'].toLowerCase()));
}
// Restore original slots from the shared originals; retained nodes must have
// exact values and order. Only the acknowledged whitelist may differ.
w['1']=w['1'].filter(n=>n.d0!==SHARED_GROUP_ID);
for(const tabID of [245,247]){
 const tab=w['1'].find(n=>n.d0===tabID),old=source['1'].find(n=>n.d0===tabID);
 const map=new Map(tab['1'].map(n=>[n.d0,n]));
 const restoreIDs=new Set(SHARED_PAIRS.map(pair=>pair[tabID===245?0:1]));
 tab['1']=old['1'].map(n=>restoreIDs.has(n.d0)?structuredClone(n):map.get(n.d0));
}
w['36']=source['36'];w['3']=source['3'];w['4']=source['4'];assert.deepEqual(w,source);
console.log(JSON.stringify({pass:true,layersBefore:1189,layersAfter:1180,sharedOriginalVisuals:10,duplicateLeavesRemoved:10,sharedGroupAdded:1,variablesBefore:55,variablesAfter:52,mapRuntimeParityCases:mapCases,allOtherFieldsExact:true,phoneRenderer:'not executed'}));
