import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {CANVAS} from './calendar_glass_design.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C3.json');
const home=read('./Widgy_Home_Glass_JS_City_R12.json');
const sample=read('../assets/calendar-glass/Native_Calendar_Agenda_Month_Template.json');
// Observed in the user's Widgy export on 2026-10-02, after changing only
// Month Offset to 1 and Data to Agenda / Calendar Events. No field guesses.
assert.equal(sample['44'].a[0].a,1);
assert.equal(sample['53'],'Agenda');
assert.equal(sample['54'],'Calendar Events');
const w=structuredClone(base),cal=w['1'].find(n=>n.d0===247);
let next=w.a2;
const id=()=>next++;
const scalar=(value,kind=168)=>({a:[{a:+value.toFixed(6),b:kind,c:0,d:kind}],b:0});
const color=i=>`hexcol_CA1E000000004000A000${String(i).padStart(12,'0')}-100`;
const frame=(n,[x,y,width,height])=>{
 const kind=n.z==='11'?222:n.z==='4'?170:168;
 for(const [k,v] of Object.entries({b:x/CANVAS.width*1600,c:y/CANVAS.height*1600,d:width/CANVAS.width*1600,e:height/CANVAS.height*1600}))n[k]=scalar(v,kind);
 return n;
};
function fresh(node){
 const result=structuredClone(node);
 function walk(n){if(!n||typeof n!=='object')return;if('d0'in n)n.d0=id();for(const v of Object.values(n))if(typeof v==='object')walk(v);}
 walk(result);return result;
}
const js=code=>({'5':'Javascript','6':'Script','10':code});
export const monthStartCode=offset=>`var now=new Date(),d=new Date(now.getFullYear(),now.getMonth()+(${offset}),1);`;
export const rowsCode=offset=>`function main(){${monthStartCode(offset)}return Math.ceil((d.getDay()+new Date(d.getFullYear(),d.getMonth()+1,0).getDate())/7);}`;
function rowsVariable(offset){
 if(offset===0)return w['36'].find(n=>n['1']==='calendar_month_rows')['0'];
 const uid=`CA1E0000-0000-4000-C004-${String(w['36'].length+1).padStart(12,'0')}`;
 w['36'].push({'0':uid,'1':`calendar_month_rows_${offset}`,'2':2,'3':{z:'1',s:`Month rows ${offset}`,'66':[js(rowsCode(offset))],d:scalar(800),e:scalar(200)}});
 return uid;
}
const originalLayouts=cal['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''));
assert.equal(originalLayouts.length,3);
const monthTemplate=cal['1'].find(n=>n.s==='Calendar Month');
const yearTemplate=cal['1'].find(n=>n.s==='Calendar Year');
// Native visibility buttons are already used successfully for the main tabs.
// Keep a finite, explicit 25-month window, with no wrapping at its boundaries.
const offsets=Array.from({length:25},(_,i)=>i-12);
const panes=new Map(offsets.map(offset=>[offset,{d0:id(),z:'13',s:`Calendar · Month Offset ${offset}`,'1':[],...(offset===0?{}:{a:false})}]));
function action(name,box,target){
 const hide=offsets.filter(n=>n!==target).map(n=>panes.get(n).d0).join(',');
 return frame({d0:id(),z:'11',s:name,'1a':`button_${panes.get(target).d0}-${hide}`},box);
}
function arrow(direction,enabled){
 return frame({d0:id(),z:'4',s:`Calendar · ${direction} Arrow${enabled?'':' · Boundary'}`,'3':`chevron.${direction}`,f:enabled?color(2):color(6)},[direction==='left'?59:578,292,14,28]);
}
for(const offset of offsets){
 const pane=panes.get(offset),children=pane['1'],rows=rowsVariable(offset);
 children.push(action('Calendar · Return to Current Month',[100,264,452,80],0));
 if(offset>-12)children.push(action('Calendar · Previous Month',[36,264,62,80],offset-1));
 if(offset<12)children.push(action('Calendar · Next Month',[554,264,62,80],offset+1));
 children.push(arrow('left',offset>-12),arrow('right',offset<12));
 const month=fresh(monthTemplate),year=fresh(yearTemplate);
 month['66']=[js(`function main(){${monthStartCode(offset)}return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];}`)];
 year['66']=[js(`function main(){${monthStartCode(offset)}return String(d.getFullYear());}`)];
 children.push(month,year);
 for(const original of originalLayouts){
  const layout=offset===0?original:fresh({...original,'1':original['1'].filter(n=>!/^Calendar · Today Cell /.test(n.s??''))});
  const native=layout['1'].find(n=>n.z==='10');
  native['53']=sample['53'];native['54']=sample['54'];
  native['44']=structuredClone(sample['44']);native['44'].a[0].a=offset;
  // The custom C3 badge remains exclusive to the current-month pane.
  // Other panes do not highlight today's date if it appears as an overflow day.
  if(offset!==0)native['10']='uicol_clear-100';
  layout.o1['0']=rows;
  children.push(layout);
 }
}
const moved=new Set([monthTemplate,yearTemplate,...originalLayouts]);
cal['1']=cal['1'].filter(n=>!moved.has(n));
// Returning via the selected Calendar tab is another convenient reset. Other
// main-tab groups, including all of Home R12, remain byte-for-byte equivalent.
const calendarTab=cal['1'].find(n=>n.s==='CALENDAR Tap');
calendarTab['1a']=action('Reset', [0,0,1,1],0)['1a'];
cal['1'].unshift(...panes.values());
w.a2=next;w['3']='Widgy Home Glass Calendar C4';
w['4']='Calendar C4: native Agenda / Calendar Events indicators from the device export; month navigation from 12 months before to 12 months after the current month. Tap the month heading or selected Calendar tab to return to the current month. TODAY agenda remains today while browsing. Native indicator appearance and month-button rendering require device review. Home R12 and C3 event typography preserved.';
assert.deepEqual(w['1'].filter(n=>n.d0!==247),home['1'].filter(n=>n.d0!==247));
assert.deepEqual(w['36'].slice(0,base['36'].length),base['36']);
const ids=[];function walk(n){if(!n||typeof n!=='object')return;if('d0'in n)ids.push(n.d0);for(const v of Object.values(n))if(typeof v==='object')walk(v);}
walk(w['1']);assert.equal(ids.length,new Set(ids).size);assert(w.a2>Math.max(...ids));
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C4.json',import.meta.url),JSON.stringify(w));
console.log(JSON.stringify({name:w['3'],layers:ids.length,monthOffsets:[-12,12],nativeMonths:75,homePreserved:true,deviceReviewRequired:['native event indicators','month navigation']}));
