import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {withHomeDirectData} from './home-direct-data.js';
import {flatten,variableReferences} from './compact-widget-structure.js';

const source=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),saved=structuredClone(source);
const {widget:w,report}=withHomeDirectData(source);
assert.deepEqual(source,saved,'Input is immutable');
const byID=x=>new Map(flatten(x['1']).map(n=>[n.d0,n]));
const before=byID(source),after=byID(w),home=w['1'].find(n=>n.d0===245);
assert.equal(after.size,1187);assert.equal(flatten(w['1']).length,after.size);
assert.equal(w['36'].length,61);
for(const g of source['1'].filter(n=>n.d0!==245))assert.deepEqual(after.get(g.d0),g,'Other tabs and shared date remain exact');
for(const v of w['36'])assert.deepEqual(v,source['36'].find(old=>old['1']===v['1']));

for(const change of report.inlined){
  const v=source['36'].find(v=>v['1']===change.name);
  assert.deepEqual(after.get(change.layer)['66'][change.index],v['3']['66'][0],'Original source and all request options preserved');
  assert.equal(variableReferences(w,[v]).size,0);
}
const greeting=source['36'].find(v=>v['1']==='day_greeting');
assert.equal(variableReferences(w,[greeting]).size,0);
assert.equal(after.get(6102)['66'][0]['10'],greeting['3']['66'][0]['10']);
let hour=0;
class Clock {getHours(){return hour;}}
const compile=code=>vm.runInNewContext(code+';main',{Date:Clock});
const oldGreeting=compile(greeting['3']['66'][0]['10']),newGreeting=compile(after.get(6102)['66'][0]['10']);
for(let second=0;second<86400;second++){
  hour=Math.floor(second/3600);const a=oldGreeting(),b=newGreeting();
  assert.equal(a,b);assert(['MORNING','AFTERNOON','EVENING','NIGHT'].includes(b));
  const visible=[6102,80103,80104,80105].map(id=>before.get(id)).filter(n=>n.o1['2']===a);
  assert.equal(visible.length,1);assert.equal(visible[0]['66'][0]['25'],b);
}
const oldSteps=source['36'].find(v=>v['1']==='steps_label')['3']['66'][0]['10'];
const newSteps=after.get(6141)['66'][0]['10'];
for(const input of ['', '0','1','999','1000','1,000','9999','10,000','1,234,567','—',' 2,345 ','NaN','12a']){
  const run=code=>vm.runInNewContext(code.replace('${widgy.steps_today}',input)+';main()');
  assert.equal(run(newSteps),run(oldSteps));
}

// Independent ordered weather display lists: leaf data and every native
// ancestor predicate are exact, including states with missing weather data.
function weatherList(widget){
  const records=[];
  function walk(nodes,conditions=[]){for(const n of nodes){
    const next=n.o1?[...conditions,n.o1]:conditions;
    if(n.z==='13'){walk(n['1'],next);continue;}
    const data=structuredClone(n);delete data.o1;
    records.push({data,conditions:next});
  }}
  const h=widget['1'].find(n=>n.d0===245);
  walk(h['1'].filter(n=>n.z==='13' && n.s==='WX · Shared native condition'));
  return records;
}
assert.deepEqual(weatherList(w),weatherList(source));
assert.equal(weatherList(w).length,40);

const actions=x=>flatten(x['1']).filter(n=>n['1a']).map(n=>[n.d0,n['1a']]);
assert.deepEqual(actions(w),actions(source),'Every native action stays verbatim, including all 48 month arrows');
for(const [id,action]of actions(w))if(action.startsWith('button_'))for(const target of action.slice(7).split(/[-,]/).map(Number))assert(after.has(target),id+' has valid target');
for(const id of [6170,6110,82317,80209,6121,6123,6124,6131,6132,6133,6134,6143,6144])assert.deepEqual(after.get(id),before.get(id));
let scripts=0;
function scriptCheck(x){if(!x || typeof x!=='object')return;for(const v of Object.values(x)){
 if(typeof v==='string' && /function\s+main|var main =|function cityMapRuntime/.test(v)){new vm.Script(v);scripts++;}
 else scriptCheck(v);
}}
scriptCheck(w);assert.equal(scripts,26);

// Restore only declared changes. This catches accidental provider, credential,
// shape, color, font, position, action, refresh or unrelated document changes.
const restored=structuredClone(w),r=byID(restored),rh=r.get(245);
for(const change of report.inlined)r.get(change.layer)['66']=structuredClone(before.get(change.layer)['66']);
const gi=rh['1'].findIndex(n=>n.d0===6102);
rh['1'].splice(gi,1,...[6102,80103,80104,80105].map(id=>structuredClone(before.get(id))));
for(const change of report.unwrapped){
 const parent=flatten(restored['1']).find(n=>n.z==='13' && n['1'].some(c=>c.d0===change.leaf));assert(parent);
 parent['1'].splice(parent['1'].findIndex(n=>n.d0===change.leaf),1,structuredClone(before.get(change.group)));
}
restored['36']=structuredClone(source['36']);restored['3']=source['3'];restored['4']=source['4'];
assert.deepEqual(restored,source);

for(const modify of [w=>{byID(w).get(80000).unexpectedEffect=true;},w=>{byID(w).get(80000).d.a[0].a+=1;},w=>{byID(w).get(80103).e.a[0].a+=1;},w=>{w['1'][0].extra='${widgy.steps_label}';}]){
 const bad=structuredClone(source);modify(bad);assert.throws(()=>withHomeDirectData(bad));
}
console.log(JSON.stringify({pass:true,...report,greetingSecondsChecked:86400,stepsFixtures:13,weatherDrawingPredicatesExact:40,allActionsAndOtherTabsExact:true,wholeDocumentChangeWhitelist:true,scriptsParsed:scripts,nativeExecution:false},null,2));
