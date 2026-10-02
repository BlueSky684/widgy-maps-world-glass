import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {withoutMap} from './widgy-calendar-diagnostics.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const old=read('./Widgy_Home_Glass_Calendar_C8.json'),w=read('./Widgy_Home_Glass_Calendar_C9.json');
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const all=[...walk(w['1'])],before=[...walk(old['1'])],byId=new Map(before.map(n=>[n.d0,n]));
assert.equal(all.length,1617);assert.equal(new Set(all.map(n=>n.d0)).size,1617);
const ids=new Set(all.map(n=>n.d0));
assert(w.a2>Math.max(...ids));
for(const n of all)if(n['1a'])for(const id of n['1a'].slice(7).split(/[-,]/).map(Number))assert(ids.has(id),`Dangling action ${id}`);
for(const [key,value] of Object.entries(old))if(!['1','3','4'].includes(key))assert.deepEqual(w[key],value);
assert.deepEqual(w['1'].filter(n=>n.d0!==247),old['1'].filter(n=>n.d0!==247));
// Every surviving leaf is byte-for-byte equal: actions, fonts, dimensions,
// data sources, ring segments, native calendars, image URLs and conditions.
for(const n of all)if(n.z!=='13')assert.deepEqual(n,byId.get(n.d0));
const names=['Calendar · Subtle Header Rule','Calendar · Native Spacer Cover'];
assert.equal(before.filter(n=>names.includes(n.s)).length,150);
assert.equal(all.filter(n=>names.includes(n.s)).length,2);
assert.equal(all.filter(n=>n.z==='10').length,75);
const originalCal=old['1'].find(n=>n.d0===247),cal=w['1'].find(n=>n.d0===247);
const panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
assert.equal(panes.length,25);
const canonical=n=>JSON.stringify(Object.fromEntries(Object.entries(n).filter(([k])=>k!=='d0')));
const rect=n=>['b','c','d','e'].map(k=>n[k].a[0].a);
const intersects=(a,b)=>a[0]<b[0]+b[2]&&b[0]<a[0]+a[2]&&a[1]<b[1]+b[3]&&b[1]<a[1]+a[3];
const shared=cal['1'].filter(n=>names.includes(n.s));
assert.deepEqual(shared.map(n=>n.s),names);
let cases=0,nonoverlapChecks=0;
for(const pane of panes){
 const originalPane=originalCal['1'].find(n=>n.d0===pane.d0);
 assert(!pane.b&&!pane.c&&!pane.d&&!pane.e&&!pane.o1);
 const metadata=n=>Object.fromEntries(Object.entries(n).filter(([k])=>k!=='1'));
 assert.deepEqual(metadata(pane),metadata(originalPane));
 for(const layout of pane['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''))){
  const original=originalPane['1'].find(n=>n.d0===layout.d0);
  assert.deepEqual(metadata(layout),metadata(original));
  assert(!layout.b&&!layout.c&&!layout.d&&!layout.e&&layout.a!==false);
  assert.deepEqual(layout['1'],original['1'].filter(n=>!names.includes(n.s)));
  const previous=[...walk(original['1'])].filter(n=>n.z!=='13').map(canonical).sort();
  const next=[...shared,...[...walk(layout['1'])].filter(n=>n.z!=='13')].map(canonical).sort();
  assert.deepEqual(next,previous); // Same leaf content in each of the 75 states.
  assert.deepEqual(original['1'].filter(n=>names.includes(n.s)).map(n=>n.s),names);
  const movedAcross=original['1'].slice(0,original['1'].findIndex(n=>names.includes(n.s)));
  for(const n of walk(movedAcross))if(n.z!=='13')for(const h of shared){
   assert(!intersects(rect(n),rect(h)),`Header overlaps ${n.s}`);nonoverlapChecks++;
  }
  cases++;
 }
}
// Other Calendar children and their relative order are unchanged.
assert.deepEqual(cal['1'].filter(n=>!names.includes(n.s)&&!panes.includes(n)),originalCal['1'].filter(n=>!/^Calendar · Month Offset /.test(n.s??'')));
const script=v=>readFileSync(new URL(`./widgy-home-calendar-${v.toLowerCase()}.html`,import.meta.url),'utf8').split('<script>')[1];
assert.equal(script('C9').replaceAll('C9','C8'),script('C8'));
const diagnostic=withoutMap(w);
assert.equal(diagnostic['3'],'Widgy Calendar C9 Map-Off Test');
assert.deepEqual(diagnostic['1'].filter(n=>n.d0!==245),w['1'].filter(n=>n.d0!==245));
assert.equal(diagnostic['36'].length,w['36'].length-5);
const page=readFileSync(new URL('./widgy-calendar-c9-diagnostic.html',import.meta.url),'utf8');
assert(page.includes('./Widgy_Home_Glass_Calendar_C9.json')&&page.includes('Widgy Calendar C9 Map-Off Test'));
assert(page.includes('./widgy-calendar-diagnostics.mjs'));
console.log(JSON.stringify({passed:true,layersBefore:before.length,layersAfter:all.length,layoutStates:cases,nonoverlapChecks,allSurvivingLeavesUnchanged:true,allActionsAndGlobalSourcesUnchanged:true,copyHandlerUnchanged:true,phoneLatencyMeasured:false}));
