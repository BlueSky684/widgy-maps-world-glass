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

import {withMapRefreshClock} from './map-refresh-clock.js';
import {withMapFiveMinuteURL} from './map-five-minute-url.js';
const before=structuredClone(full),control=withMapRefreshClock(full,'https://example.test');
const result=withMapFiveMinuteURL(full,'https://example.test');
assert.deepEqual(full,before,'Input is untouched');
const source=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const restored=structuredClone(result);
source(restored)['10']=source(control)['10'];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only script/name/description differ from cached diagnostic');
const expected=source(control)['10']
  .replace('Math.floor(instant / 60000) * 60000','Math.floor(instant / 300000) * 300000')
  .replace('encodeURIComponent(lon));',"encodeURIComponent(lon)) + '&t=' + stamp;");
assert.equal(source(result)['10'],expected);
const trap=()=>{throw Error('Unexpected network/timer/async');};
function run(widget,instant,lat,lon){
 const code=source(widget)['10'].replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>{
  assert(['map_latitude_max5','map_longitude_max5'].includes(name));
  return JSON.stringify(name.includes('latitude')?lat:lon);
 });
 return vm.runInNewContext(code+'\nmain()',{
  Date:{now:()=>instant},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
 },{timeout:100});
}
const base=Date.parse('2026-10-05T19:00:00Z');
const instants=[base,base+59999,base+60000,base+299999,base+300000,base+600001,
 Date.parse('2026-12-31T23:59:59.999Z'),Date.parse('2027-01-01T00:00:00Z')];
const cases=[['0','0'],['1.25001','2.50002'],['-0.125','179.99'],['−12,5','40,25'],
 ['90','-180'],['91','181'],['',''],['missing','no longitude']];
let count=0;
for(const [lat,lon] of cases)for(const instant of instants){
 const actual=new URL(run(result,instant,lat,lon));
 assert.equal(actual.searchParams.get('t'),String(Math.floor(instant/300000)*300000));
 assert.equal(actual.searchParams.getAll('t').length,1);
 assert.equal(actual.searchParams.get('diagnostic'),'refresh-v1');
 assert.equal(actual.searchParams.get('width'),'3306');
 assert.equal(actual.searchParams.get('reuse'),'60');
 for(const p of ['at','city','city_text','cache'])assert(!actual.searchParams.has(p));
 actual.searchParams.delete('t');
 assert.equal(actual.href,run(control,instant,lat,lon),'Coordinate/parser behavior and other query fields preserved');
 count++;
}
const same=instants.slice(0,4).map(t=>run(result,t,'1.25','2.5'));
assert.equal(new Set(same).size,1,'Minute boundaries within five minutes keep URL');
assert.notEqual(same[0],run(result,base+300000,'1.25','2.5'),'Five-minute boundary changes URL');
assert.notEqual(same[0],run(result,base,'1.25001','2.5'),'Native coordinate changes are not rounded away');
const blank=parseMapRequest(run(result,base,'',''));
assert.equal(resolveLocation(blank,{'x-vercel-ip-latitude':'3','x-vercel-ip-longitude':'4'}),null);
const zero=resolveLocation(parseMapRequest(run(result,base,'0','0')),{});
assert.equal(zero.latitude,0);assert.equal(zero.longitude,0);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),nodes=walk(result['1']);
assert.equal(nodes.length,21);assert.equal(new Set(nodes.map(n=>n.d0)).size,21);
assert.equal(result['36'].length,3);
const maps=nodes.filter(n=>n.z==='5');
assert.equal(maps.length,1);assert.equal(maps[0]['1'],'Web URL');
assert.equal(maps[0]['2'],'${widgy.map_request}');
assert.equal(maps[0]['3'],true);
assert(!JSON.stringify(result).includes('token='));
// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-five-minute-url.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapFiveMinuteURL,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-five-minute-url.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-five-minute-url.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-five-minute-url.js?v=map-five-minute-url-1'));
assert(html.includes('Widgy_Map_Five_Minute_1.json'));
assert(html.includes('./widgy-map-refresh-clock.html?v=map-refresh-clock-1'));
console.log('PASS: '+count+' synthetic data/time cases; only five-minute URL script and metadata changed; stable within bucket, new at boundary/location change; original cached provider; public copy/import/failure flows work.');
