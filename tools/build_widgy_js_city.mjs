import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const original = read('./Widgy_Home_Glass.json');
const widget = structuredClone(original);
const native = read('./widgy-native-max5-source.json');
const fetchCheck = read('./Widgy_Fetch_Image_Check.json');
const origin = new URL(process.argv[2]);
assert(origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash);

// User approved current precise coordinates going from the phone to
// BigDataCloud on 2026-10-01. Keep the original dashboard as a recovery copy.
const lookupEnabled = true;
// Native coordinate inputs precede their consumer. R1 appended them after it.
// Keep the fetched-URL variable last, following the successful probe structure.
const requestIndex = widget['36'].findIndex(v => v['1'] === 'map_request');
assert(requestIndex >= 0);
const [request] = widget['36'].splice(requestIndex, 1);
for (const [index, name, field] of [
  [1, 'map_latitude_max5', 'Latitude (Decimal)'],
  [2, 'map_longitude_max5', 'Longitude (Decimal)'],
]) {
  const template = original['36'].find(v => v['1'] === (index === 1 ? 'Latitude' : 'Longitude'));
  assert(template);
  const variable = structuredClone(template);
  variable['0'] = `C5D5F231-73AF-48A7-B002-${String(index).padStart(12, '0')}`;
  variable['1'] = name;
  variable['2'] = 0;
  variable['3'].s = 'Variable: ' + name;
  variable['3']['66'] = [{'5': 'Location', '6': field}];
  variable['3'][native.propertyKey] = structuredClone(native.max5);
  widget['36'].push(variable);
}
// Copy the exact non-formatting Text body of the successful async URL control.
request['3'] = structuredClone(fetchCheck['36'].find(v => v['1'] === 'async_fetch_url')['3']);
request['3'].s = 'Variable: map_request';
request['3']['66'] = [{'5': 'Javascript', '6': 'Async + No main()',
  '10': buildCityMapScript(origin.origin + '/api/night-map?mode=live&width=3306&presentation=glass', {enabled: lookupEnabled})}];
widget['36'].push(request);
widget['3'] = 'Widgy Home Glass JS City R2';
widget['4'] = 'JS City R2: direct client fetch, coordinate variables before URL consumer, and the Text variable body from the successful IMG_9650 control. That phone result confirms BigDataCloud HTTP 200, coordinate-based city and matching GPS outside the editor; all four image controls passed. R2 complete dashboard integration still requires device verification. Precise coordinates are shared with user permission. Approved F50 assets, layout and one-decimal map labels unchanged. Calendar remains demo data.';
assert.deepEqual(widget['1'], original['1']);
assert.deepEqual(widget['2'], original['2']);
assert.equal(widget['36'].length, original['36'].length + 2);
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R2.json', import.meta.url), JSON.stringify(widget));

// Preserve R1 and its withdrawn importer for a clear comparison/recovery path.
let page = readFileSync(new URL('./widgy-home-glass.html', import.meta.url), 'utf8');
page = page.replaceAll('Widgy Home · Glass', 'Widgy Home · JS City R2')
  .replace(' — Recovery', '')
  .replace(/<p>העיצוב[\s\S]*?<button/,
    '<p>הווידג׳ט המלא עם בקשת זיהוי העיר הישירה שעבדה בבדיקה שלך, וסדר מקורות מעודכן.</p>\n' +
    '<p>ייבא כעותק נוסף בשם <b>Widgy Home Glass JS City R2</b>, צא מהעורך, רענן פעם אחת ושלח צילום מלא.</p>\n' +
    '<p>המפה נשארת באיכות המקורית והקואורדינטות המוצגות נשארות קצרות. זיהוי העיר משתמש במיקום הנוכחי שנשלח ישירות מהאייפון ל־BigDataCloud, בהתאם לאישורך.</p>\n  <button')
  .replaceAll('Widgy_Home_Glass.json', 'Widgy_Home_Glass_JS_City_R2.json')
  .replace("widget['3']!=='Widgy Home Glass'", "widget['3']!=='Widgy Home Glass JS City R2'")
  .replace(/<small>יעד הטבעת[\s\S]*?<\/small>/,
    '<small>זיהוי העיר ובדיקות התמונות הצליחו בנפרד באייפון. החיבור בווידג׳ט המלא עדיין דורש אימות. פרטי היומן הם נתוני דוגמה.</small>');
writeFileSync(new URL('./widgy-home-js-city-r2.html', import.meta.url), page);
console.log('Built R2: direct fetch, native coordinates before URL consumer, proven async variable body; R1 and recovery preserved.');
