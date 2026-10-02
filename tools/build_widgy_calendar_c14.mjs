import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C13.json'),w=structuredClone(base);
function* walk(ns){for(const n of ns){yield n;if(n.z==='13')yield*walk(n['1']);}}
const nodes=[...walk(w['1'])],source=new Map([...walk(base['1'])].map(n=>[n.d0,n]));
const scalar=v=>({a:[{a:Math.round(v*1e6)/1e6,b:168,c:0,d:168}],b:0});
const px=(n,k)=>n[k].a[0].a*(k==='b'||k==='d'?1135:1184)/1600;
const set=(n,k,p)=>n[k]=scalar(p*1600/(k==='b'||k==='d'?1135:1184));
let dates=0,rules=0;
for(const n of nodes){
 if(n.s==='Calendar · Today Approved Glyph'){
  const id=n.d0,x=px(n,'b'),top=px(n,'c'),height=31/.558;
  // C13's image is visibly soft in IMG_9705. Use the installed native font
  // again, retaining the approved baseline 45px from the badge's top.
  for(const k of Object.keys(n))delete n[k];
  Object.assign(n,{d0:id,z:'1',s:'Calendar · Today Live Date','1':'Phenomena-Bold','2':scalar(1),'66':[{'5':'Date And Time','6':'d'}],f:'hexcol_CA1E000000004000A000000000000004-100'});
  set(n,'b',x);set(n,'c',top+45-.802*height);set(n,'d',62);set(n,'e',height);dates++;
 }else if(/^Calendar · Week Separator [1-5]$/.test(n.s??'')){
  // Subpixel .7px rules vanished at the lower two boundaries on-device.
  // Retain the boundary and color; use 1.2px coverage for native rasterizing.
  set(n,'e',1.2);rules++;
 }
}
assert.equal(dates,95);assert.equal(rules,300);
const removed=w['36'].find(v=>v['1']==='calendar_today_glyph');assert(removed);
w['36']=w['36'].filter(v=>v!==removed);
assert(!JSON.stringify(w['1']).includes('${widgy.calendar_today_glyph}'));
const restored=structuredClone(w);
function restore(ns){return ns.map(n=>{
 if(n.s==='Calendar · Today Live Date'||/^Calendar · Week Separator [1-5]$/.test(n.s??''))return structuredClone(source.get(n.d0));
 if(n.z==='13')n['1']=restore(n['1']);return n;
});}
restored['1']=restore(restored['1']);restored['36']=base['36'];assert.deepEqual(restored,base);
for(const group of nodes.filter(n=>/^Calendar · Today Cell /.test(n.s??''))){
 const date=group['1'].find(n=>n.s==='Calendar · Today Live Date'),disc=group['1'].find(n=>n.s==='Calendar · Today Disc');
 assert(Math.abs(px(date,'c')+.802*px(date,'e')-(px(disc,'c')+45))<.000002);
}
w['3']='Widgy Home Glass Calendar C14';
w['4']='C14 responds to IMG_9705: city spelling is visibly restored in C13 (resolver/fallback source cannot be distinguished from screenshot). Replace soft raster date images with native Phenomena Bold at the approved badge-relative baseline; keep the raised C13 badge. Increase native week rules from 0.7 to 1.2px because lower rules vanished on-device. Remove unused day-image variable. All location bindings, event icons, other tabs and navigation are byte-equivalent to C13. Native rendering still needs phone review.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C14.json',import.meta.url),JSON.stringify(w));
let page=readFileSync(new URL('./widgy-home-calendar-c13.html',import.meta.url),'utf8').replace(/<p><b>עדכון מהבדיקה באייפון:<\/b>.*?<\/p>\n?/,'').replaceAll('C13','C14').replaceAll('c13','c14');
page=page.replace(/<p>Calendar C14:.*?<\/p>/,'<p>Calendar C14: ספרת היום חזרה לטקסט חד בגופן המאושר, תוך שמירת המיקום המחושב. קווי השבוע עוצבו בעובי מעט גדול יותר כדי שלא ייעלמו בתצוגה.</p>');
page=page.replace('בדוק את שם העיר מול המפה, הספרה בעיגול, מיקום העברית ופסי הצבע.','בדוק את חדות הספרה בעיגול ואת ארבעת הקווים המפרידים בין שבועות החודש.');
writeFileSync(new URL('./widgy-home-calendar-c14.html',import.meta.url),page);
const prev=new URL('./widgy-home-calendar-c13.html',import.meta.url),notice='<p><b>עדכון מהבדיקה באייפון:</b> העיר חזרה, אך ספרת התאריך בתמונה נראית רכה ושני קווי שבוע נעלמו. <a href="./widgy-home-calendar-c14.html">C14 מתקנת את התצוגה הזו</a>.</p>';
let old=readFileSync(prev,'utf8');if(!old.includes(notice))writeFileSync(prev,old.replace('  <button id="copy"',notice+'\n  <button id="copy"'));
const stats={deviceScreenshot:'IMG_9705.jpeg',cityLabelObserved:'Ashkelon, Israel',selectedDatesChanged:dates,weekRulesChanged:rules,weekRuleHeightPx:1.2,dayImageRequestsRemoved:true,locationBindingsPreserved:true,otherDataAndActionsPreserved:true,requiresDeviceVerification:true};
writeFileSync(new URL('../assets/calendar-glass/Calendar_C14_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify(stats));
