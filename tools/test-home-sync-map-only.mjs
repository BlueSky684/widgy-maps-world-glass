import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapSyncRecovery} from './native-city-url.js';
import {withHomeSyncMapOnly} from './home-sync-map-only.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withMapSyncRecovery(full),result=withHomeSyncMapOnly(full);
const home=w=>w['1'].find(n=>n.s==='HOME');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const restored=structuredClone(result);
home(restored)['1']=structuredClone(home(control)['1']);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only Home content and metadata change');
assert.deepEqual(full,before,'Input immutable');
assert.deepEqual(result['36'],control['36'],'All 81 variables are exact, ordered and unchanged');
assert.equal(result['36'].length,81);
assert.equal(walk(home(control)['1']).length,240);
assert.equal(home(result)['1'].length,15);
assert.equal(walk(result['1']).length,1289);
assert.deepEqual(home(result)['1'],home(control)['1'].filter(n=>home(result)['1'].some(r=>r.d0===n.d0)),
  'Exact retained map/navigation fields and drawing order');
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(ids.size,nodes.length);
for(const n of nodes)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),'Dangling tap target '+id);
const names=new Set(result['36'].map(v=>v['1']));
for(const match of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))
  assert(names.has(match[1]),'Missing variable '+match[1]);
for(const mutate of [
  w=>home(w)['1'].find(n=>n.s==='Home Hero World Map')['2']='https://example.test/other.png',
  w=>home(w)['1'].find(n=>n.d0===5021).d0=999999,
  w=>w['36'].pop()
]){
  const bad=structuredClone(full);mutate(bad);
  assert.throws(()=>withHomeSyncMapOnly(bad),/unexpected_template/);
}
const html=readFileSync(new URL('./widgy-home-sync-map-only.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withHomeSyncMapOnly,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-home-sync-map-only.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-home-sync-map-only.js?v=home-sync-map-only-1'));
assert(html.includes('Widgy_Home_Sync_Map_Only_1.json'));
assert(html.includes('./widgy-map-sync-recovery.html?v=map-sync-recovery-1'));
console.log('PASS: only non-map Home content removed; all 81 variables, map pipeline/frame, navigation and other fields exact. 15 Home / 1289 total nodes, valid dependencies and taps, immutable input. Actual copy/download/auth/retry/page restoration controller passes. Native timing unmeasured.');
