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

const before=structuredClone(full),gps=withMapGPSPair(full,'https://example.test');
const result=withMapFixedMarker(full,'https://example.test');
assert.deepEqual(full,before);
const mapSource=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const source=mapSource(result),gpsSource=mapSource(gps);
assert.deepEqual(result['36'].map(v=>v['1']),['map_request']);
const restored=structuredClone(result);
restored['36']=structuredClone(gps['36']);restored['3']=gps['3'];restored['4']=gps['4'];
assert.deepEqual(restored,gps,'No changes outside variables/name/description');
const expected=structuredClone(gps['36'].find(v=>v['1']==='map_request'));
for(const name of ['map_latitude_max5','map_longitude_max5'])
  expected['3']['66'][0]['10']=expected['3']['66'][0]['10'].replace('"'+ '$'+'{widgy.'+name+'}"','"0"');
assert.deepEqual(result['36'][0],expected,'Only replace native binding inputs; keep parser, clock and URL');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]),nodes=walk(result['1']);
assert.equal(nodes.length,21);assert.equal(new Set(nodes.map(n=>n.d0)).size,21);
assert.equal(nodes.filter(n=>n.z==='5').length,1);assert.equal(nodes.filter(n=>n.z==='11').length,4);
const serialized=JSON.stringify(result);
assert(!serialized.includes('token='));
for(const name of ['map_latitude_max5','map_longitude_max5'])assert(!serialized.includes(name));
const kinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))kinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);
assert.deepEqual(kinds,[...Array(5).fill('Custom Text/Text'),'Javascript/Script']);
const trap=()=>{throw Error('Unexpected network/timer/async access');};
const run=(code,instant)=>vm.runInNewContext(code+'\nmain()',{
  Date:{now:()=>instant},fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap
},{timeout:100});
const minute=withMapMinuteURL(full,'https://example.test');
for(const instant of [1791181259999,1791181260000,1791181260123,1791181560000]){
  const url=run(source['10'],instant);
  assert.equal(url,run(expected['3']['66'][0]['10'],instant));
  const u=parseMapRequest(url),blank=parseMapRequest(run(mapSource(minute)['10'],instant));
  blank.searchParams.set('lat','0');blank.searchParams.set('lon','0');
  assert.equal(u.href,blank.href,'Same fast minute URL except explicit synthetic coordinates');
  assert.equal(u.searchParams.get('t'),String(Math.floor(instant/60000)*60000));
  assert.equal(u.searchParams.get('width'),'3306');assert.equal(u.searchParams.get('reuse'),'60');
  assert(!u.searchParams.has('cache'));assert(!u.searchParams.has('city'));assert(!u.searchParams.has('at'));
  assert.deepEqual(resolveLocation(u,{'x-vercel-ip-latitude':'4','x-vercel-ip-longitude':'5'}),
    {latitude:0,longitude:0,city:'',source:'coordinates'},'0,0 remains valid, no IP fallback');
}
assert.notEqual(run(source['10'],1791181259999),run(source['10'],1791181260000));
for(const origin of ['http://example.test','https://example.test/','https://user:pass@example.test'])
  assert.throws(()=>withMapFixedMarker(full,origin),/invalid_origin/);

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-fixed-marker.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapFixedMarker,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-fixed-marker.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-fixed-marker.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-fixed-marker.js?v=map-fixed-marker-1'));
assert(html.includes('Widgy_Map_Fixed_Marker_1.json'));
assert(html.includes('./widgy-map-minute-url.html?v=map-minute-url-1'));
console.log('PASS: fixed synthetic marker at valid 0,0; 21 unchanged layers/one synchronous variable; no native location sources; original parser/time/URL/cache policy retained; exact document delta and real public import/copy/download/retry flow verified. Idle device timing still requires user test.');
