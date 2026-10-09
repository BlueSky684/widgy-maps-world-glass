import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {flatten} from './compact-widget-structure.js';
import {withSharedCalendarComputation} from './calendar-shared-computation.js';

const original=JSON.parse(readFileSync(process.argv[2])),before=structuredClone(original);
const {widget:w,report}=withSharedCalendarComputation(original);
assert.deepEqual(original,before);
const oldNodes=new Map(flatten(original['1']).map(n=>[n.d0,n])),nodes=flatten(w['1']),newNodes=new Map(nodes.map(n=>[n.d0,n]));
assert.equal(nodes.length,1202);assert.equal(nodes.length,newNodes.size);assert(w.a2>Math.max(...newNodes.keys()));
assert.equal(w['36'].length,67);
const nativeIDs=new Set(w['36'].map(v=>v['0']));assert.equal(nativeIDs.size,67);
const names=new Set(w['36'].map(v=>v['1']));assert.equal(names.size,67);
for(const m of JSON.stringify(w).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(m[1]));
for(const n of nodes)if(n.o1)assert(nativeIDs.has(n.o1['0']));
let oldScripts=0,newScripts=0;
function scripts(x,count){if(!x||typeof x!=='object')return;for(const [k,v]of Object.entries(x)){
 if(typeof v==='string'&&/function\s+main|var main =|function cityMapRuntime/.test(v)){new vm.Script(v);count();}
 else if(typeof v==='object')scripts(v,count);
}}
scripts(original,()=>oldScripts++);scripts(w,()=>newScripts++);
assert.equal(oldScripts,61);assert.equal(newScripts,26);

// Regression: native month buttons require their full original action lists.
// The state model below alone missed the return-to-Home bug on the phone.
assert.equal(report.actions.length,48);
for(const action of report.actions){
 assert.equal(newNodes.get(action.id)['1a'],oldNodes.get(action.id)['1a']);
 const [show,hide]=newNodes.get(action.id)['1a'].slice(7).split('-').map(x=>x.split(',').map(Number));
 assert(show.includes(247));assert(hide.includes(245));
 assert.equal(action.after,33);assert.equal(action.preservedExactly,true);
}

// Exact drawing/style equality is checked separately from data substitution.
const strip=n=>Object.fromEntries(Object.entries(n).filter(([k])=>!['d0','66','o1'].includes(k)));
for(const c of report.captions){
 assert.deepEqual(strip(newNodes.get(c.month)),strip(oldNodes.get(c.month)));
 for(const id of c.years)assert.deepEqual(strip(newNodes.get(id)),strip(oldNodes.get(c.years[0])));
}
const compile=code=>new Function('Date',code+';return main();');
const layoutName='calendar_month_layouts';
const oldLayout=compile(original['36'].find(v=>v['1']===layoutName)['3']['66'][0]['10']);
const changed=new Map(w['36'].filter(v=>report.addedVariables.includes(v['1'])||v['1']===layoutName).map(v=>[v['1'],compile(v['3']['66'][0]['10'])]));
const expected=report.captions.map(c=>({c,month:compile(oldNodes.get(c.month)['66'][0]['10']),year:compile(oldNodes.get(c.years[0])['66'][0]['10'])}));
function verifyDate(time){
 class Clock extends Date{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
 const values=Object.fromEntries([...changed].map(([n,fn])=>[n,fn(Clock)]));
 const tokens=oldLayout(Clock).split('|').filter(Boolean);
 for(const token of tokens)assert(values[layoutName].includes('|'+token+'|'));
 for(const {c,month,year}of expected){
  const resolve=n=>n['66'][0]['25'].replace(/\$\{widgy\.([^}]+)\}/g,(_,key)=>values[key]);
  assert.equal(resolve(newNodes.get(c.month)),month(Clock));
  const selected=c.years.map(id=>newNodes.get(id)).filter(n=>!n.o1||values[layoutName].includes(n.o1['2']));
  assert.equal(selected.length,1,`One year at ${new Date(time).toISOString()} offset ${c.offset}`);
  assert.equal(resolve(selected[0]),year(Clock));
 }
}
// Full Gregorian cycle: first AND last day catch month-end normalization;
// timezone runs below exercise Israel DST, year boundaries and travel zones.
let dates=0;
for(let year=2000;year<2400;year++)for(let month=0;month<12;month++){
 for(const day of [1,new Date(year,month+1,0).getDate()]){verifyDate(new Date(year,month,day,12).getTime());dates++;}
}
for(const zone of ['UTC','Asia/Jerusalem','America/New_York','Pacific/Kiritimati','Pacific/Pago_Pago']){
 process.env.TZ=zone;
 for(const utc of ['2026-12-31T21:59:59Z','2026-12-31T22:00:00Z','2026-10-24T22:59:59Z','2026-10-24T23:00:00Z','2026-03-27T00:00:00Z','2028-02-29T23:59:59Z']){verifyDate(Date.parse(utc));dates++;}
}

// Explore every reachable manual button state, not only an initial import.
const ancestors=new Map();
function ancestry(ns,path=[]){for(const n of ns){ancestors.set(n.d0,path);if(n.z==='13')ancestry(n['1'],[...path,n.d0]);}}
ancestry(original['1']);
const buttons=[...oldNodes.values()].filter(n=>n['1a']?.startsWith('button_'));
const targets=[...new Set(buttons.flatMap(n=>n['1a'].slice(7).split(/[-,]/).map(Number)))].sort((a,b)=>a-b);
function apply(state,action){const r={...state};const lists=action.slice(7).split('-').map(s=>s.split(',').filter(Boolean).map(Number));
 lists.forEach((ids,i)=>ids.forEach(id=>{assert(oldNodes.has(id)&&newNodes.has(id));r[id]=i===0;}));return r;}
const initial=Object.fromEntries(targets.map(id=>[id,oldNodes.get(id).a!==false]));
const key=s=>targets.map(id=>Number(s[id])).join(''),seen=new Set([key(initial)]),queue=[initial];let transitions=0;
for(let i=0;i<queue.length;i++){
 const state=queue[i];
 for(const button of buttons){
  if([...ancestors.get(button.d0),button.d0].some(id=>(state[id]??(oldNodes.get(id).a!==false))===false))continue;
  const oldResult=apply(state,button['1a']),newResult=apply(state,newNodes.get(button.d0)['1a']);
  assert.deepEqual(newResult,oldResult,button.s+' all reachable states');transitions++;
  const signature=key(oldResult);if(!seen.has(signature)){seen.add(signature);queue.push(oldResult);}
 }
 assert(queue.length<1000,'Unexpected state expansion');
}
assert(seen.size>=100);assert(transitions>=400);
// Whole-document whitelist: no map/city, asset, provider, frame, Today badge,
// font, native gauge, other-tab, cadence or unrelated source mutation.
const restored=structuredClone(w),rn=new Map(flatten(restored['1']).map(n=>[n.d0,n]));
for(const c of report.captions){
 rn.get(c.month)['66']=structuredClone(oldNodes.get(c.month)['66']);
 const pane=restored['1'].find(n=>n.d0===247)['1'].find(n=>n.s===`Calendar · Month Offset ${c.offset}`);
 pane['1']=pane['1'].filter(n=>!c.years.slice(1).includes(n.d0));
 const year=pane['1'].findIndex(n=>n.d0===c.years[0]);pane['1'][year]=structuredClone(oldNodes.get(c.years[0]));
}
for(const a of report.actions)rn.get(a.id)['1a']=oldNodes.get(a.id)['1a'];
for(const k of ['36','a2','3','4'])restored[k]=structuredClone(original[k]);
assert.deepEqual(restored,original);
const summary={pass:true,captionDateCases:dates,captionPairsChecked:dates*25,reachableManualStates:seen.size,navigationTransitions:transitions,
 scriptsBefore:oldScripts,scriptsAfter:newScripts,layersBefore:1180,layersAfter:1202,variablesBefore:52,variablesAfter:67,
 arrowTargetsBefore:report.actions.reduce((s,a)=>s+a.before,0),arrowTargetsAfter:report.actions.reduce((s,a)=>s+a.after,0),
 completeOriginalMonthActionsRestored:48,mapCityHomeAndCalendarSourcesUnchanged:true,nativeRuntimeExecuted:false};
console.log(JSON.stringify(summary));
