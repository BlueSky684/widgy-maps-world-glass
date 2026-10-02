import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const baseline = JSON.parse(read('./Widgy_Home_Glass_JS_City_R11.json'));
const widget = structuredClone(baseline);
const homeOf = value => value['1'].find(layer => layer.d0 === 245)['1'];
const home = homeOf(widget);
const day = home.find(layer => layer.d0 === 6105);
const round = value => Math.round(value * 1e6) / 1e6;
const overlayOffsetPx = 1.5;
assert.equal(day['1'], 'Phenomena-Bold');
assert.deepEqual(day['66'], [{'5':'Date And Time', '6':'d'}]);
const changes = [];

// Retain the original typeface and gently reduce the added horizontal weight.
// Coordinates are normalized to a 1600-unit canvas (1135 px reference image).
for (const [id, direction] of [[80312, -1], [80313, 1]]) {
  const layer = home.find(layer => layer.d0 === id);
  assert.equal(layer.s, 'Header Day · Weight');
  assert.equal(layer['1'], day['1']);
  for (const key of ['c', 'd', 'e', '66']) assert.deepEqual(layer[key], day[key]);
  assert.equal(layer.b.a.length, 1);
  const before = layer.b.a[0].a;
  layer.b.a[0].a = round(day.b.a[0].a + direction * overlayOffsetPx / 1135 * 1600);
  changes.push({id, before, after:layer.b.a[0].a});
}

const restored = structuredClone(widget);
for (const {id} of changes) {
  homeOf(restored).find(layer => layer.d0 === id).b = structuredClone(homeOf(baseline).find(layer => layer.d0 === id).b);
}
assert.deepEqual(restored, baseline, 'Only the two date weight overlay offsets may change');
widget['3'] = 'Widgy Home Glass JS City R12';
widget['4'] = 'R12: gentler date numeral weight, reducing the added horizontal overlay offsets from ±2.75 to ±1.5 reference pixels. Retains Phenomena-Bold with the same date size, center, color, and native live source. Preserves the R11 enlarged Home Glass Time Light clock, approved colon, header alignment, atlas, and dynamic 10,000-step ring. Calendar content is still demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R12.json', import.meta.url), JSON.stringify(widget));

let page = read('./widgy-home-js-city-r11.html')
  .replaceAll('JS City R11', 'JS City R12').replaceAll('JS_City_R11', 'JS_City_R12');
page = page.replace(/<h1>[\s\S]*?(?=<button id="copy")/, `<h1>Widgy Home · JS City R12</h1>
  <p>ספרת התאריך מעודנת יותר, באותו גופן <b dir="ltr">Phenomena Bold</b>, באותו גודל ובאותו מיקום.</p>
  <p>השעון המוגדל והנקודותיים המאושרות נשמרו. אין צורך בהתקנת גופן נוספת.</p>
  <p>ייבא כעותק נוסף בשם <b>Widgy Home Glass JS City R12</b>, צא מהעורך ורענן פעם אחת.</p>
  `);
assert(page.includes("widget['3']!=='Widgy Home Glass JS City R12'"));
writeFileSync(new URL('./widgy-home-js-city-r12.html', import.meta.url), page);
console.log(JSON.stringify({status:'R12 built and verified', font:day['1'], overlayOffsetPx, changes, onlyDateOverlayOffsetsChanged:true}, null, 2));
