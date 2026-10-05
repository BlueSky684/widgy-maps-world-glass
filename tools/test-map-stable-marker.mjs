import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinuteURL} from './map-minute-url.js';
import {withMapGPSPair} from './map-gps-pair.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
import {withMapFixedMarker} from './map-fixed-marker.js';

import {withMapStableMarker} from './map-stable-marker.js';
const before=structuredClone(full),control=withMapFixedMarker(full,'https://example.test');
const result=withMapStableMarker(full,'https://example.test');
assert.deepEqual(full,before,'Input unchanged');
const mapSource=w=>w['36'][0]['3']['66'][0],source=mapSource(result),old=mapSource(control);
const restored=structuredClone(result);
mapSource(restored)['10']=old['10'];restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only script body and trial metadata differ');
assert.equal(source['10'],old['10'].replace(" + '&t=' + stamp;",';'));
assert(source['10'].includes('var instant = Date.now();'));
assert(source['10'].includes('var stamp = Math.floor(instant / 60000) * 60000;'));
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),nodes=walk(result['1']);
assert.equal(nodes.length,21);assert.equal(new Set(nodes.map(n=>n.d0)).size,21);
assert.deepEqual(result['36'].map(v=>v['1']),['map_request']);
const trap=()=>{throw Error('Unexpected network/timer/async use');};
const run=(code,instant)=>vm.runInNewContext(code+'\nmain()',{
  Date:{now:()=>instant},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
},{timeout:100});
const output=[];
for(const instant of [1791181259999,1791181260000,1791181260123,1791181320000,1791181560000,1791184860000]){
  const url=run(source['10'],instant),expected=parseMapRequest(run(old['10'],instant));
  expected.searchParams.delete('t');assert.equal(url,expected.href);
  const parsed=parseMapRequest(url);
  assert.equal(parsed.searchParams.size,7);
  assert.equal(parsed.searchParams.get('width'),'3306');assert.equal(parsed.searchParams.get('reuse'),'60');
  for(const p of ['t','city','city_text','at','cache'])assert(!parsed.searchParams.has(p));
  assert.deepEqual(resolveLocation(parsed,{'x-vercel-ip-latitude':'4','x-vercel-ip-longitude':'5'}),
    {latitude:0,longitude:0,city:'',source:'coordinates'});
  output.push(url);
}
assert.equal(new Set(output).size,1,'Identical across minute boundaries and hour');
assert.notEqual(run(old['10'],1791181259999),run(old['10'],1791181260000));
const serialized=JSON.stringify(result);assert(!serialized.includes('token='));
for(const name of ['map_latitude_max5','map_longitude_max5'])assert(!serialized.includes(name));
for(const origin of ['http://example.test','https://example.test/','https://user:pass@example.test'])
  assert.throws(()=>withMapStableMarker(full,origin),/invalid_origin/);

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-stable-marker.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapStableMarker,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-stable-marker.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-stable-marker.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-stable-marker.js?v=map-stable-marker-1'));
assert(html.includes('Widgy_Map_Stable_Marker_1.json'));
assert(html.includes('./widgy-map-minute-url.html?v=map-minute-url-1'));
console.log('PASS: exact Fixed Marker1 document except URL suffix/name/description; clock calculations preserved; stable synthetic0,0 URL across minute/hour boundaries; full-resolution/private-reuse60 request unchanged; actual public import/copy/download/retry flow passes. Idle timing and image freshness require phone verification.');
