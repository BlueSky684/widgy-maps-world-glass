import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinimalPair} from './map-minimal-pair.js';
import {withNavigationOnly} from './navigation-only.js';
import {withMapStaticOnly} from './map-static-only.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withMapMinimalPair(full),empty=withNavigationOnly(full);
const result=withMapStaticOnly(full,'https://example.test');
assert.deepEqual(full,before);
const home=w=>w['1'].find(n=>n.d0===245);
const image=w=>home(w)['1'].find(n=>n.d0===6170);
const expectedURL='https://example.test/assets/diagnostics/Home_Map_Static_3306x1558.png';
assert.equal(image(result)['2'],expectedURL);
const restored=structuredClone(result);
image(restored)['2']=image(control)['2'];restored['36']=structuredClone(control['36']);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only image URL/five definitions/metadata differ vs minimal live map');
const removed=structuredClone(result);
home(removed)['1']=home(removed)['1'].filter(n=>n.d0!==6170);
removed['3']=empty['3'];removed['4']=empty['4'];
assert.deepEqual(removed,empty,'Only static image plus metadata added vs immediate navigation control');
assert.equal(image(result).z,'5');assert.equal(image(result)['1'],'Web URL');
assert.equal(image(result)['3'],image(control)['3']);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,21);assert.equal(ids.size,21);
assert.equal(nodes.filter(n=>n.z==='5').length,1);
assert.equal(nodes.filter(n=>n.z==='11').length,4);
assert.equal(result['36'].length,0);
assert(!JSON.stringify(result).includes('${widgy.'));
assert(!JSON.stringify(result).includes('/api/'));
assert(!JSON.stringify(result).includes('token='));
for(const v of control['36'])assert(!JSON.stringify(result).toLowerCase().includes(v['0'].toLowerCase()));
const sourceKinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))sourceKinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);assert.deepEqual(sourceKinds,Array(5).fill('Custom Text/Text'));
for(const origin of ['http://example.test','https://example.test/','https://example.test/path',
  'https://example.test?token=x','https://user:pass@example.test','javascript:alert(1)'])
  assert.throws(()=>withMapStaticOnly(full,origin),/invalid_origin/);
for(const n of nodes)if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id));
// Existing build fixture only: verify we did not select the old half-size image.
const png=readFileSync(new URL('../assets/diagnostics/Home_Map_Static_3306x1558.png',import.meta.url));
assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16),3306);assert.equal(png.readUInt32BE(20),1558);
assert.equal(png.length,4075465);
assert.equal(createHash('sha256').update(png).digest('hex'),'c4ccdacd84dec137bd46c6061a4f5b69ed4d210e5cec0bc5e2d08865ffc17df9');

// Exercise real import controller with PUBLIC template fetch only, no account
// session, location, geocoder or private-calendar request. No network is used.
const html=readFileSync(new URL('./widgy-map-static-only.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapStaticOnly,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-static-only.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-static-only.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-static-only.js?v=map-static-only-1'));
assert(html.includes('Widgy_Map_Static_Only_1.json'));
assert(html.includes('./widgy-navigation-only.html?v=navigation-only-1'));
console.log('PASS: exact image frame/provider/cache flag and navigation retained; one static URL, zero variables/native GPS/JS/calendar sources; complete document deltas checked against both controls; full 3306x1558 existing PNG hash verified; public-only copy/download/retry/failure flow passes. Native import, map visibility and transition timing remain unmeasured.');
