import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
export const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const original=structuredClone(normal);
export const candidate=consolidateWidget(normal);
export const flat=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const conditionKey=c=>JSON.stringify(Object.entries(c).sort(([a],[b])=>a.localeCompare(b)));
// A proof at the predicate level does not assume English status strings, a
// particular contains implementation, numeric parsing or missing-value rules.
export function displayList(nodes,conditions=[],manual=[]){
  return nodes.flatMap(n=>{
    const active=[...conditions,...(n.o1?[conditionKey(n.o1)]:[])];
    const visibility=n.a===false?[...manual,n.d0]:manual;
    if(n.z==='13')return displayList(n['1'],active,visibility);
    const drawing=structuredClone(n);delete drawing.o1;
    return [{drawing,conditions:[...new Set(active)].sort(),manual:visibility}];
  });
}
assert.deepEqual(normal,original,'Transformation must not mutate the control');
assert.deepEqual(displayList(candidate['1']),displayList(normal['1']),
  'Every drawing, source, frame, style, ordered predicate conjunction and manual visibility path is preserved');
for(const key of Object.keys(normal).filter(k=>!['1','3','4'].includes(k)))
  assert.deepEqual(candidate[key],normal[key],`Unchanged document field ${key}`);
assert.deepEqual(candidate['1'].slice(2),normal['1'].slice(2));
const before=flat(normal['1']),after=flat(candidate['1']);
const ids=new Set(after.map(n=>n.d0));
assert.equal(ids.size,after.length,'Unique layer IDs');
assert.deepEqual(after.filter(n=>n.z==='11'),before.filter(n=>n.z==='11'));
for(const n of after)if(n['1a']?.startsWith('button_'))
  for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),`Tap target ${id}`);
assert.equal(before.length-after.length,58);
assert.equal(flat(candidate['1'][0]['1']).length,339);
assert.equal(flat(candidate['1'][1]['1']).length,1222);
assert.equal(candidate['36'].length,81);
assert.equal(after.filter(n=>n.s==='Home Hero World Map').length,1);
for(const name of ['Home Hero World Map','Hero Time','Approved Glass · Chrome and Frames'])
  assert.deepEqual(after.find(n=>n.s===name),before.find(n=>n.s===name));
assert.deepEqual(after.filter(n=>/^Steps Goal Ring|^Day Progress Fill/.test(n.s)),
  before.filter(n=>/^Steps Goal Ring|^Day Progress Fill/.test(n.s)));

const statusID=normal['36'].find(v=>v['1']==='wx_status')['0'];
const windID=normal['36'].find(v=>v['1']==='wx_wind_speed')['0'];
const terms=['Clear','Cloudy','Partly','Fair','Night','Rain','Heavy','Thunder','Snow','Sleet','Fog'];
const winds=[undefined,'','not available',-1,0,29.9,30,30.1,100];
function visible(nodes,status,wind){
  const test=c=>{
    const value=c['0']===statusID?status:c['0']===windID?wind:undefined;
    if(c['1']===2)return String(value??'').includes(c['2']);
    if(c['1']===3)return !String(value??'').includes(c['2']);
    if(c['1']===5)return Number(value)>=Number(c['2']);
    if(c['1']===6)return Number(value)<Number(c['2']);
    throw Error('unknown predicate');
  };
  return nodes.flatMap(n=>n.o1&&!test(n.o1)?[]:n.z==='13'?visible(n['1'],status,wind):[n.d0]);
}
const wx=w=>w['1'][0]['1'].filter(n=>n.z==='13'&&/^WX · /.test(n.s));
let weatherCases=0;
const statuses=[undefined,'',...Array.from({length:2**terms.length},(_,mask)=>
  terms.filter((_,bit)=>mask&(1<<bit)).join(' '))];
for(const status of statuses)for(const wind of winds){
  assert.deepEqual(visible(wx(candidate),status,wind),visible(wx(normal),status,wind));weatherCases++;
}
// Reject future templates with effects, transformed groups or references to
// removed wrappers instead of silently altering native behavior.
for(const mutate of [
  w=>{w['1'][0]['1'].find(n=>n.z==='13').q=.5;},
  w=>{w['1'][0]['1'].find(n=>n.z==='13').d.a[0].a=1599;},
  w=>{w['1'][0]['1'].find(n=>n.z==='11')['1a']='button_80000-247';},
  w=>{w['1'][1]['1'].find(n=>n.s==='Agenda · Row 1')['1'].find(n=>n.s==='Event 1 · Accent').a=false;},
  w=>{w['1'][1]['1'].find(n=>n.s==='Agenda · Row 1')['1'].find(n=>n.s==='Event 1 · Original Title Layout')['1'][0].o1={};}
]){
  const bad=structuredClone(normal);mutate(bad);assert.throws(()=>consolidateWidget(bad),/unexpected_template/);
}
assert.throws(()=>consolidateWidget(template),/unexpected_template/);
console.log(`Consolidation: exact ordered display-list/predicate equivalence; ${weatherCases} weather/wind fixtures; 58 wrappers removed; all sources, navigation and drawing data preserved. Native Widgy timing/rendering not measured.`);

// Exercise the actual copy/download page with a synthetic owner-export stub.
// No authenticated endpoint or image source is fetched by this test.
const elements=new Map();
const element=id=>{
  if(!elements.has(id))elements.set(id,{events:{},classList:{toggle(){}},
    addEventListener(event,handler){this.events[event]=handler;},
    removeAttribute(name){delete this[name];}});
  return elements.get(id);
};
let downloadBlob,copied,exportError,exportCalls=0;
const revoked=[],pageEvents={};
const context={document:{getElementById:element},Blob,consolidateWidget,
  URL:{createObjectURL(blob){downloadBlob=blob;return 'blob:synthetic';},revokeObjectURL(url){revoked.push(url);}},
  navigator:{clipboard:{async writeText(text){copied=text;}}},
  window:{addEventListener(event,handler){pageEvents[event]=handler;}},
  async prepareWidget(){exportCalls++;if(exportError)throw Error(exportError);return {payload:JSON.stringify(normal)};}};
const controller=readFileSync(new URL('./widgy-consolidated.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
vm.runInNewContext(controller,context);
await new Promise(setImmediate);
assert.equal(exportCalls,1);assert.equal(element('copy').disabled,false);
assert.deepEqual(JSON.parse(await downloadBlob.text()),candidate);
await element('copy').events.click();assert.deepEqual(JSON.parse(copied),candidate);
exportError='unauthorized';await element('retry').events.click();
assert.equal(element('copy').disabled,true);assert.equal(element('download').hidden,true);
assert.equal(element('download').href,undefined);assert.equal(element('retry').hidden,false);
assert.equal(revoked.length,1);assert.match(element('status').textContent,/כרום/);
copied=null;await element('copy').events.click();assert.equal(copied,null);
exportError=null;pageEvents.pageshow({persisted:true});await new Promise(setImmediate);
assert.equal(exportCalls,3);assert.equal(element('copy').disabled,false);
context.navigator.clipboard.writeText=async()=>{throw Error('clipboard denied');};
await element('copy').events.click();assert.match(element('status').textContent,/ההעתקה נחסמה/);
assert.equal(element('download').hidden,false);
console.log('Copy/download controller: correct complete export, stale-payload cleanup on failure, retry, back-navigation refresh and clipboard fallback verified using mocks.');
