import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const c9=read('./Widgy_Home_Glass_Calendar_C9.json'),base=read('./Widgy_Home_Glass_Calendar_C10.json'),w=structuredClone(base);
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const reference=new Map([...walk(c9['1'])].map(n=>[n.d0,n]));
const round=v=>Math.round(v*1e6)/1e6;
let changed=0;
for(const n of walk(w['1']))if(/^Event [1-4] · Hebrew Title$/.test(n.s??'')){
 const original=reference.get(n.d0),right=original.b.a[0].a+original.d.a[0].a;
 // C10 reduced height only. IMG_9692 and IMG_9693 both show the same
 // 272x32px glyph run, demonstrating that width still limits this text.
 // Scale both dimensions to 80% of C9, preserving its aspect ratio and
 // right edge. C10 already has the required 80%-height frame.
 n.d.a[0].a=round(original.d.a[0].a*.8);
 n.b.a[0].a=round(right-n.d.a[0].a);
 assert(Math.abs(n.e.a[0].a/original.e.a[0].a-.8)<1e-7);
 assert(Math.abs(n.b.a[0].a+n.d.a[0].a-right)<.000002);
 changed++;
}
assert.equal(changed,108);
const clean=structuredClone(w);
for(const n of walk(clean['1']))if(/^Event [1-4] · Hebrew Title$/.test(n.s??'')){
 const before=[...walk(base['1'])].find(x=>x.d0===n.d0);n.b=before.b;n.d=before.d;
}
assert.deepEqual(clean,base); // Before adding the native indicator offsets.
const sample=read('../assets/calendar-glass/Native_Calendar_Dot_Offset_75.json');
const nativeOffset=sample['39'];
assert.deepEqual(nativeOffset,{a:[{b:1218,a:75,c:0,d:1218}],b:0});
// Exported from the installed app after changing only Data Source Symbol
// Offset Y from its -55% default to +75% (IMG_9694 -> IMG_9697). The latter
// shows 6px dots centered about 42px below each date in a 112px week row.
// Calendar's Y offset is modeled as a percentage of half the row height.
// 15*N therefore keeps the same 42px clearance in 4/5/6-row month layouts.
const cal=w['1'].find(n=>n.d0===247),offsetStats=[];
for(const pane of cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''))){
 for(const layout of pane['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''))){
  const rows=Number(layout.s.match(/[456]/)[0]);
  const native=layout['1'].find(n=>n.z==='10');assert(native);
  native['39']=structuredClone(nativeOffset);native['39'].a[0].a=15*rows;
  offsetStats.push({monthOffset:Number(pane.s.split(' ').at(-1)),rows,offset:15*rows});
 }
}
assert.equal(offsetStats.length,75);
// Verify exactly the intended changes; never copy the probe's unrelated
// styles/default omissions (e.g. zero Month Offset) into production.
const restored=structuredClone(w),baseNodes=new Map([...walk(base['1'])].map(n=>[n.d0,n]));
for(const n of walk(restored['1'])){
 const before=baseNodes.get(n.d0);
 if(n.z==='10'){
  if(Object.hasOwn(before,'39'))n['39']=before['39'];else delete n['39'];
 }else if(/^Event [1-4] · Hebrew Title$/.test(n.s??'')){n.b=before.b;n.d=before.d;}
}
assert.deepEqual(restored,base);
for(const rows of [4,5,6]){
 const halfRow=280/rows,offset=15*rows,centerOffset=halfRow*offset/100;
 assert(Math.abs(centerOffset-42)<1e-9);
 assert(centerOffset-3.2-31>7); // Dot stays below the 62px Today disc.
 assert(halfRow-centerOffset-3.2>.7); // Above the next separator, even at 6 rows.
}
w['3']='Widgy Home Glass Calendar C11';
w['4']='C11 places native event dots below dates using Calendar field 39 verified in the user export at +75%. Uses +60/+75/+90% for 4/5/6-week rows, modeling a constant 42px center offset below each date with clearance from the Today disc. The 5-week offset was verified on-device; 4/6-row adaptation needs device review. Hebrew title frames now scale uniformly to 80% of C9, preserving right alignment. Other C10 typography, native sources, navigation and the 10000-step ring are unchanged. No added layers or data requests.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C11.json',import.meta.url),JSON.stringify(w));
const oldDescription='Calendar C10: ספרת היום בתוך העיגול בעובי שבהדמיה, כותרות עבריות קטנות יותר וטקסט משני קריא יותר. מספר השכבות נשאר 1,617.';
const correctedDescription='Calendar C10: ספרת היום בתוך העיגול בעובי שבהדמיה וטקסט משני קריא יותר. הקטנת הכותרות בעברית לא באה לידי ביטוי באייפון. מספר השכבות נשאר 1,617.';
const notice='<p><b>עדכון מהבדיקה באייפון:</b> העיבוי של ספרת היום הוצג, אך הטקסט בעברית לא קטן בפועל. <a href="./widgy-home-calendar-c11.html">C11 מתקנת גם את רוחב תיבת הטקסט</a>.</p>\n';
const previous=readFileSync(new URL('./widgy-home-calendar-c10.html',import.meta.url),'utf8').replace(notice,'').replace(correctedDescription,oldDescription);
assert(previous.includes(oldDescription));
let page=previous.replace(oldDescription,'Calendar C10: נקודות האירועים הועברו מתחת לתאריכים, עם התאמת המרווח לפריסות החודשים. גם רוחב תיבות הכותרות בעברית הוקטן כדי לתקן את גודל הטקסט. מספר השכבות נשאר 1,617.').replaceAll('C10','C11').replaceAll('c10','c11');
page=page.replace('בדוק את הספרה בתוך העיגול ואת גודל הטקסט ברשימת TODAY.','בדוק את הנקודות מתחת לתאריכים ואת גודל הכותרות בעברית.');
page=page.replace('מיקום נקודות האירועים טרם שונה; הוא ממתין לאימות הגדרות Calendar מהמכשיר.','הערך לפריסה של חמש שורות נבדק בקובץ הבדיקה באייפון. ההתאמה לפריסות של ארבע ושש שורות והקטנת העברית דורשות בדיקה בווידג׳ט המלא.');
writeFileSync(new URL('./widgy-home-calendar-c11.html',import.meta.url),page);
// Keep the historical importer honest after device evidence disproved the
// height-only typography claim; offer the corrected candidate explicitly.
writeFileSync(new URL('./widgy-home-calendar-c10.html',import.meta.url),previous.replace(oldDescription,correctedDescription).replace('  <button id="copy"',notice+'  <button id="copy"'));
const probeURL=new URL('./widgy-calendar-dot-position-check.html',import.meta.url);
const probe=readFileSync(probeURL,'utf8').replace('./widgy-home-calendar-c10.html','./widgy-home-calendar-c11.html').replace('C10 — תיקוני גודל ועובי הטקסט','C11 — נקודות האירועים והכותרות בעברית').replace('C11 — תיקון גודל הכותרות בעברית','C11 — נקודות האירועים והכותרות בעברית');
writeFileSync(probeURL,probe);
const stats={layers:[...walk(w['1'])].length,hebrewTitleFramesChanged:changed,nativeCalendarOffsetsChanged:offsetStats.length,ordinaryDateFontsAndTodayBadgeUnchanged:true,allSourcesActionsAndOtherLayersUnchanged:true,eventDotPositionChanged:true,offsetsByWeekRows:{4:60,5:75,6:90},dotCenterOffsetPx:42,measuredProbeDotDiameterPx:6,observedFiveWeekProbe:true,fourAndSixWeekSpacingModelRequiresPhoneReview:true,hebrewSizeRequiresPhoneReview:true};
writeFileSync(new URL('../assets/calendar-glass/Calendar_C11_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify(stats));
