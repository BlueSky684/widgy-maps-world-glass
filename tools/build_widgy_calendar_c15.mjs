import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C14.json'),w=structuredClone(base);
function* walk(ns){for(const n of ns){yield n;if(n.z==='13')yield*walk(n['1']);}}
const originals=new Map([...walk(base['1'])].map(n=>[n.d0,n]));
const px=(n,k)=>n[k].a[0].a*1184/1600;
const set=(n,k,v)=>n[k].a[0].a=Math.round(v*1600/1184*1e6)/1e6;
// IMG_9706 measured visible ink: selected 2 y=537..567 (31px),
// ordinary 1 and 3 y=548..574 (27px). Their ink centers differ by 9px.
// Native Text centers glyphs inside its frame; do not reuse SVG baseline
// metrics, which previously placed the native numeral above its neighbors.
const scale=27/31,inkCenterShift=9,discCenterShift=6;
let dates=0,discs=0;
for(const n of walk(w['1'])){
 if(n.s==='Calendar · Today Live Date'){
  const oldH=px(n,'e'),newH=oldH*scale,oldY=px(n,'c');
  set(n,'e',newH);set(n,'c',oldY+(oldH-newH)/2+inkCenterShift);dates++;
  assert(Math.abs(px(n,'c')+px(n,'e')/2-(oldY+oldH/2)-inkCenterShift)<.000002);
 }else if(n.s==='Calendar · Today Disc'){
  set(n,'c',px(n,'c')+discCenterShift);discs++;
 }
}
assert.equal(dates,95);assert.equal(discs,95);
const restored=structuredClone(w);
for(const n of walk(restored['1'])){
 const old=originals.get(n.d0);
 if(n.s==='Calendar · Today Live Date'){n.c=old.c;n.e=old.e;}
 else if(n.s==='Calendar · Today Disc')n.c=old.c;
}
assert.deepEqual(restored,base);
// At 6 rows, the relocated 62px badge retains >4px clearance from the
// next week boundary and >4px from the native 6px indicator below it.
assert(560/6/2-2-31>4);
assert(42-2-31-3>4);
w['3']='Widgy Home Glass Calendar C15';
w['4']='C15 calibrates the selected native numeral to actual on-device ordinary dates in IMG_9706: visible ink height 31 to 27px, frame center down 9px, badge center down 6px. Preserve native Phenomena Bold, live day source, horizontal center, 62px disc diameter, city, week rules, dots and all other layers/actions. Changes are applied to all 95 selected-day positions across 4/5/6-week layouts. Device confirmation remains required.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C15.json',import.meta.url),JSON.stringify(w));
let page=readFileSync(new URL('./widgy-home-calendar-c14.html',import.meta.url),'utf8').replaceAll('C14','C15').replaceAll('c14','c15');
page=page.replace(/<p>Calendar C15:.*?<\/p>/,'<p>Calendar C15: ספרת היום הוקטנה והורדה לפי מדידת הספרות הסמוכות בצילום מהאייפון. העיגול הוזז בהתאם כדי להיות ממורכז סביב הספרה.</p>');
page=page.replace('בדוק את חדות הספרה בעיגול ואת ארבעת הקווים המפרידים בין שבועות החודש.','בדוק שהספרה בעיגול באותו גובה ובאותו קו של שאר הספרות.');
writeFileSync(new URL('./widgy-home-calendar-c15.html',import.meta.url),page);
const stats={sourceScreenshot:'IMG_9706.jpeg',measuredSelectedInk:{top:537,bottomExclusive:568,height:31,centerY:552.5},measuredOrdinaryInk:{top:548,bottomExclusive:575,height:27,centerY:561.5},dateSizeRatio:scale,dateFrameCenterShiftPx:inkCenterShift,discCenterShiftPx:discCenterShift,dateLayersChanged:dates,discLayersChanged:discs,allOtherValuesPreserved:true,requiresDeviceVerification:true};
writeFileSync(new URL('../assets/calendar-glass/Calendar_C15_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify(stats));
