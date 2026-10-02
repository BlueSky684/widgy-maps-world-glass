import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

// Approved preview V2 uses a +112-unit colon shift in Home Glass Time.
const source = new URL('./Widgy_Home_Glass_JS_City_R8.json', import.meta.url);
const baseline = JSON.parse(readFileSync(source, 'utf8'));
const widget = structuredClone(baseline);
const home = value => value['1'].find(layer => layer.d0 === 245)['1'];
const byId = (value, id) => home(value).find(layer => layer.d0 === id);
const shift = 24; // 17 px in the user's 1135-pixel screenshot.
for (const id of [6103, 6104]) {
  const layer = byId(widget, id);
  assert.equal(layer.b.a.length, 1);
  assert.equal(layer.b.a[0].a, 1115);
  assert.equal(layer['2'].a[0].a, 1); // Both labels remain centered together.
  layer.b.a[0].a += shift;
}
assert.equal(byId(widget, 6110)['1'], 'BarlowCondensed-Light');
byId(widget, 6110)['1'] = 'HomeGlassTime-Light';

const restored = structuredClone(widget);
for (const id of [6103, 6104]) byId(restored, id).b.a[0].a -= shift;
byId(restored, 6110)['1'] = 'BarlowCondensed-Light';
assert.deepEqual(restored, baseline, 'Only weekday/month position and approved clock font change');
assert.deepEqual(byId(widget, 6110)['66'], [
  {'5':'Date And Time', '6':'Live Timer (24 hours, No Seconds)'}
]);

const validation = JSON.parse(readFileSync(new URL('../assets/fonts/home-glass-clock/validation-v2.json', import.meta.url), 'utf8'));
assert.equal(validation.vertical_shift_font_units, 112);
assert.equal(validation.postscript_name, byId(widget, 6110)['1']);
assert.equal(validation.all_1440_time_widths_unchanged, true);
assert.equal(validation.zero_outline_unchanged, true);
widget['3'] = 'Widgy Home Glass JS City R10';
widget['4'] = 'R10: user-approved colon position from preview V2, using Home Glass Time Light derived from Barlow Condensed Light 1.422 with only the colon raised 112 font units. Native live HH:mm retained. Weekday and month moved 24 canvas units right as one centered pair. All other R8 layers including the atlas and dynamic 10,000-step ring are unchanged. Calendar content is still demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R10.json', import.meta.url), JSON.stringify(widget));

let page = readFileSync(new URL('./widgy-home-js-city-r8.html', import.meta.url), 'utf8')
  .replaceAll('JS City R8', 'JS City R10').replaceAll('JS_City_R8', 'JS_City_R10');
page = page.replace(/<h1>[\s\S]*?(?=<button id="copy")/, `<h1>Widgy Home · JS City R10</h1>
  <p>השעון עם מיקום הנקודתיים שאישרת. היום והחודש הוזזו יחד מעט ימינה, קרוב יותר לקו החוצץ.</p>
  <p><b>1. התקנת הגופן</b><br><a href="../assets/fonts/home-glass-clock/HomeGlassTime-Light.otf" download="HomeGlassTime-Light.otf">הורדת Home Glass Time Light</a></p>
  <p>ייבא את הקובץ דרך אפשרות ייבוא הגופנים ב־Widgy והשלם את ההתקנה. בחר את הגופן בשם <b dir="ltr">Home Glass Time Light</b>.</p>
  <p><b>2. ייבוא הווידג׳ט</b><br>לאחר התקנת הגופן, העתק וייבא כעותק נוסף בשם <b>Widgy Home Glass JS City R10</b>.</p>
  <p>אם הגופן אינו נבחר אוטומטית, בחר אותו בשכבת <b dir="ltr">Hero Time</b>. צא מהעורך, רענן פעם אחת ובדוק את מיקום הנקודתיים ואת החלפת הדקה.</p>
  `);
page = page.replace('</main>', '<p><a href="../assets/fonts/home-glass-clock/OFL.txt">רישיון הגופן</a></p>\n</main>');
assert(page.includes('Widgy_Home_Glass_JS_City_R10.json'));
assert(page.includes('HomeGlassTime-Light.otf'));
writeFileSync(new URL('./widgy-home-js-city-r10.html', import.meta.url), page);
console.log('R10 verified: approved clock font and both labels +24 units right; all other layers exactly match R8.');
