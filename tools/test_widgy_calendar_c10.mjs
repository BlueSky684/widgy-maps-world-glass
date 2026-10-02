import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const old=read('./Widgy_Home_Glass_Calendar_C9.json'),w=read('./Widgy_Home_Glass_Calendar_C10.json');
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const all=[...walk(w['1'])],previous=[...walk(old['1'])],map=new Map(previous.map(n=>[n.d0,n]));
assert.equal(all.length,1617);assert.equal(new Set(all.map(n=>n.d0)).size,1617);
for(const key of Object.keys(old))if(!['1','3','4'].includes(key))assert.deepEqual(w[key],old[key]);
assert.deepEqual(w['1'].filter(n=>n.d0!==247),old['1'].filter(n=>n.d0!==247));
let dates=0,hebrew=0,details=0,allDay=0;
const omit=(n,keys)=>Object.fromEntries(Object.entries(n).filter(([key])=>!keys.includes(key)));
const baseline=n=>n.c.a[0].a+.802*n.e.a[0].a;
for(const n of all){
 const before=map.get(n.d0);assert(before);
 if(n.z==='13'){assert.deepEqual(omit(n,['1']),omit(before,['1']));continue;}
 if(n.s==='Calendar · Today Live Date'){
  assert.equal(n['1'],'Phenomena-Bold');assert(Math.abs(baseline(n)-baseline(before))<.000003);
  assert.deepEqual(omit(n,['1','c','e']),omit(before,['1','c','e']));dates++;
 }else if(/^Event [1-4] · Hebrew Title$/.test(n.s??'')){
  assert(Math.abs(n.e.a[0].a-before.e.a[0].a*.8)<.000001);
  assert.deepEqual(omit(n,['e']),omit(before,['e']));hebrew++;
 }else if(/^Event [1-4] · (Location|All Day Label)$/.test(n.s??'')){
  assert.deepEqual(omit(n,['c','e']),omit(before,['c','e']));
  assert(Math.abs(baseline(n)-baseline(before))<.000003);
  if(n.s.endsWith('Location'))details++;else allDay++;
 }else assert.deepEqual(n,before);
}
assert.deepEqual({dates,hebrew,details,allDay},{dates:95,hebrew:108,details:4,allDay:4});
assert.equal(all.filter(n=>n.z==='10').length,75); // Exact equality checked above.
const script=v=>readFileSync(new URL(`./widgy-home-calendar-${v}.html`,import.meta.url),'utf8').split('<script>')[1];
assert.equal(script('c10').replaceAll('C10','C9'),script('c9'));
const probe=read('./Widgy_Calendar_Dot_Position_Check.json');
assert.equal(probe['1'].length,4);assert.equal(probe['36'].length,0);
assert.equal(probe['1'].filter(n=>n.z==='10').length,1);
const p=readFileSync(new URL('./widgy-calendar-dot-position-check.html',import.meta.url),'utf8').split('<script>')[1];
assert.equal(p.replaceAll('Widgy_Calendar_Dot_Position_Check.json','Widgy_Home_Glass_Calendar_C9.json').replaceAll('Widgy Calendar Dot Position Check','Widgy Home Glass Calendar C9'),script('c9'));
console.log(JSON.stringify({passed:true,layers:1617,changedTodayNumerals:dates,smallerHebrewTitles:hebrew,secondaryDetails:details,allDayLabels:allDay,nativeDateLayersUnchanged:75,allActionsAndDataUnchanged:true,copyFlowUnchanged:true,dotOffsetPending:true}));
