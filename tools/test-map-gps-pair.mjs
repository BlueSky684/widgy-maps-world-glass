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
const before=structuredClone(full),control=withMapMinuteURL(full,'https://example.test'),minimal=withMapMinimalPair(full);
const result=withMapGPSPair(full,'https://example.test');
assert.deepEqual(full,before,'Input must not mutate');
const gpsNames=['map_latitude_max5','map_longitude_max5'];
assert.deepEqual(result['36'].map(v=>v['1']),[...gpsNames,'map_request']);
assert.equal(new Set(result['36'].map(v=>v['0'])).size,3);
for(const name of gpsNames)assert.deepEqual(result['36'].find(v=>v['1']===name),full['36'].find(v=>v['1']===name));
const mapSource=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const source=mapSource(result),controlSource=mapSource(control),oldSource=mapSource(minimal);
assert.equal(source['5'],'Javascript');assert.equal(source['6'],'Script');
const restored=structuredClone(result);
restored['36']=restored['36'].filter(v=>v['1']==='map_request');
mapSource(restored)['10']=controlSource['10'];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only two native definitions, script body and metadata differ from fast minute control');
const asMinimal=structuredClone(result);
asMinimal['36']=structuredClone(minimal['36']);asMinimal['3']=minimal['3'];asMinimal['4']=minimal['4'];
assert.deepEqual(asMinimal,minimal,'All layers/navigation/global fields also match the earlier five-variable Minimal Pair');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),nodes=walk(result['1']);
const ids=new Set(nodes.map(n=>n.d0));assert.equal(nodes.length,21);assert.equal(ids.size,21);
assert.equal(nodes.filter(n=>n.z==='5').length,1);assert.equal(nodes.filter(n=>n.z==='11').length,4);
for(const n of nodes)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id));
const serialized=JSON.stringify(result);
assert.equal(serialized.split('/api/').length-1,1);assert(!serialized.includes('token='));
assert.deepEqual([...serialized.matchAll(/\$\{widgy\.([^}]+)\}/g)].map(m=>m[1]).sort(),
  ['map_latitude_max5','map_longitude_max5','map_request']);
for(const v of minimal['36'].filter(v=>['Latitude','Longitude'].includes(v['1'])))
  assert(!serialized.toLowerCase().includes(v['0'].toLowerCase()));
const kinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))kinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);
assert.deepEqual(kinds,[...Array(5).fill('Custom Text/Text'),'Location/Latitude (Decimal)',
  'Location/Longitude (Decimal)','Javascript/Script']);
assert(!/fetch|sendToWidgy|setTimeout|setInterval|fallback|cityMapRuntime/.test(source['10']));
const trap=()=>{throw Error('Unexpected network/async/timer use');};
function run(code,values,instant){
  // Synthetic safe substitution tests JS only, not Widgy interpolation/escaping.
  const replaced=code.replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>{
    assert(Object.hasOwn(values,name),name);return JSON.stringify(values[name]);
  });
  return vm.runInNewContext(replaced+'\nmain()',{
    Date:{now:()=>instant},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
  },{timeout:100});
}
const cases=[
  ['0','0','0','0'],['12.5','-80.25','12.5','-80.25'],['  +12,500  ',' −80,25 ','12.5','-80.25'],
  ['90','180','90','180'],['-90','-180','-90','-180'],['.125','-.25','0.125','-0.25'],
  ['1.123456789','2.987654321','1.123456789','2.987654321'],
  ['','','',''],['91','2','','2'],['1','181','1',''],['-91','-181','',''],
  ['null','undefined','',''],['1x','2x','',''],['1e1','2e1','',''],['NaN','Infinity','',''],
  ['$'+'{widgy.map_latitude_max5}','$'+'{widgy.map_longitude_max5}','',''],['-0','+0','0','0'],
  ['1.','2.','1','2'],['','2','','2'],['1','','1','']
];
for(const instant of [1791181259999,1791181260000])for(const [latitude,longitude,lat,lon] of cases){
  const values={map_latitude_max5:latitude,map_longitude_max5:longitude,Latitude:'-10',Longitude:'20'};
  const url=run(source['10'],values,instant);
  assert.equal(url,run(oldSource['10'],values,instant),'Parity with original enabled primary-coordinate path');
  const parsed=parseMapRequest(url);
  assert.equal(parsed.origin,'https://example.test');assert.equal(parsed.pathname,'/api/night-map');
  assert.equal(parsed.searchParams.size,8);
  assert.equal(parsed.searchParams.get('lat'),lat);assert.equal(parsed.searchParams.get('lon'),lon);
  assert.equal(parsed.searchParams.get('t'),String(Math.floor(instant/60000)*60000));
  assert.equal(parsed.searchParams.get('width'),'3306');assert(!parsed.searchParams.has('city'));
  const location=resolveLocation(parsed,{'x-vercel-ip-latitude':'3','x-vercel-ip-longitude':'4','x-vercel-ip-city':'Example'});
  if(lat===''||lon==='')assert.equal(location,null);
  else assert.deepEqual(location,{latitude:Number(lat),longitude:Number(lon),city:'',source:'coordinates'});
  parsed.searchParams.set('lat','');parsed.searchParams.set('lon','');
  assert.equal(parsed.href,run(controlSource['10'],{},instant),'Removing only coordinates equals fast control');
}
for(const origin of ['http://example.test','https://example.test/','https://example.test/path',
  'https://example.test?token=x','https://user:pass@example.test','javascript:alert(1)'])
  assert.throws(()=>withMapGPSPair(full,origin),/invalid_origin/);
for(const [name,mutation] of [
  ['map_request',v=>v['0']='wrong-id'],
  ['map_latitude_max5',v=>v['0']='wrong-id'],
  ['map_longitude_max5',v=>v['3']['66'][0]['6']='City']
]){
  const malformed=structuredClone(full);mutation(malformed['36'].find(v=>v['1']===name));
  assert.throws(()=>withMapGPSPair(malformed,'https://example.test'),/unexpected_template/);
}

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-gps-pair.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapGPSPair,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-gps-pair.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-gps-pair.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-gps-pair.js?v=map-gps-pair-1'));
assert(html.includes('Widgy_Map_GPS_Pair_1.json'));
assert(html.includes('./widgy-map-minute-url.html?v=map-minute-url-1'));
console.log('PASS: exact two original coordinate sources plus short sync script; 21 layers/three variables; entire remaining document unchanged; synthetic URLs match original primary-coordinate semantics across bounds/format/missing-data/minute cases; no fallback/IP/geocoder; public import flow passes. Native GPS freshness/marker/timing require phone verification.');
