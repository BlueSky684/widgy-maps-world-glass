import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const w=read('./Widgy_Home_Glass_Calendar_C4.json');
const c3=read('./Widgy_Home_Glass_Calendar_C3.json');
const cal=w['1'].find(n=>n.d0===247),before=c3['1'].find(n=>n.d0===247);
const panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
const offsets=new Map(panes.map(n=>[Number(n.s.split(' ').at(-1)),n]));
const variables=new Map(w['36'].map(n=>[n['0'],n]));
assert.equal(panes.length,25);
assert.deepEqual(panes.filter(n=>n.a!==false).map(n=>n.d0),[offsets.get(0).d0]);
assert.deepEqual(w['1'].filter(n=>n.d0!==247),c3['1'].filter(n=>n.d0!==247));
// This release does not alter native Agenda rows, title routing, location,
// header dates, chrome, or weekday typography.
const moved=n=>/^Calendar · [456] Week Layout$/.test(n.s??'')||['Calendar Month','Calendar Year','CALENDAR Tap'].includes(n.s);
assert.deepEqual(cal['1'].filter(n=>!panes.includes(n)&&!moved(n)),before['1'].filter(n=>!moved(n)));
function target(action,current){
 const match=/^button_(\d+)-([\d,]+)$/.exec(action['1a']);assert(match);
 const shown=+match[1],hidden=match[2].split(',').map(Number);
 assert.equal(new Set(hidden).size,24);assert(!hidden.includes(shown));
 assert.deepEqual([...hidden,shown].sort(),panes.map(n=>n.d0).sort());
 const visible=new Set([current]);hidden.forEach(id=>visible.delete(id));visible.add(shown);
 assert.deepEqual([...visible],[shown]);return shown;
}
let transitions=0;
for(const [offset,pane] of offsets){
 for(const [name,destination] of [['Calendar · Previous Month',offset-1],['Calendar · Next Month',offset+1],['Calendar · Return to Current Month',0]]){
  const button=pane['1'].find(n=>n.s===name);
  if(destination < -12||destination > 12){assert(!button);continue;}
  assert.equal(target(button,pane.d0),offsets.get(destination).d0);transitions++;
 }
}
for(const pane of panes)assert.equal(target(cal['1'].find(n=>n.s==='CALENDAR Tap'),pane.d0),offsets.get(0).d0);
// Run the emitted JavaScript, not a second copy of its implementation. Month
// ends, leap days, year rollover, all 25 offsets and every native row layout.
let dates=0,cases=0;const observedRows=new Set();
for(let year=2024;year<=2032;year++)for(let month=0;month<12;month++)for(const day of [1,2,28,new Date(year,month+1,0).getDate()]){
 const now=new Date(year,month,day,12),RealDate=Date;
 class FixedDate extends RealDate{constructor(...args){super(...(args.length?args:[now.getTime()]));}static now(){return now.getTime();}}
 const run=code=>vm.runInNewContext(code+';main();',{Date:FixedDate});
 for(const [offset,pane] of offsets){
  const expected=new Date(year,month+offset,1),days=new Date(year,month+offset+1,0).getDate();
  const rows=Math.ceil((expected.getDay()+days)/7);observedRows.add(rows);
  const selected=pane['1'].filter(n=>n.o1&&run(variables.get(n.o1['0'])['3']['66'][0]['10'])===Number(n.o1['2']));
  assert.equal(selected.length,1);const native=selected[0]['1'].find(n=>n.z==='10');
  assert.equal(native['44'].a[0].a,offset);assert.equal(native['44'].a[0].b,688);
  assert.equal(native['53'],'Agenda');assert.equal(native['54'],'Calendar Events');
  const monthText=run(pane['1'].find(n=>n.s==='Calendar Month')['66'][0]['10']);
  const yearText=run(pane['1'].find(n=>n.s==='Calendar Year')['66'][0]['10']);
  assert.equal(monthText,expected.toLocaleString('en-US',{month:'long'}));
  assert.equal(yearText,String(expected.getFullYear()));
  assert.equal(+selected[0].s.match(/[456]/)[0],rows);
  const badges=selected[0]['1'].filter(n=>/^Calendar · Today Cell /.test(n.s??''));
  if(offset===0){
   const visible=badges.filter(n=>run(variables.get(n.o1['0'])['3']['66'][0]['10'])===Number(n.o1['2']));
   assert.equal(visible.length,1);assert.equal(+visible[0].o1['2'],expected.getDay()+day-1);
  }else{assert.equal(badges.length,0);assert.equal(native['10'],'uicol_clear-100');}
  cases++;
 }
 dates++;
}
assert.deepEqual([...observedRows].sort(),[4,5,6]);
console.log(JSON.stringify({passed:true,dates,monthCases:cases,navigationTransitions:transitions,homeAndAgendaPreserved:true,nativeDeviceReviewStillRequired:true}));
