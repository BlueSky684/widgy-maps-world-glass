import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C8.json'),w=structuredClone(base);
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const cal=w['1'].find(n=>n.d0===247);
const panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
const names=['Calendar · Subtle Header Rule','Calendar · Native Spacer Cover'];
const withoutId=n=>Object.fromEntries(Object.entries(n).filter(([k])=>k!=='d0'));
const shared=[],removed=[];
for(const name of names){
 const copies=panes.flatMap(p=>p['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??'')))
  .flatMap(layout=>layout['1'].filter(n=>n.s===name));
 assert.equal(copies.length,75);
 for(const n of copies)assert.deepEqual(withoutId(n),withoutId(copies[0]));
 assert(!copies[0].o1&&copies[0].a!==false);
 shared.push(copies[0]);removed.push(...copies.slice(1).map(n=>n.d0));
}
// Every selectable month shows exactly one 4/5/6-week layout. Its identical
// header cover/rule can therefore be shared at Calendar scope. Groups have
// no transforms. The pair stays above every native calendar. The only layers
// it crosses are Today badges, whose frames do not intersect the header.
for(const p of panes)for(const layout of p['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''))){
 layout['1']=layout['1'].filter(n=>!names.includes(n.s));
}
cal['1'].unshift(...shared); // Native Widgy order is topmost first.
w['3']='Widgy Home Glass Calendar C9';
w['4']='C9 shares the identical Calendar header cover and rule across all 75 native month layouts: 1765 to 1617 stored layers. No new images, variables, requests or conditions. Full +/-12-month navigation, approved fonts, live data and repaired 10000-step ring retained. This is structural consolidation, not a measured phone latency improvement. Event-dot placement remains pending native setting evidence.';
const stats={layersBefore:[...walk(base['1'])].length,layersAfter:[...walk(w['1'])].length,removedCount:removed.length,removedIds:removed,sharedIds:shared.map(n=>n.d0),nativeCalendars:75,newImages:0,newVariables:0,phoneLatencyMeasured:false};
assert.equal(stats.layersAfter,1617);assert.equal(stats.removedCount,148);
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C9.json',import.meta.url),JSON.stringify(w));
writeFileSync(new URL('../assets/calendar-glass/Calendar_C9_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
let page=readFileSync(new URL('./widgy-home-calendar-c8.html',import.meta.url),'utf8').replaceAll('C8','C9').replaceAll('c8','c9');
page=page.replace('Calendar C9: תיקון טבעת הצעדים, מסגרות קלות יותר והסרת 119 שכבות ישנות או כפולות.','Calendar C9: איחוד 148 שכבות כפולות בלוח השנה — 1,617 שכבות בסך הכול. השיפור בזמן התגובה עדיין דורש בדיקה באייפון.');
writeFileSync(new URL('./widgy-home-calendar-c9.html',import.meta.url),page);
const diagnostic=readFileSync(new URL('./widgy-calendar-c8-diagnostic.html',import.meta.url),'utf8').replaceAll('C8','C9').replaceAll('c8','c9');
writeFileSync(new URL('./widgy-calendar-c9-diagnostic.html',import.meta.url),diagnostic);
console.log(JSON.stringify({...stats,removedIds:undefined}));
