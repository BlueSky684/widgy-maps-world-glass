import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const old=read('./Widgy_Home_Glass_Calendar_C4.json'),w=read('./Widgy_Home_Glass_Calendar_C5.json');
const cal=w['1'].find(n=>n.d0===247),oldCal=old['1'].find(n=>n.d0===247);
const panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
const offsets=new Map(panes.map(n=>[+n.s.split(' ').at(-1),n]));
const defaults=new Map([...w['1'],...panes].map(n=>[n.d0,n.a!==false]));
const variables=new Map(w['36'].map(n=>[n['0'],n]));
const layoutVar=w['36'].find(n=>n['1']==='calendar_month_layouts');
function click(action){
 const m=/^button_([\d,]+)-([\d,]+)$/.exec(action['1a']);assert(m);
 // Ordinary buttons restore defaults first; they are not additive buttons.
 const state=new Map(defaults);
 for(const id of m[1].split(',').map(Number)){assert(state.has(id));state.set(id,true);}
 for(const id of m[2].split(',').map(Number)){assert(state.has(id));state.set(id,false);}
 return state;
}
const broken=oldCal['1'].find(n=>n.s==='Calendar · Month Offset 0')['1'].find(n=>n.s==='Calendar · Next Month');
const reproduced=click(broken);assert.equal(reproduced.get(245),true);assert.equal(reproduced.get(247),false);
let transitions=0;
function check(action,target){
 const state=click(action);assert.equal(state.get(247),true);
 for(const id of [245,246,195])assert.equal(state.get(id),false);
 assert.deepEqual(panes.filter(p=>state.get(p.d0)).map(p=>p.d0),[offsets.get(target).d0]);transitions++;
}
for(const [offset,pane] of offsets)for(const [name,target] of [['Calendar · Previous Month',offset-1],['Calendar · Next Month',offset+1],['Calendar · Return to Current Month',0]]){
 const action=pane['1'].find(n=>n.s===name);
 if(target < -12||target > 12){assert(!action);continue;}
 check(action,target);
}
check(cal['1'].find(n=>n.s==='CALENDAR Tap'),0);
// The main Calendar tab retains its established action and default month.
check(w['1'].find(n=>n.d0===245)['1'].find(n=>n.s==='CALENDAR Tap'),0);
const neutralize=n=>{
 if(Array.isArray(n))return n.map(neutralize);
 if(n&&typeof n==='object')return Object.fromEntries(Object.entries(n).filter(([k])=>k!=='1a'&&k!=='o1').map(([k,v])=>[k,neutralize(v)]));
 return n;
};
assert.deepEqual(neutralize(w['1']),neutralize(old['1']));
assert.deepEqual(w['1'].filter(n=>n.d0!==247),old['1'].filter(n=>n.d0!==247));
assert.equal(w['36'].length,old['36'].length-24);
let cases=0;const counts=new Set();
for(let y=2024;y<=2032;y++)for(let m=0;m<12;m++)for(const day of [1,28,new Date(y,m+1,0).getDate()]){
 const now=new Date(y,m,day,12),RealDate=Date;
 class FixedDate extends RealDate{constructor(...args){super(...(args.length?args:[now.getTime()]));}}
 const result=vm.runInNewContext(layoutVar['3']['66'][0]['10']+';main();',{Date:FixedDate});
 for(const [offset,pane] of offsets){
  const first=new Date(y,m+offset,1),days=new Date(y,m+offset+1,0).getDate(),rows=Math.ceil((first.getDay()+days)/7);
  const selected=pane['1'].filter(n=>n.o1&&n.o1['0']===layoutVar['0']&&n.o1['1']===2&&result.includes(n.o1['2']));
  assert.equal(selected.length,1);assert.equal(+selected[0].s.match(/[456]/)[0],rows);
  const native=selected[0]['1'].find(n=>n.z==='10');assert.equal(native['44'].a[0].a,offset);counts.add(rows);cases++;
 }
}
assert.deepEqual([...counts].sort(),[4,5,6]);
console.log(JSON.stringify({passed:true,c4HomeResetReproduced:true,navigationChecks:transitions,monthCases:cases,sharedMonthLayoutScripts:1,appearanceUnchanged:true,requiresDeviceTiming:true}));
