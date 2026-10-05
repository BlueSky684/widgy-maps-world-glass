import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinimalPair} from './map-minimal-pair.js';
import {withMapScriptConstant} from './map-script-constant.js';
import {withMapMinuteURL} from './map-minute-url.js';
import {parseMapRequest} from '../lib/native-map-request.js';
import {resolveLocation} from '../lib/map-astronomy-location.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
const before=structuredClone(full),control=withMapScriptConstant(full,'https://example.test');
const result=withMapMinuteURL(full,'https://example.test');
assert.deepEqual(full,before,'Input must not mutate');
assert.equal(result['36'].length,1);
const variable=result['36'][0],source=variable['3']['66'][0];
assert.equal(variable['1'],'map_request');assert.equal(variable['3']['66'].length,1);
const controlScript=control['36'][0]['3']['66'][0]['10'];
const expectedURL=vm.runInNewContext(controlScript+'\nmain()');
assert.deepEqual(Object.keys(source).sort(),['10','5','6']);
assert.equal(source['5'],'Javascript');assert.equal(source['6'],'Script');
let instant=0,clockReads=0;
const trap=()=>{throw Error('Unexpected network/async/timer use');};
const scriptContext=vm.createContext({fetch:trap,sendToWidgy:trap,setTimeout:trap,setInterval:trap,
  Date:{now(){clockReads++;return instant;}}});
vm.runInContext(source['10'],scriptContext,{timeout:100});
// Executing exported JS is not emulating Widgy's scheduling or image refresh.
const baseMinute=Date.parse('2026-10-05T17:10:00.000Z');
const samples=[0,1,59999,60000,60001,119999,120000,baseMinute,baseMinute+59999,baseMinute+60000,
  Date.parse('2026-12-31T23:59:59.999Z'),Date.parse('2027-01-01T00:00:00.000Z')];
const outputs=[];
for(instant of samples){
  const value=vm.runInContext('main()',scriptContext,{timeout:100});
  const stamp=Math.floor(instant/60000)*60000;
  assert.equal(value,expectedURL+'&t='+stamp);outputs.push(value);
  const url=parseMapRequest(value);
  assert.equal(url.searchParams.size,8);
  assert.equal(url.searchParams.get('t'),String(stamp));
  url.searchParams.delete('t');assert.equal(url.href,expectedURL);
  assert.equal(resolveLocation(url,{'x-vercel-ip-latitude':'1','x-vercel-ip-longitude':'2','x-vercel-ip-city':'Example'}),null);
}
assert.equal(clockReads,samples.length);
assert.equal(outputs[0],outputs[1]);assert.equal(outputs[1],outputs[2]);
assert.notEqual(outputs[2],outputs[3]);assert.equal(outputs[3],outputs[5]);
assert.notEqual(outputs[5],outputs[6]);assert.equal(outputs[7],outputs[8]);assert.notEqual(outputs[8],outputs[9]);
assert(!/fetch|sendToWidgy|setTimeout|setInterval|widgy[.]/.test(source['10']));
const restored=structuredClone(result);
restored['36'][0]['3']['66'][0]['10']=controlScript;
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only script body plus name/description differ from fast constant-script control');
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
sources(result);assert.deepEqual(kinds,[...Array(5).fill('Custom Text/Text'),'Javascript/Script']);
for(const origin of ['http://example.test','https://example.test/','https://example.test/path',
  'https://example.test?token=x','https://user:pass@example.test','javascript:alert(1)'])
  assert.throws(()=>withMapMinuteURL(full,origin),/invalid_origin/);
const malformed=structuredClone(full);
malformed['36'].find(v=>v['1']==='map_request')['0']='wrong-id';
assert.throws(()=>withMapMinuteURL(malformed,'https://example.test'),/unexpected_template/);

// Actual public import controller; no real network or owner data.
const html=readFileSync(new URL('./widgy-map-minute-url.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withMapMinuteURL,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-map-minute-url.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-map-minute-url.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
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
assert(html.includes('widgy-map-minute-url.js?v=map-minute-url-1'));
assert(html.includes('Widgy_Map_Minute_URL_1.json'));
assert(html.includes('./widgy-map-script-constant.html?v=map-script-constant-1'));
console.log('PASS: only script body/metadata differ; real main output stable inside each minute and changes at boundaries with original epoch-ms bucket; unchanged base URL and no IP fallback; 21 layers/one variable; public-only import controller passes. Native refresh and transition timing are not measured.');
