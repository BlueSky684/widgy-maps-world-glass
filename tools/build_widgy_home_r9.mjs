import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const r8 = JSON.parse(read('./Widgy_Home_Glass_JS_City_R8.json'));
const widget = structuredClone(r8);
const clockOf = value => value['1'].find(n => n.d0 === 245)['1'].find(n => n.d0 === 6110);
const clock = clockOf(widget);
assert.equal(clock['1'], 'BarlowCondensed-Light');
assert.deepEqual(clock['66'], [{'5':'Date And Time','6':'Live Timer (24 hours, No Seconds)'}]);
clock['1'] = 'HomeGlassClock-Light';
const restored = structuredClone(widget);
clockOf(restored)['1'] = 'BarlowCondensed-Light';
assert.deepEqual(restored, r8, 'Only the Hero Time font may change');

widget['3'] = 'Widgy Home Glass JS City R9';
widget['4'] = 'R9 iPhone trial: live HH:mm clock uses Home Glass Clock Light, a Barlow Condensed Light 1.422 derivative with only the colon raised 126 font units. Install the supplied custom font before importing. Custom font selection and live updating require iPhone verification. All other R8 layers, atlas, date styling and dynamic 10,000-step ring retained. Calendar content remains demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R9.json', import.meta.url), JSON.stringify(widget));

const fontValidation = JSON.parse(read('../assets/fonts/home-glass-clock/validation.json'));
assert.equal(fontValidation.postscript_name, clock['1']);
assert.equal(fontValidation.all_1440_time_widths_unchanged, true);
assert.equal(fontValidation.zero_outline_unchanged, true);
assert.deepEqual(fontValidation.changed_glyphs, ['colon']);

let page = read('./widgy-home-js-city-r8.html')
  .replaceAll('JS City R8', 'JS City R9')
  .replaceAll('JS_City_R8', 'JS_City_R9');
const main = `<h1>Widgy Home · JS City R9</h1>
  <p>גרסת בדיקה לשעון עם נקודתיים ממורכזות. הגופן מבוסס על Barlow Condensed Light 1.422; רק הנקודתיים הורמו ביחס לגרסה הזאת.</p>
  <p><b>1. התקנת הגופן</b><br>הורד את הקובץ, ייבא אותו באמצעות אפשרות ייבוא הגופנים ב־Widgy והשלם את ההתקנה שהאפליקציה מציגה.</p>
  <p><a class="font-download" href="../assets/fonts/home-glass-clock/HomeGlassClock-Light.otf" download="HomeGlassClock-Light.otf">הורדת הגופן המתוקן</a></p>
  <p>שם הגופן לבחירה: <b dir="ltr">Home Glass Clock Light</b>.</p>
  <p><b>2. ייבוא גרסת הבדיקה</b><br>ייבא כעותק נוסף בשם <b>Widgy Home Glass JS City R9</b>. אם הגופן אינו נבחר אוטומטית, בחר אותו בשכבת <b dir="ltr">Hero Time</b>.</p>
  <p><b>3. בדיקה באייפון</b><br>צא מהעורך, רענן פעם אחת ובדוק שהנקודתיים ממורכזות ושהדקה מתחלפת. שלח צילום מלא של התוצאה.</p>
  <p>השינוי דורש בדיקה באייפון. מקור השעון נשאר השעון החי ללא שניות, ויעד טבעת הצעדים נשאר 10,000.</p>
  `;
page = page.replace(/<h1>[\s\S]*?(?=<button id="copy")/, main);
page = page.replace('יעד הטבעת הוא 10,000 צעדים ביום. ביעד ומעליו היא מלאה. משתמש בגופנים שעובדים ב־R5. פרטי היומן הם נתוני דוגמה.',
  'המפה, התאריך ושאר העיצוב נשמרו מ־R8. פרטי היומן הם נתוני דוגמה. הגופן המותאם מופץ תחת SIL OFL 1.1.');
page = page.replace('</main>', '<p><a href="../assets/fonts/home-glass-clock/OFL.txt">רישיון הגופן</a></p>\n</main>');
assert(page.includes('Widgy_Home_Glass_JS_City_R9.json'));
assert(page.includes('HomeGlassClock-Light.otf'));
writeFileSync(new URL('./widgy-home-js-city-r9.html', import.meta.url), page);
console.log('R9 candidate verified: only Hero Time font changed; live timer and every other R8 layer unchanged.');
