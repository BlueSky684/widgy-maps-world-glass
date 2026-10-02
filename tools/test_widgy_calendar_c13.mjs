import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const w=read('./Widgy_Home_Glass_Calendar_C13.json'),base=read('./Widgy_Home_Glass_Calendar_C12.json');
function* walk(ns){for(const n of ns){yield n;if(n.z==='13')yield*walk(n['1']);}}
const vars=new Map(w['36'].map(v=>[v['1'],v]));
const cityCode=vars.get('calendar_city_prefix')['3']['66'][0]['10'];
async function resolveCity({lat='48.85661',lon='2.35222',city='Paris',returnedLat=48.85661,returnedLon=2.35222,source='coordinates',fail=false}={}){
 let requests=0;
 const result=await new Promise((resolve,reject)=>{
  try{vm.runInNewContext(cityCode.replaceAll('${widgy.map_latitude_max5}',lat).replaceAll('${widgy.map_longitude_max5}',lon),{
   sendToWidgy:resolve,fetch:async url=>{requests++;assert(url.includes('localityLanguage=en'));assert(!url.includes('calendar'));if(fail)throw Error('offline');return {ok:true,json:async()=>({latitude:returnedLat,longitude:returnedLon,lookupSource:source,city})};}
  });}catch(e){reject(e);}
 });return {result,requests};
}
assert.deepEqual(await resolveCity(),{result:'Paris, ',requests:1});
assert.deepEqual(await resolveCity({lat:'31.66879',lon:'34.57425',returnedLat:31.66879,returnedLon:34.57425,city:'Ashkelon'}),{result:'Ashkelon, ',requests:1});
assert.equal((await resolveCity({fail:true})).result,'');
assert.equal((await resolveCity({source:'ip'})).result,'');
assert.equal((await resolveCity({returnedLat:31.66879})).result,'');
assert.deepEqual(await resolveCity({lat:'${widgy.map_latitude_max5}'}),{result:'',requests:0});
const cal=w['1'].find(n=>n.d0===247);
function active(ns,values){return ns.flatMap(n=>{
 if(n.o1){const {0:v,1:op,2:term}=n.o1,x=values[v]??'';if(!({0:x===term,1:x!==term,2:x.includes(term),3:!x.includes(term)})[op])return [];}
 return n.z==='13'?active(n['1'],values):[n];
});}
const locs=cal['1'].filter(n=>n.s?.startsWith('Calendar Location'));
const cityId=vars.get('calendar_city_prefix')['0'],nativeCityId=vars.get('calendar_native_city')['0'];
for(const [resolved,native,expected] of [['','Ashqelon','Ashkelon Spelling'],['','Ashdod','Native Fallback'],['Paris, ','Paris','Calendar Location']]){
 const visible=active(locs,{[cityId]:resolved,[nativeCityId]:native});assert.equal(visible.length,1);assert(visible[0].s.endsWith(expected));
}
for(let i=1;i<=4;i++){
 const row=cal['1'].find(n=>n.s===`Agenda · Row ${i}`),icons=row['1'].filter(n=>n.s===`Event ${i} · Dynamic Detail Icon`),id=vars.get(`calendar_event_${i}_location`)['0'];
 for(const [location,symbol] of [['Zoom Room','video.fill'],['https://zoom.us/j/123','video.fill'],['Teams Meeting','video.fill'],['Skype','video.fill'],['Conference Room B','person.2.fill'],['tel:123','phone.fill'],['Design Updates','doc.text.fill'],['Office','mappin'],['',null]]){
  const shown=active(icons,{[id]:location});assert.equal(shown.length,symbol?1:0);if(symbol)assert.equal(shown[0]['3'],symbol);
 }
}
const glyphCode=vars.get('calendar_today_glyph')['3']['66'][0]['10'];
for(const day of [1,2,10,28,31]){const url=vm.runInNewContext(glyphCode+';main();',{Date:class{getDate(){return day;}}});assert(url.endsWith(`/today-c13/${day}.png`));}
const nodes=[...walk(w['1'])];
for(const group of nodes.filter(n=>/^Calendar · Today Cell /.test(n.s??''))){
 const image=group['1'].find(n=>n.s==='Calendar · Today Approved Glyph'),disc=group['1'].find(n=>n.s==='Calendar · Today Disc');
 for(const key of ['b','c','d','e'])assert(Math.abs(image[key].a[0].a-disc[key].a[0].a)<.000002);
}
assert.deepEqual(w['1'].filter(n=>n.d0!==247),base['1'].filter(n=>n.d0!==247));
console.log('Passed: changing GPS city, offline/invalid/IP/mismatched-coordinate fallbacks, exclusive location labels, icon precedence, day rollover, badge alignment, other tabs preserved. Native iOS rendering still needs device review.');
