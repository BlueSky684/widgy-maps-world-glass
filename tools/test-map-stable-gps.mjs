import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinimalPair} from './map-minimal-pair.js';
import {withMapMinuteURL} from './map-minute-url.js';
import {withMapGPSPair} from './map-gps-pair.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
import {withMapStableGPS} from './map-stable-gps.js';
import {withMapStableMarker} from './map-stable-marker.js';
const before=structuredClone(full),control=withMapGPSPair(full,'https://example.test');
const fixed=withMapStableMarker(full,'https://example.test'),result=withMapStableGPS(full,'https://example.test');
assert.deepEqual(full,before);
const mapSource=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const source=mapSource(result),old=mapSource(control);
const restored=structuredClone(result);
mapSource(restored)['10']=old['10'];restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only suffix/name/description differ from GPS Pair1');
assert.equal(source['10'],old['10'].replace(" + '&t=' + stamp;",';'));
assert(source['10'].includes('var instant = Date.now();'));
assert(source['10'].includes('var stamp = Math.floor(instant / 60000) * 60000;'));
const backToFixed=structuredClone(result);
backToFixed['36']=structuredClone(fixed['36']);backToFixed['3']=fixed['3'];backToFixed['4']=fixed['4'];
assert.deepEqual(backToFixed,fixed,'All non-variable fields identical to fast Stable Marker1');
const fixedSource=structuredClone(source);
for(const name of ['map_latitude_max5','map_longitude_max5']){
  assert.deepEqual(result['36'].find(v=>v['1']===name),full['36'].find(v=>v['1']===name));
  fixedSource['10']=fixedSource['10'].replace('"'+ '$'+'{widgy.'+name+'}"','"0"');
}
assert.deepEqual(fixedSource,mapSource(fixed),'Only native input bindings differ in the script');
assert.deepEqual(result['36'].map(v=>v['1']),['map_latitude_max5','map_longitude_max5','map_request']);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),nodes=walk(result['1']);
assert.equal(nodes.length,21);assert.equal(new Set(nodes.map(n=>n.d0)).size,21);
const trap=()=>{throw Error('Unexpected network/timer/async use');};
const run=(code,latitude,longitude,instant)=>{
 const values={map_latitude_max5:latitude,map_longitude_max5:longitude};
 const replaced=code.replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>{
   assert(Object.hasOwn(values,name));return JSON.stringify(values[name]);
 });
 return vm.runInNewContext(replaced+'\nmain()',{
   Date:{now:()=>instant},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
 },{timeout:100});
};
const cases=[
 ['0','0','0','0'],['12.5','-80.25','12.5','-80.25'],['  +12,500  ',' −80,25 ','12.5','-80.25'],
 ['90','180','90','180'],['-90','-180','-90','-180'],['.125','-.25','0.125','-0.25'],
 ['1.123456789','2.987654321','1.123456789','2.987654321'],['','','',''],
 ['91','2','','2'],['1','181','1',''],['-91','-181','',''],['null','undefined','',''],
 ['1x','2x','',''],['1e1','2e1','',''],['NaN','Infinity','',''],
 ['$'+'{widgy.map_latitude_max5}','$'+'{widgy.map_longitude_max5}','',''],['-0','+0','0','0'],
 ['1.','2.','1','2'],['','2','','2'],['1','','1','']
];
for(const [latitude,longitude,lat,lon] of cases){
 const outputs=[];
 for(const instant of [1791181259999,1791184860000]){
   const url=run(source['10'],latitude,longitude,instant);
   const expected=parseMapRequest(run(old['10'],latitude,longitude,instant));
   expected.searchParams.delete('t');assert.equal(url,expected.href);
   const parsed=parseMapRequest(url);assert.equal(parsed.searchParams.size,7);
   assert.equal(parsed.searchParams.get('lat'),lat);assert.equal(parsed.searchParams.get('lon'),lon);
   assert.equal(parsed.searchParams.get('width'),'3306');assert.equal(parsed.searchParams.get('reuse'),'60');
   for(const p of ['t','city','city_text','at','cache'])assert(!parsed.searchParams.has(p));
   const location=resolveLocation(parsed,{'x-vercel-ip-latitude':'4','x-vercel-ip-longitude':'5'});
   if(lat===''||lon==='')assert.equal(location,null);
   else assert.deepEqual(location,{latitude:Number(lat),longitude:Number(lon),city:'',source:'coordinates'});
   outputs.push(url);
 }
 assert.equal(outputs[0],outputs[1],'Same inputs remain stable over minute/hour boundaries');
}
const url=(lat,lon)=>run(source['10'],lat,lon,1791184860000);
assert.notEqual(url('1.123456789','2'),url('1.123456790','2'),'Movement is not rounded away');
assert.notEqual(url('1','2.123456789'),url('1','2.123456790'));
const serialized=JSON.stringify(result);assert(!serialized.includes('token='));
assert.deepEqual([...serialized.matchAll(/\$\{widgy\.([^}]+)\}/g)].map(m=>m[1]).sort(),
 ['map_latitude_max5','map_longitude_max5','map_request']);
for(const origin of ['http://example.test','https://example.test/','https://user:pass@example.test'])
 assert.throws(()=>withMapStableGPS(full,origin),/invalid_origin/);

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-stable-gps.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapStableGPS,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-stable-gps.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-stable-gps.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert.equal(requests.length,3);assert.equal(revoked,1);
for(const [url,options] of requests){
  assert.equal(url,'./Widgy_Home_Glass_Calendar_C16.json');assert.equal(options.cache,'no-store');
  assert(!options.method || options.method==='GET');
}
assert(html.includes('widgy-map-stable-gps.js?v=map-stable-gps-1'));
assert(html.includes('Widgy_Map_Stable_GPS_1.json'));
assert(html.includes('./widgy-map-stable-marker.html?v=map-stable-marker-1'));
console.log('PASS: GPS Pair1 exact except returned t suffix/metadata; fast Stable Marker1 exact except native input definitions/bindings/metadata; original native sources preserved; 40 synthetic coordinate/time cases and movement verified; 21 layers/three variables and actual public import flow. Device timing/freshness pending.');
