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
import {withMapRefreshClock} from './map-refresh-clock.js';
const before=structuredClone(full),control=withMapStableGPS(full,'https://example.test');
const result=withMapRefreshClock(full,'https://example.test');
assert.deepEqual(full,before);
const source=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const restored=structuredClone(result);
source(restored)['10']=source(control)['10'];restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only constant query and trial metadata differ');
assert.equal(source(result)['10'],source(control)['10'].replace('atlas=r6&reuse=60','atlas=r6&reuse=60&diagnostic=refresh-v1'));
const trap=()=>{throw Error('Unexpected network/timer/async');};
function run(code,instant){
 code=code.replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>{
  assert(['map_latitude_max5','map_longitude_max5'].includes(name));
  return JSON.stringify(name.includes('latitude')?'1.25':'2.5');
 });
 return vm.runInNewContext(code+'\nmain()',{
  Date:{now:()=>instant},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
 },{timeout:100});
}
const output=[];
for(const instant of [1791181259999,1791184860000]){
 const u=parseMapRequest(run(source(result)['10'],instant));
 assert.equal(u.searchParams.get('diagnostic'),'refresh-v1');
 for(const p of ['t','at','city','city_text','cache'])assert(!u.searchParams.has(p));
 output.push(u.href);u.searchParams.delete('diagnostic');
 assert.equal(u.href,run(source(control)['10'],instant));
}
assert.equal(output[0],output[1]);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),nodes=walk(result['1']);
assert.equal(nodes.length,21);assert.equal(new Set(nodes.map(n=>n.d0)).size,21);
assert.equal(result['36'].length,3);

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-refresh-clock.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapRefreshClock,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-refresh-clock.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-refresh-clock.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-refresh-clock.js?v=map-refresh-clock-1'));
assert(html.includes('Widgy_Map_Refresh_Clock_1.json'));
assert(html.includes('./widgy-map-stable-gps.html?v=map-stable-gps-1'));
console.log('PASS: only constant refresh diagnostic query/metadata; stable URL/native data/layers preserved; no cache-buster or new source; actual public import/copy/download/retry works.');
