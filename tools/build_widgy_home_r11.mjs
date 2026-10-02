import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const baseline = JSON.parse(read('./Widgy_Home_Glass_JS_City_R10.json'));
const widget = structuredClone(baseline);
const clockOf = value => value['1'].find(layer => layer.d0 === 245)['1'].find(layer => layer.d0 === 6110);
const clock = clockOf(widget);
const before = clockOf(baseline);
const value = key => before[key].a[0].a;
const round = value => Math.round(value * 1e6) / 1e6;
const scale = 1.08;
assert.equal(clock['1'], 'HomeGlassTime-Light');
assert.deepEqual(clock['66'], [{'5':'Date And Time', '6':'Live Timer (24 hours, No Seconds)'}]);
for (const key of ['b', 'c', 'd', 'e']) assert.equal(before[key].a.length, 1);

// Enlarge the text frame uniformly, anchored at its existing bottom-left.
// Widgy derives the live-clock font size from the text frame height.
clock.d.a[0].a = round(value('d') * scale);
clock.e.a[0].a = round(value('e') * scale);
clock.c.a[0].a = round(value('c') + value('e') - clock.e.a[0].a);
assert.equal(clock.b.a[0].a, value('b'));
assert(Math.abs(clock.c.a[0].a + clock.e.a[0].a - value('c') - value('e')) < 1e-6);

const restored = structuredClone(widget);
for (const key of ['c', 'd', 'e']) clockOf(restored)[key] = structuredClone(before[key]);
assert.deepEqual(restored, baseline, 'Only the Hero Time frame may change');
widget['3'] = 'Widgy Home Glass JS City R11';
widget['4'] = 'R11: user-approved 8% enlargement of the live clock frame, anchored at its existing bottom-left so it grows upward and rightward. Uses the installed Home Glass Time Light font with approved colon position. Every other R10 layer, including header labels, atlas, and dynamic 10,000-step ring, is unchanged. Calendar content is still demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R11.json', import.meta.url), JSON.stringify(widget));

let page = read('./widgy-home-js-city-r10.html')
  .replaceAll('JS City R10', 'JS City R11').replaceAll('JS_City_R10', 'JS_City_R11');
page = page.replace(/<h1>[\s\S]*?(?=<button id="copy")/, `<h1>Widgy Home · JS City R11</h1>
  <p>השעון הוגדל ב־8% כלפי מעלה וימינה, עם עיגון לפינה השמאלית התחתונה של שכבת השעון.</p>
  <p>הגופן הוא <b dir="ltr">Home Glass Time Light</b>, שכבר התקנת. אין צורך בהתקנת גופן נוספת.</p>
  <p>ייבא כעותק נוסף בשם <b>Widgy Home Glass JS City R11</b>, צא מהעורך ורענן פעם אחת.</p>
  `);
assert(page.includes("widget['3']!=='Widgy Home Glass JS City R11'"));
writeFileSync(new URL('./widgy-home-js-city-r11.html', import.meta.url), page);
console.log(JSON.stringify({
  status:'R11 built and verified', scale,
  before:{x:value('b'),y:value('c'),width:value('d'),height:value('e')},
  after:{x:clock.b.a[0].a,y:clock.c.a[0].a,width:clock.d.a[0].a,height:clock.e.a[0].a},
  onlyClockGeometryChanged:true
}, null, 2));
