import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinimalPair} from './map-minimal-pair.js';
import {withNavigationOnly} from './navigation-only.js';
import {withMapSourceOnly} from './map-source-only.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withMapMinimalPair(full),empty=withNavigationOnly(full),result=withMapSourceOnly(full);
assert.deepEqual(full,before);
const home=w=>w['1'].find(n=>n.d0===245);
const slot=w=>home(w)['1'].findIndex(n=>n.d0===6170);
const text=home(result)['1'][slot(result)],image=home(control)['1'][slot(control)];
assert.equal(slot(result),slot(control));
const restored=structuredClone(result);
home(restored)['1'][slot(restored)]=structuredClone(image);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only one display object and metadata change vs live map');
const removed=structuredClone(result);
home(removed)['1']=home(removed)['1'].filter(n=>n.d0!==6170);removed['36']=[];
removed['3']=empty['3'];removed['4']=empty['4'];
assert.deepEqual(removed,empty,'Only active URL text and exact five definitions added vs fast navigation');
assert.deepEqual(result['36'],control['36'],'All source objects, IDs, scripts and formatters exact');
assert.equal(text.z,'1');
assert.deepEqual(text['66'],[{'5':'Custom Text','6':'Text','25':'${widgy.map_request}'}]);
assert.equal(text['1'],'BarlowCondensed-Light');
assert.equal(text.f,home(control)['1'].find(n=>n.d0===5013).f);
assert(!('2' in text));assert(!('3' in text));assert(!('1a' in text));
for(const key of ['b','c','d','e','d0'])assert.deepEqual(text[key],image[key]);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,21);assert.equal(ids.size,21);
assert.equal(nodes.filter(n=>n.z==='5').length,0);
assert.equal(result['36'].length,5);
assert(!JSON.stringify(result).includes('/api/calendar-'));
assert(!JSON.stringify(result).includes('token='));
const names=new Set(result['36'].map(v=>v['1']));
for(const m of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(m[1]));
const sourceKinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))sourceKinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);
assert.equal(sourceKinds.filter(k=>k==='Custom Text/Text').length,6);
assert.equal(sourceKinds.filter(k=>k==='Javascript/Script').length,1);
assert.equal(sourceKinds.filter(k=>k.startsWith('Location/')).length,4);
assert.equal(sourceKinds.length,11);
// These are source-value checks, not a simulation of native Text scheduling.
const code=result['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10'];
for(const [latitude,longitude] of [['0','0'],['12.5','-80.25'],['','']]){
  const values={map_latitude_max5:latitude,map_longitude_max5:longitude,Latitude:'-1',Longitude:'2'};
  const substituted=code.replace(/"\$\{widgy\.([^}]+)\}"/g,(_,name)=>JSON.stringify(values[name]));
  const url=vm.runInNewContext(substituted+';main();',{
    Date:{now:()=>1791181201234},fetch(){throw Error('Unexpected network request');}});
  assert(url.startsWith('https://example.test/api/night-map?'));
  const parsed=new URL(url);assert.equal(parsed.searchParams.get('lat'),latitude);
  assert.equal(parsed.searchParams.get('lon'),longitude);
  assert.equal(parsed.searchParams.get('t'),'1791181200000');
  assert.equal(parsed.searchParams.get('width'),'3306');
  assert.equal(text['66'][0]['25'].replace('${widgy.map_request}',url),url);
}
// Exact actions also proved by full-document comparison; targets still exist.
for(const n of nodes)if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id));

// Exercise real import controller with PUBLIC template fetch only, no account
// session, location, geocoder or private-calendar request. No network is used.
const html=readFileSync(new URL('./widgy-map-source-only.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapSourceOnly,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-source-only.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-source-only.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-source-only.js?v=map-source-only-1'));
assert(html.includes('Widgy_Map_Source_Only_1.json'));
assert(html.includes('./widgy-home-sync-map-lean.html?v=home-sync-map-lean-1'));
console.log('PASS: exact five source objects and single consumer replacement, 21 layers and no images; complete original URL resolves with synthetic inputs without fetch; controls/actions/resources retained; public-only copy/download/retry/failure paths pass. Native text binding and transition speed require device validation.');
