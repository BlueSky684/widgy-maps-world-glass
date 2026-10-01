import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const original = read('./Widgy_Home_Glass.json');
const widget = structuredClone(original);
const native = read('./widgy-native-max5-source.json');
const origin = new URL(process.argv[2]);
assert(origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash);

// User approved current precise coordinates going from the phone to
// BigDataCloud on 2026-10-01. Keep the original dashboard as a recovery copy.
const lookupEnabled = true;
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
const request = widget['36'].find(v => v['1'] === 'map_request');
assert(request);
request['3']['66'] = [{'5': 'Javascript', '6': 'Async + No main()',
  '10': buildCityMapScript(origin.origin + '/api/night-map?mode=live&width=3306&presentation=glass', {enabled: lookupEnabled})}];
widget['3'] = 'Widgy Home Glass JS City';
widget['4'] = 'BigDataCloud city lookup ENABLED with user permission on 2026-10-01. Current native Max 5 coordinates are sent directly from the phone to the provider; the returned city and GPS coordinates go to the existing map renderer. No native City JS dependency. Max 5 input verified outside the editor in IMG_9648; complete network and async map URL flow still needs phone verification. Failed or invalid city responses use the map with short coordinates. Approved F50 assets, layout and one-decimal map labels unchanged. Calendar remains demo data.';
assert.deepEqual(widget['1'], original['1']);
assert.deepEqual(widget['2'], original['2']);
assert.equal(widget['36'].length, original['36'].length + 2);
writeFileSync(new URL('./Widgy_Home_Glass_JS_City.json', import.meta.url), JSON.stringify(widget));

let page = readFileSync(new URL('./widgy-home-glass.html', import.meta.url), 'utf8');
page = page.replaceAll('Widgy Home · Glass', 'Widgy Home · JS City')
  .replace(' — Recovery', '')
  .replace('העיצוב לפי הרפרנס המאושר: מסגרת זכוכית, כרטיסים מעוגלים וטבעת צעדים דינמית. המפה המאושרת נשארה ב־50%.',
    'זיהוי העיר דרך JavaScript לפי המיקום הנוכחי. הקואורדינטות שעל המפה מוצגות עם ספרה אחת אחרי הנקודה.')
  .replace('החזרת טעינת המפה למנגנון של Glass 3, שבו המפה הופיעה במכשיר. גרסה 4 הוסרה בעקבות כשל בטעינה. שם העיר עדיין בבדיקה; זו גרסת שחזור, ללא שורות אבחון.',
    'ייבא כעותק נוסף, צא מהעורך ורענן פעם אחת. שלח צילום מלא של הווידג׳ט מחוץ לעורך כדי לוודא שהעיר והמפה נטענות יחד.')
  .replace('פס ההתקדמות עוקב אחר שעות האור במיקום הנוכחי, לפי השעון המקומי ושעון קיץ או חורף.',
    'זיהוי העיר פעיל: הווידג׳ט שולח את המיקום המדויק מהאייפון ל־BigDataCloud. שם העיר והקואורדינטות מועברים לשרת המפה הקיים.')
  .replaceAll('Widgy_Home_Glass.json', 'Widgy_Home_Glass_JS_City.json')
  .replace("widget['3']!=='Widgy Home Glass'", "widget['3']!=='Widgy Home Glass JS City'")
  .replace('יעד הטבעת הוא 10,000 צעדים. אפשר לשנות אותו ב־Variables ← steps_goal. פרטי היומן עדיין נתוני דוגמה.',
    'בדיקות הקוד המקומיות עברו; הפעולה המלאה באייפון עדיין דורשת אימות. פרטי היומן נשארו נתוני דוגמה.');
writeFileSync(new URL('./widgy-home-js-city.html', import.meta.url), page);
console.log('Built JS City widget and importer; external lookup ON with permission; original dashboard and all visual layers unchanged.');
