import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withHomeSyncMapOnly} from './home-sync-map-only.js';
import {withHomeSyncMapLean} from './home-sync-map-lean.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withHomeSyncMapOnly(full),result=withHomeSyncMapLean(full);
const removedNames=new Set(['wx_status','wx_wind_speed','day_greeting','day_progress','steps_today','steps_goal','steps_progress','steps_label','calendar_home_count','calendar_home_event_word','calendar_home_title','calendar_home_meta']);
const restored=structuredClone(result);
restored['36']=structuredClone(control['36']);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only variables and metadata change; all layers/other fields exact');
assert.deepEqual(full,before,'Input immutable');
assert.equal(control['36'].length,81);assert.equal(result['36'].length,69);
assert.deepEqual(result['36'],control['36'].filter(v=>!removedNames.has(v['1'])),
  'Only the named definitions removed; exact retained IDs, sources and ordering');
const home=result['1'].find(n=>n.s==='HOME');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(home['1'].length,15);assert.equal(nodes.length,1289);assert.equal(ids.size,nodes.length);
for(const n of nodes)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),'Dangling tap target '+id);
const names=new Set(result['36'].map(v=>v['1']));
for(const match of JSON.stringify(result).matchAll(/\$\{widgy\.([^}]+)\}/g))
  assert(names.has(match[1]),'Missing variable '+match[1]);
for(const mutate of [
  w=>w['36'].find(v=>v['1']==='wx_status')['0']='',
  w=>w['36'].find(v=>v['1']==='steps_goal')['1']='renamed_goal',
  w=>w['1'].find(n=>n.s==='CALENDAR').s='${widgy.steps_today}',
  w=>w['1'].find(n=>n.s==='CALENDAR').s=w['36'].find(v=>v['1']==='steps_today')['0'].toUpperCase(),
  w=>w['36'].find(v=>v['1']==='calendar_native_city')['0']=w['36'].find(v=>v['1']==='steps_today')['0']
]){
  const bad=structuredClone(full);mutate(bad);
  assert.throws(()=>withHomeSyncMapLean(bad),/unexpected_template/);
}
const html=readFileSync(new URL('./widgy-home-sync-map-lean.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={};let downloaded,copied,error;
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,
  consolidateWidget,compactCalendarDots,thinNativeStepsRing,withHomeSyncMapLean,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-home-sync-map-lean.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert(html.includes('widgy-home-sync-map-lean.js?v=home-sync-map-lean-1'));
assert(html.includes('Widgy_Home_Sync_Map_Lean_1.json'));
assert(html.includes('./widgy-map-sync-recovery.html?v=map-sync-recovery-1'));
assert(html.includes('./widgy-home-sync-map-only.html?v=home-sync-map-only-1'));
console.log('PASS: exactly 12 unreferenced variable definitions removed (81 to 69); remaining sources/order and all map/layer/navigation/document fields exact. 15 Home / 1289 total nodes. Unsafe name/ID references rejected. Synthetic copy/download/auth/session recovery controller passes. Native evaluation and timing unmeasured.');
