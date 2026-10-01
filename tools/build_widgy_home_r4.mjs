import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {REFERENCE, STEPS_RING, chromeSVG} from './home_glass_design.mjs';
import {replaceStepsRing} from './widgy-step-ring.mjs';

// Optical corrections measured against IMG_9657 and the approved reference,
// normalized to the same card bounds (wallpaper excluded).
export const R4_RING = {...STEPS_RING, stroke:13, radius:64.5};
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const before = JSON.parse(read('./Widgy_Home_Glass_JS_City_R3.json'));
const widget = replaceStepsRing(structuredClone(before), R4_RING);
const home = widget['1'].find(n => n.d0 === 245);
const get = id => { const n = home['1'].find(n => n.d0 === id); assert(n); return n; };
const round = n => Math.round(n*1e6)/1e6;
function frame(n, [x,y,w,h]) {
  for (const [k,v] of Object.entries({b:x/REFERENCE.width*1600,c:y/REFERENCE.height*1600,d:w/REFERENCE.width*1600,e:h/REFERENCE.height*1600})) n[k].a[0].a=round(v);
  return n;
}
function font(id, name, box) { const n=get(id); n['1']=name; if(box)frame(n,box); return n; }

// The original day was implicitly left-aligned. Native text property 2=1
// centers any one/two-digit date in the same column. DIN Condensed Bold is
// an existing native iOS family, with a heavier stem than Phenomena Bold.
const day = font(6105, 'DINCondensed-Bold', [1003,23,100,126]);
day['2']={a:[{a:1,b:168}],b:0};

// Keep the label's measured ink position; bring the percent's cap height and
// baseline into alignment. A 68 px value frame reserves space for 100%.
for(const id of [6123,80205]) frame(get(id),[626,718,68,40]);

// Secondary typography: same family, smaller physical cap heights and more
// balanced breathing room around the card dividers.
frame(get(6141),[774,854,160,93]);
frame(get(6142),[774,934,160,56]);
frame(get(6132),[223,932,133,59]);
frame(get(6133),[451,864,93,53]);
frame(get(6134),[451,930,93,53]);
frame(get(6143),[974,864,132,54]);
frame(get(6144),[974,930,132,54]);
frame(get(6193),[647,883,54,74]);
// A regular weight survives small widget rendering more like the reference.
for(const id of [6122,6132,6142,6143,6144])font(id,'BarlowCondensed-Regular');

// Navigation retains each tab's selected color and native tap actions.
// Only HOME has the glass coordinate layout; the other three tabs keep theirs.
const homeNav={
  'HOME Nav Icon':[69,1083,52,52],
  'CALENDAR Nav Icon':[328,1085,46,50],
  'WEATHER Nav Icon':[604,1083,65,50],
  'FITNESS Nav Icon':[903,1083,48,54],
};
for (const tab of widget['1']) {
  for(const n of tab['1']) {
    if(n.s?.endsWith('Nav Label'))n['1']='BarlowCondensed-Regular';
    if(tab.d0===245 && homeNav[n.s])frame(n,homeNav[n.s]);
  }
}

// Add the calendar's two rounded binding tabs using native convex shapes.
// No raster icon replacement and no change to its tap target.
const template=home['1'].find(n=>n.s==='Steps Goal Ring · 1%');
const calendar=get(5015);
function capsulePoints() {
  const p=[];
  for(const [cx,cy,start] of [[.5,.25,-180],[.5,.75,0]])
    for(let j=0;j<=12;j++){const a=(start+j*180/12)*Math.PI/180;p.push({x:round(cx+.5*Math.cos(a)),y:round(cy+.25*Math.sin(a))});}
  return p;
}
for(const x of [337,359]) {
  const n=structuredClone(template);n.d0=widget.a2++;n.s='CALENDAR Nav Binding';delete n.o1;
  n.g=calendar.f;
  const id=`0C70EACC-0004-4000-A000-${String(n.d0).padStart(12,'0')}`;
  n['3']=id;n['2']=Buffer.from(JSON.stringify({items:[{id,name:n.s,shape:{rounding:0,points:capsulePoints()}}]})).toString('base64');
  frame(n,[x,1081,6,12]);
  home['1'].splice(home['1'].indexOf(calendar),0,n);
}

// Version the track artwork so R3 and existing imports keep their original
// appearance. The R4 track and its live foreground share exactly one geometry.
const svg=chromeSVG({stepsRing:R4_RING});
writeFileSync(new URL('../assets/home-glass/Home_Glass_Chrome_R4.svg',import.meta.url),svg);
await sharp(Buffer.from(svg)).resize(3306,Math.round(3306*REFERENCE.height/REFERENCE.width)).withIccProfile('srgb').png({compressionLevel:9}).toFile(new URL('../assets/home-glass/Home_Glass_Chrome_R4.png',import.meta.url).pathname);
const chrome=get(80309);
for(const k of ['2','22'])chrome[k]=chrome[k].replace('Home_Glass_Chrome.png?v=1','Home_Glass_Chrome_R4.png?v=4');

widget['3']='Widgy Home Glass JS City R4';
widget['4']='R4 visual polish against approved reference: 13px hollow live ring, 10,000 daily step goal; centered DIN Condensed Bold day; smaller aligned daylight percentage; reduced secondary metric typography; regular navigation labels and calendar binding tabs. R3 live sources, map masters, weather geometry, city lookup and tap actions preserved. Calendar content remains demo data. Native font rendering requires phone verification.';
assert.deepEqual(widget['36'],before['36']);
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R4.json',import.meta.url),JSON.stringify(widget));
const page=read('./widgy-home-js-city-r3.html')
  .replaceAll('JS City R3','JS City R4').replaceAll('JS_City_R3','JS_City_R4')
  .replace('אייקון FITNESS עודכן לדמות רצה. טבעת הצעדים עודכנה לקשת רציפה עם קצוות מעוגלים ומרכז כהה, בהתאם לרפרנס המאושר.','טבעת צעדים דקה יותר, מספר יום מודגש וממורכז, אחוז התקדמות קטן ומיושר, ואיזון הגופנים והסמלים לפי הרפרנס המאושר.')
  .replace('מבוסס על R2 שהציגה את המפה ושם העיר מחוץ לעורך.','מבוסס על R3. המראה המדויק של הגופנים דורש בדיקה באייפון.');
writeFileSync(new URL('./widgy-home-js-city-r4.html',import.meta.url),page);
console.log('Built R4: 13px ring, centered bold date, compact metrics and aligned navigation. Existing live sources preserved.');
