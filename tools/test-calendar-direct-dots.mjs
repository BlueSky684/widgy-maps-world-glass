import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {directCalendarDots} from './calendar-direct-dots.js';

const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const flat=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const normal=personalizedWidget(read('./Widgy_Home_Glass_Calendar_C16.json'),
  'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const control=consolidateWidget(normal),saved=structuredClone(control);
const candidate=directCalendarDots(control);
assert.deepEqual(control,saved,'The control is immutable');
const before=flat(control['1']),after=flat(candidate['1']);
const originals=new Map(before.map(n=>[n.d0,n]));
const moved=control['36'].filter(v=>/^calendar_dots_url_[mp]\d+$/.test(v['1']));
assert.equal(moved.length,25);
assert.equal(candidate['36'].length,56);
assert.equal(after.length,1613);
assert.equal(before.length,after.length);
assert.deepEqual(candidate['36'],control['36'].filter(v=>!moved.includes(v)),
  'All remaining sources, IDs and source order are identical');
assert.deepEqual(candidate['1'][0],control['1'][0],'Home is identical');
assert.deepEqual(candidate['1'].slice(2),control['1'].slice(2),'Other tabs are identical');

// The transformation is reversible with only the declared provider delta.
// This compares every drawing, condition, frame, style, tap action and source.
const restored=structuredClone(candidate);
for(const image of flat(restored['1']).filter(n=>n.s==='Calendar · Browser Event Dots')){
  const old=originals.get(image.d0);
  image['1']=old['1'];image['2']=old['2'];delete image['22'];
}
restored['36']=structuredClone(control['36']);
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'Only provider placement and the 25 variables may change');

// This provider schema predates the candidate and came from a native export.
const native=flat(read('./widgy-v113.json')['1']).find(n=>n.d0===6170);
assert.equal(native['1'],'Javascript');assert.equal(typeof native['22'],'string');
assert.equal(native['3'],true);

const times=[0,59999,60000,60001,Date.parse('2026-10-04T23:59:59.999Z'),
  Date.parse('2026-10-05T00:00:00Z'),Date.parse('2026-12-31T23:59:59.999Z'),
  Date.parse('2027-01-01T00:00:00Z'),Date.parse('2026-03-29T00:59:59.999Z'),
  Date.parse('2026-03-29T01:00:00Z'),Date.parse('2026-10-25T00:59:59.999Z'),
  Date.parse('2026-10-25T01:00:00Z')];
let fixtures=0;
for(const image of after.filter(n=>n.s==='Calendar · Browser Event Dots')){
  const old=originals.get(image.d0);
  const variable=moved.find(v=>old['2']==='${widgy.'+v['1']+'}');
  const script=variable['3']['66'][0]['10'];
  assert.equal(image['22'],script);
  for(const now of times){
    const evaluate=code=>vm.runInNewContext(code+';main();',{Date:{now:()=>now}},{timeout:1000});
    const oldURL=evaluate(script),newURL=evaluate(image['22']);
    assert.equal(newURL,oldURL);
    const url=new URL(newURL);
    assert.equal(url.origin,'https://example.test');
    assert.equal(url.searchParams.get('token'),'synthetic');
    assert.equal(url.searchParams.get('refresh'),String(Math.floor(now/60000)));
    assert.equal(url.searchParams.get('offset'),String(Number(variable['1'].slice(19))*(variable['1'][18]==='m'?-1:1)));
    fixtures++;
  }
}

for(const mutate of [
  w=>{w['36'].find(v=>v['1']==='calendar_dots_url_p0')['3']['66'][0]['6']='Async + No main()';},
  w=>{w['36'].find(v=>v['1']==='calendar_dots_url_p0')['3']['66'][0]['10']+=';fetch("https://example.test")';},
  w=>{flat(w['1']).find(n=>n.s==='Calendar · Browser Event Dots')['22']='function main(){return "";}';},
  w=>{w['1'][0].s='${widgy.calendar_dots_url_p0}';},
  w=>{w['1'][0].o1={'0':w['36'].find(v=>v['1']==='calendar_dots_url_p0')['0'],'1':0,'2':'x'};},
  w=>{const p=w['1'][1]['1'].filter(n=>/^Calendar · Month Offset /.test(n.s));p[1].s=p[0].s;}
]){
  const bad=structuredClone(control);mutate(bad);
  assert.throws(()=>directCalendarDots(bad),/unexpected_template/);
}

// Actual page controller, synthetic owner response, no network/session access.
const elements=new Map(),events={},revoked=[];
const element=id=>{
  if(!elements.has(id))elements.set(id,{events:{},classList:{toggle(){}},
    addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}});
  return elements.get(id);
};
let download,copied,error;
const context={document:{getElementById:element},Blob,consolidateWidget,directCalendarDots,
  URL:{createObjectURL(blob){download=blob;return 'blob:synthetic';},revokeObjectURL(url){revoked.push(url);}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
const controller=fs.readFileSync(new URL('./widgy-calendar-direct-dots.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
vm.runInNewContext(controller,context);
await new Promise(setImmediate);
assert.equal(element('copy').disabled,false);
assert.deepEqual(JSON.parse(await download.text()),candidate);
await element('copy').events.click();assert.deepEqual(JSON.parse(copied),candidate);
error='unauthorized';await element('retry').events.click();
assert.equal(element('copy').disabled,true);assert.equal(element('download').href,undefined);
assert.equal(element('download').hidden,true);assert.equal(element('retry').hidden,false);
assert.equal(revoked.length,1);
copied=null;await element('copy').events.click();assert.equal(copied,null);
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);
assert.equal(element('copy').disabled,false);
context.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await element('copy').events.click();assert.equal(element('download').hidden,false);
assert.match(element('status').textContent,/ההעתקה נחסמה/);
console.log(JSON.stringify({candidate:candidate['3'],layers:after.length,variables:{before:81,after:56},
  unchangedScriptCount:25,urlFixtures:fixtures,
  syntheticBytes:{before:Buffer.byteLength(JSON.stringify(control)),after:Buffer.byteLength(JSON.stringify(candidate))},
  verification:'Exact non-provider document equivalence; URL/minute boundaries; reject extra consumers; copy/download/error/retry mocks. Native image loading, refresh and latency pending.'},null,2));
