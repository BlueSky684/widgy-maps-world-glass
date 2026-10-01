import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {dayPercentScript} from './widgy-time-logic.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const r3=JSON.parse(read('./Widgy_Home_Glass_JS_City_R3.json'));
const r4=JSON.parse(read('./Widgy_Home_Glass_JS_City_R4.json'));
const widget=structuredClone(r4);
// DAY PROGRESS is the local calendar day, not the sunrise-to-sunset interval.
// Restore the established native script: completed whole percentages, reset
// at local midnight. Sunrise/sunset labels remain independent live data.
widget['36'].find(v=>v['1']==='day_progress')['3']['66'][0]['10']=dayPercentScript;
const all=w=>w['1'].flatMap(function walk(n){return [n,...(n.z==='13'?n['1'].flatMap(walk):[])];});
const known=new Map(all(r3).map(n=>[n.d0,n]));
const layers=all(widget);

// IMG_9659 proves BarlowCondensed-Regular is missing on the user's phone.
// Restore every original native text layer's exact R3 font; a font's presence
// in the web map's assets is NOT evidence that it is installed in Widgy.
for(const n of layers)if(n.z==='1'&&known.has(n.d0)){
  const old=known.get(n.d0);
  if('1' in old)n['1']=old['1'];else delete n['1'];
}

const home=widget['1'].find(n=>n.d0===245);
const get=id=>home['1'].find(n=>n.d0===id);
const frame=(n,[x,y,w,h])=>{
 for(const [k,v]of Object.entries({b:x/1135*1600,c:y/1184*1600,d:w/1135*1600,e:h/1184*1600}))n[k].a[0].a=Math.round(v*1e6)/1e6;
};
// Restore the complete, phone-proven one-line label, not only its font name.
Object.assign(get(6122),structuredClone(known.get(6122)));

// Both dynamic strings use one common center, independent of word length.
for(const id of [6103,6104])get(id)['2']={a:[{a:1,b:168}],b:0};
// Center each live solar time within its own slot, with a shared baseline.
for(const [id,box]of [[6121,[109,720,100,50]],[6124,[941,720,98,50]]]){
 frame(get(id),box);get(id)['2']={a:[{a:1,b:168}],b:0};
}
// Keep the native temperature/unit source. A modestly smaller cap height and
// 4px left shift reserve ~30px of clear space before the card's divider.
frame(get(6131),[219,849,123,99]);
frame(get(6132),[219,932,133,59]);

// Preserve native centering while restoring the original Phenomena numeral
// height/baseline. Two subpixel offsets strengthen the original outline by
// 1.5 physical pixels without introducing another font dependency. All three
// are the same native daily-date source and update together at midnight.
const day=get(6105),oldDay=known.get(6105);
day.c=structuredClone(oldDay.c);day.e=structuredClone(oldDay.e);
assert.equal(day['2'].a[0].a,1);
for(const offset of [-.75,.75]){
  const n=structuredClone(day);n.d0=widget.a2++;n.s='Header Day · Weight';
  n.b.a[0].a=Math.round((n.b.a[0].a+offset/1135*1600)*1e6)/1e6;
  home['1'].splice(home['1'].indexOf(day),0,n);
}

widget['3']='Widgy Home Glass JS City R5';
widget['4']='R5 repairs the R4 missing-font regression shown in IMG_9659/IMG_9660. Every existing text layer uses its exact R3 font; DAY PROGRESS restores the proven one-line layer and calculates the complete local day from midnight to midnight, not daylight. Weekday and month share a native center. Native centered date restores Phenomena Bold and original height with subtle overlapping native text offsets for weight. Temperature is inset and reduced to clear the divider. R4 thin 13px ring, 10,000-step goal, compact frames and calendar icon retained. Other live data, weather/map artwork and actions unchanged. Calendar content remains demo data.';
assert.deepEqual(widget['36'].filter(v=>v['1']!=='day_progress'),r3['36'].filter(v=>v['1']!=='day_progress'));
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R5.json',import.meta.url),JSON.stringify(widget));
const page=read('./widgy-home-js-city-r3.html')
 .replaceAll('JS City R3','JS City R5').replaceAll('JS_City_R3','JS_City_R5')
 .replace('אייקון FITNESS עודכן לדמות רצה. טבעת הצעדים עודכנה לקשת רציפה עם קצוות מעוגלים ומרכז כהה, בהתאם לרפרנס המאושר.','חזרה לגופנים שעבדו, DAY PROGRESS בשורה אחת ובחישוב מחצות עד חצות, מרכוז התאריך ושעות הזריחה והשקיעה, ומרווח נוסף ליד הטמפרטורה. הטבעת הדקה והיעד היומי נשמרו.')
 .replace('מבוסס על R2 שהציגה את המפה ושם העיר מחוץ לעורך.','משתמש בגופנים המקוריים של R3.');
writeFileSync(new URL('./widgy-home-js-city-r5.html',import.meta.url),page);
// Withdraw the broken importer; its previously shared URL leads to the repair.
writeFileSync(new URL('./widgy-home-js-city-r4.html',import.meta.url),`<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=./widgy-home-js-city-r5.html"><title>Widgy R5</title><p>גרסת R4 הוחלפה בתיקון הגופנים. <a href="./widgy-home-js-city-r5.html">מעבר לגרסת R5</a></p></html>`);
console.log('Built R5: exact proven R3 fonts, restored one-line DAY PROGRESS, native centered/strengthened original date, unchanged R4 thin ring. R4 importer withdrawn.');
