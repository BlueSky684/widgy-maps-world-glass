import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C4.json');
const w=structuredClone(base),cal=w['1'].find(n=>n.d0===247);
const panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
assert.equal(panes.length,25);

// Normal Widgy buttons reset unspecified layers to their default visibility.
// C4 omitted Calendar's hidden-by-default ancestor and Home's visible default.
// Every month action must specify the whole tab state as well as the month.
const otherTabs=w['1'].filter(n=>n.d0!==247).map(n=>n.d0);
function fixAction(n){
 const m=/^button_(\d+)-([\d,]+)$/.exec(n['1a']??'');
 assert(m,`Unexpected month action: ${n.s}`);
 const target=Number(m[1]);assert(panes.some(p=>p.d0===target));
 const hidden=[...otherTabs,...m[2].split(',').map(Number)];
 n['1a']=`button_247,${target}-${hidden.join(',')}`;
}
for(const pane of panes)for(const n of pane['1'])if(n.z==='11'&&n['1a'])fixAction(n);
fixAction(cal['1'].find(n=>n.s==='CALENDAR Tap'));

// All date-grid choices now share one JavaScript variable. C4 created a
// separate global calculation for each of 25 offsets. Keep the full range,
// native grids, fonts, event sources and date-badge geometry unchanged.
const layoutVar=w['36'].find(n=>n['1']==='calendar_month_rows');assert(layoutVar);
const oldRowIds=new Set(w['36'].filter(n=>/^calendar_month_rows(?:_-?\d+)?$/.test(n['1'])).map(n=>n['0']));
assert.equal(oldRowIds.size,25);
w['36']=w['36'].filter(n=>!oldRowIds.has(n['0'])||n===layoutVar);
layoutVar['1']='calendar_month_layouts';layoutVar['2']=0;
layoutVar['3'].s='Calendar month layouts · one shared calculation';
layoutVar['3']['66']=[{'5':'Javascript','6':'Script','10':'function main(){var now=new Date(),out="|";for(var offset=-12;offset<=12;offset++){var d=new Date(now.getFullYear(),now.getMonth()+offset,1),days=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();out+=offset+":"+Math.ceil((d.getDay()+days)/7)+"|";}return out;}'}];
for(const pane of panes){
 const offset=Number(pane.s.split(' ').at(-1));
 for(const layout of pane['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''))){
  const rows=Number(layout.s.match(/[456]/)[0]);
  layout.o1={'0':layoutVar['0'],'1':2,'2':`|${offset}:${rows}|`};
 }
}

w['3']='Widgy Home Glass Calendar C5';
w['4']='Calendar C5: month navigation explicitly retains Calendar and hides Home/Weather/Fitness when normal buttons reset visibility. Consolidates 25 global month-layout JavaScript calculations into one; retains the full +/-12-month range and approved C4 appearance. Native responsiveness and button behavior require device review. Original R12/C2 copy button retained.';
assert.deepEqual(w['1'].filter(n=>n.d0!==247),base['1'].filter(n=>n.d0!==247));
assert.equal(w['36'].length,base['36'].length-24);
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C5.json',import.meta.url),JSON.stringify(w));
console.log(JSON.stringify({name:w['3'],monthActionsFixed:74,monthLayoutScriptsBefore:25,monthLayoutScriptsAfter:1,variables:w['36'].length,monthRange:[-12,12],homePreserved:true}));
