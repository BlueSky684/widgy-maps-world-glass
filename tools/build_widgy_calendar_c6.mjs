import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

const base = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C5.json', import.meta.url), 'utf8'));
const w = structuredClone(base);
const map = w['36'].find(n => n['1'] === 'map_request');
assert(map);
const endpoint = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6';
map['3']['66'] = [{'5': 'Javascript', '6': 'Async + No main()', '10': buildCityMapScript(endpoint, {enabled: true, reuseSeconds: 60})}];
w['3'] = 'Widgy Home Glass Calendar C6';
w['4'] = 'Calendar C6 performance comparison: stable map URL per minute, short private map reuse at identical precise GPS/city, bounded warm-server PNG cache. Preserves C5 native navigation, appearance, fonts and 10,000-step goal. City lookup still runs on device; native reload delay needs device measurement. Original copy button retained.';
assert.deepEqual(w['1'], base['1']);
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C6.json', import.meta.url), JSON.stringify(w));

let html = readFileSync(new URL('./widgy-home-calendar-c5.html', import.meta.url), 'utf8').replaceAll('C5', 'C6');
html = html.replace('Calendar C6: תיקון החזרה ל־Home בזמן מעבר בין חודשים, ואיחוד חישובי החודשים להפחתת העומס.', 'Calendar C6: גרסה להשוואת מהירות התגובה, עם שימוש חוזר קצר במפה באותה דקה ובאותו מיקום.');
html = html.replace('בדוק מעבר לחודש הבא ולקודם, חזרה דרך כותרת החודש, ואת זמן התגובה.', 'לאחר הטעינה הראשונה, בדוק כמה מעברים בין חודשים והשווה את ההמתנה ל־C5.');
html = html.replace('Home R12 נשמר במדויק', 'עיצוב Home R12 נשמר');
html = html.replace('נתוני האירועים בלשונית Calendar נלקחים מהמכשיר בעת הרענון.', 'נתוני האירועים בלשונית Calendar נלקחים מהמכשיר בעת הרענון. תמונת המפה עשויה להישאר זהה עד דקה; השעון והצעדים ממשיכים להתעדכן בנפרד.');
writeFileSync(new URL('./widgy-home-calendar-c6.html', import.meta.url), html);
console.log(JSON.stringify({name: w['3'], nativeLayersUnchanged: true, mapReuseSeconds: 60}));
