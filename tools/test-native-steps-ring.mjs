import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import vm from 'node:vm';
import {replaceHomeStepsWithNativeRing,NATIVE_STEPS_RING} from './native-steps-ring.js';

// Generic fields transcribed from the owner's native 20261004-202443 export.
// No owner token, location, calendar data, or full private export is stored here.
const native={z:'9','1':'Pedometer','2':'Steps','20':10000,d0:82316,
  '8':{b:0,a:[{a:30,c:0,d:1403,b:1403}]},
  '9':{b:0,a:[{a:30,c:0,b:1404,d:1404}]},'10':'uicol_widgy5-100',
  d:{b:0,a:[{a:800,c:0,b:1367,d:1367}]},
  e:{b:0,a:[{a:800,c:0,b:1367,d:1367}]}};
const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const control=compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic')));
const original=structuredClone(control),nativeOriginal=structuredClone(native);
const result=replaceHomeStepsWithNativeRing(control,native);
assert.deepEqual(result,replaceHomeStepsWithNativeRing(control));
assert.deepEqual(control,original);
assert.deepEqual(native,nativeOriginal);
const flat=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const before=flat(control['1']),after=flat(result['1']);
const removed=before.filter(n=>/^Steps Goal Ring · \d+%$/.test(n.s||''));
assert.equal(removed.length,100);
assert.equal(before.length,1613);
assert.equal(after.length,1514);
assert.equal(after.filter(n=>/^Steps Goal Ring · \d+%$/.test(n.s||'')).length,0);
assert.equal(after.filter(n=>n.z==='9').length,1);
assert.equal(new Set(after.map(n=>n.d0)).size,after.length);
const ring=after.find(n=>n.z==='9');
assert.equal(ring['1'],'Pedometer');assert.equal(ring['2'],'Steps');
assert.equal(ring['20'],10000);assert(!ring.o1);
assert.equal(ring['10'],removed[0].g,'Exact original lime material');
assert.deepEqual(ring['8'],native['8']);assert.deepEqual(ring['9'],native['9']);
for(const key of ['b','c','d','e'])assert.deepEqual(ring[key],removed[0][key]);
assert.equal(result['36'].length,81);
assert.deepEqual(result['36'],control['36']);
assert.deepEqual(result['1'].slice(1),control['1'].slice(1));
// Restore the removed block; the entire document must be identical, proving
// that unrelated Home artwork, data bindings, assets and navigation did not move.
const restored=structuredClone(result),home=restored['1'].find(n=>n.d0===245);
home['1'].splice(home['1'].findIndex(n=>n.z==='9'),1,...removed);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control);
for(const mutate of [n=>n['1']='Health (Daily)',n=>n['2']='Walking Step Length (Avg)',
  n=>n['20']=100]){
  const wrong=structuredClone(native);mutate(wrong);
  assert.throws(()=>replaceHomeStepsWithNativeRing(control,wrong),/unexpected_native_ring_template/);
}
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const elements=new Map(),events={};let downloaded,copied,error;
const element=id=>{
  if(!elements.has(id))elements.set(id,{events:{},classList:{toggle(){}},
    addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}});
  return elements.get(id);
};
const context={document:{getElementById:element},Blob,consolidateWidget,compactCalendarDots,replaceHomeStepsWithNativeRing,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(readFileSync(new URL('./widgy-native-steps-ring.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
await new Promise(setImmediate);assert.equal(element('copy').disabled,false);
assert.deepEqual(JSON.parse(await downloaded.text()),result);
await element('copy').events.click();assert.deepEqual(JSON.parse(copied),result);
error='unauthorized';await element('retry').events.click();assert.equal(element('copy').disabled,true);
assert.equal(element('download').href,undefined);assert.equal(element('download').hidden,true);
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(element('copy').disabled,false);
context.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await element('copy').events.click();assert.equal(element('download').hidden,false);
assert(!JSON.stringify(NATIVE_STEPS_RING).includes('token'));
console.log('PASS: all 100 manual ring layers removed; 1613 → 1514; native Pedometer/Steps and goal 10000; exact original frame/lime; all other properties unchanged except trial name/description. Copy/download, expired login and page restoration checked with synthetic data. Native thickness, edge cases and latency require phone verification.');
