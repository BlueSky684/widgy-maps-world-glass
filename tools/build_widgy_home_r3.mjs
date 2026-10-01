import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {replaceStepsRing} from './widgy-step-ring.mjs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const original = JSON.parse(read('./Widgy_Home_Glass_JS_City_R2.json'));
const widget = replaceStepsRing(structuredClone(original));
let changed = 0;
function visit(layer) {
  if (layer.s === 'FITNESS Nav Icon') {
    assert.equal(layer.z, '4');
    assert.equal(layer['3'], 'figure.walk');
    layer['3'] = 'figure.run';
    changed++;
  }
  if (layer.z === '13') layer['1'].forEach(visit);
}
widget['1'].forEach(visit);
assert.equal(changed, 4, 'One consistent FITNESS navigation icon per tab');
assert.deepEqual(widget['36'], original['36']);
widget['3'] = 'Widgy Home Glass JS City R3';
widget['4'] = 'R3: running person for FITNESS navigation; continuous round-ended steps ring built from short overlapping convex segments to keep the center hollow. Based on R2 verified outside the editor in IMG_9651. Map, JS city lookup, coordinate formatting, layout, goal and data sources remain exact. Calendar content remains demo data. Ring rendering awaits phone verification.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R3.json', import.meta.url), JSON.stringify(widget));

const page = read('./widgy-home-js-city-r2.html')
  .replaceAll('JS City R2', 'JS City R3')
  .replaceAll('Widgy_Home_Glass_JS_City_R2.json', 'Widgy_Home_Glass_JS_City_R3.json')
  .replace('הווידג׳ט המלא עם בקשת זיהוי העיר הישירה שעבדה בבדיקה שלך, וסדר מקורות מעודכן.',
    'אייקון FITNESS עודכן לדמות רצה. טבעת הצעדים עודכנה לקשת רציפה עם קצוות מעוגלים ומרכז כהה, בהתאם לרפרנס המאושר.')
  .replace('זיהוי העיר ובדיקות התמונות הצליחו בנפרד באייפון. החיבור בווידג׳ט המלא עדיין דורש אימות. פרטי היומן הם נתוני דוגמה.',
    'יעד הטבעת הוא 10,000 צעדים ביום. ביעד ומעליו היא מלאה. מבוסס על R2 שהציגה את המפה ושם העיר מחוץ לעורך. פרטי היומן הם נתוני דוגמה.');
writeFileSync(new URL('./widgy-home-js-city-r3.html', import.meta.url), page);
console.log(`Built R3: ${changed} FITNESS navigation glyphs changed to figure.run; 100 short ring segments replace long cumulative contours.`);
