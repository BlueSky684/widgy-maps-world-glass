import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C9.json'),w=structuredClone(base);
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const round=v=>Math.round(v*1e6)/1e6;
const scalar=v=>({a:[{a:round(v),b:168,c:0,d:168}],b:0});
const y=n=>n.c.a[0].a*1184/1600;
const height=n=>n.e.a[0].a*1184/1600;
const setYHeight=(n,top,h)=>{n.c=scalar(top/1184*1600);n.e=scalar(h/1184*1600);};
const stats={selectedDates:0,hebrewTitles:0,secondaryDetails:0,allDayLabels:0};
for(const n of walk(w['1'])){
 if(n.s==='Calendar · Today Live Date'){
  // The approved technical preview uses Phenomena Bold only inside Today.
  // Preserve 31px cap height and the same cap-center as the previous font.
  const baseline=y(n)+.802*height(n),h=31/.558;
  n['1']='Phenomena-Bold';setYHeight(n,baseline-.802*h,h);stats.selectedDates++;
 }else if(/^Event [1-4] · Hebrew Title$/.test(n.s??'')){
  n.e=scalar(n.e.a[0].a*.8);stats.hebrewTitles++;
 }else if(/^Event [1-4] · Location$/.test(n.s??'')){
  // R2 preview secondary copy is 23px; C2 reduced it to about 20px to
  // accommodate multiline titles. Restore cap height at its C2 baseline.
  const baseline=y(n)+.802*height(n),h=23/.558;
  setYHeight(n,baseline-.802*h,h);stats.secondaryDetails++;
 }else if(/^Event [1-4] · All Day Label$/.test(n.s??'')){
  // 25px cap fits ALL DAY in 92px; full 28px time size would overflow.
  const baseline=y(n)+.802*height(n),h=25/.6;
  setYHeight(n,baseline-.802*h,h);stats.allDayLabels++;
 }
}
assert.deepEqual(stats,{selectedDates:95,hebrewTitles:108,secondaryDetails:4,allDayLabels:4});
w['3']='Widgy Home Glass Calendar C10';
w['4']='C10 typography: Today numeral alone uses the approved Phenomena Bold at the same 31px cap height; ordinary native dates are unchanged. Hebrew event title boxes reduced 20%, retaining System Medium and right alignment. Secondary details restored to 23px cap height; ALL DAY increased to 25px within its existing column. No additional layers, data requests or variables. Event-dot offset is still pending an export from the installed Widgy editor.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C10.json',import.meta.url),JSON.stringify(w));
let page=readFileSync(new URL('./widgy-home-calendar-c9.html',import.meta.url),'utf8').replaceAll('C9','C10').replaceAll('c9','c10');
page=page.replace('Calendar C10: איחוד 148 שכבות כפולות בלוח השנה — 1,617 שכבות בסך הכול. השיפור בזמן התגובה עדיין דורש בדיקה באייפון.','Calendar C10: ספרת היום בתוך העיגול בעובי שבהדמיה, כותרות עבריות קטנות יותר וטקסט משני קריא יותר. מספר השכבות נשאר 1,617.');
page=page.replace('בדוק כמה מעברים בין חודשים ובדוק את זמן התגובה ואת טבעת הצעדים.','בדוק את הספרה בתוך העיגול ואת גודל הטקסט ברשימת TODAY.');
page=page.replace('<p><a href="./widgy-calendar-c10-diagnostic.html">בדיקה נפרדת לבידוד ההמתנה למפה</a></p>','<p><a href="./widgy-calendar-dot-position-check.html">קובץ קטן לזיהוי הגדרת מיקום נקודות האירועים</a></p>');
writeFileSync(new URL('./widgy-home-calendar-c10.html',import.meta.url),page);
writeFileSync(new URL('../assets/calendar-glass/Calendar_C10_Build_Stats.json',import.meta.url),JSON.stringify({...stats,layers:[...walk(w['1'])].length,ordinaryNativeDatesUnchanged:true,eventDotPositionChanged:false},null,2)+'\n');
console.log(JSON.stringify({...stats,layers:[...walk(w['1'])].length,eventDotPositionChanged:false}));
