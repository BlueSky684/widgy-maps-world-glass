import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinimalPair} from './map-minimal-pair.js';
import {withMapDirectLive} from './map-direct-live.js';
import {withMapURLVariable} from './map-url-variable.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
const before=structuredClone(full),control=withMapDirectLive(full,'https://example.test');
const result=withMapURLVariable(full,'https://example.test');
assert.deepEqual(full,before,'Input must not mutate');
const image=w=>w['1'].find(n=>n.d0===245)['1'].find(n=>n.d0===6170);
assert.equal(result['36'].length,1);
const variable=result['36'][0],source=variable['3']['66'][0];
assert.equal(variable['1'],'map_request');
assert.deepEqual(variable['3']['66'],[{'5':'Custom Text','6':'Text','25':image(control)['2']}]);
assert.equal(image(result)['2'],'${widgy.map_request}');
// This verifies the export contract, NOT native Widgy resolution or scheduling.
assert.equal(image(result)['2'].replace('${widgy.map_request}',source['25']),image(control)['2']);
const originalVariable=full['36'].find(v=>v['1']==='map_request');
const restoredVariable=structuredClone(variable);
restoredVariable['3']['66']=structuredClone(originalVariable['3']['66']);
assert.deepEqual(restoredVariable,originalVariable,'Keep original variable metadata/type/frame/identity');
const restored=structuredClone(result);
image(restored)['2']=image(control)['2'];restored['36']=[];
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only constant variable, image binding and metadata differ');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,21);assert.equal(ids.size,21);
assert.equal(nodes.filter(n=>n.z==='5').length,1);
assert.equal(nodes.filter(n=>n.z==='11').length,4);
for(const n of nodes)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id));
const serialized=JSON.stringify(result);
assert.equal(serialized.split('/api/').length-1,1);
assert(!serialized.includes('token='));
assert.deepEqual([...serialized.matchAll(/\$\{widgy\.([^}]+)\}/g)].map(m=>m[1]),['map_request']);
for(const v of withMapMinimalPair(full)['36'].filter(v=>v['1']!=='map_request'))
  assert(!serialized.toLowerCase().includes(v['0'].toLowerCase()));
const kinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))kinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);assert.deepEqual(kinds,Array(6).fill('Custom Text/Text'));
for(const origin of ['http://example.test','https://example.test/','https://example.test/path',
  'https://example.test?token=x','https://user:pass@example.test','javascript:alert(1)'])
  assert.throws(()=>withMapURLVariable(full,origin),/invalid_origin/);
const malformed=structuredClone(full);
malformed['36'].find(v=>v['1']==='map_request')['0']='wrong-id';
assert.throws(()=>withMapURLVariable(malformed,'https://example.test'),/unexpected_template/);

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-url-variable.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapURLVariable,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-url-variable.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-url-variable.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-url-variable.js?v=map-url-variable-1'));
assert(html.includes('Widgy_Map_URL_Variable_1.json'));
assert(html.includes('./widgy-map-direct-live.html?v=map-direct-live-1'));
console.log('PASS: exact constant URL through one Custom Text variable; only binding/variable/metadata differ; 21 layers, no GPS or JS; navigation, input immutability and public-only import controller pass. Native resolution and timing remain unverified.');
