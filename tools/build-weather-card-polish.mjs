// Rebuild the owner's encrypted full-widget import without publishing its JSON.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const source=process.argv[2];if(!source)throw Error('Pass the private revision-14 widget JSON');
const input=JSON.parse(fs.readFileSync(source));
let panels=0;
function upgrade(v){
  if(typeof v==='string'){
    if(v.includes('/api/weather-panel?')&&v.includes('&v=14')){panels++;v=v.replaceAll('&v=14','&v=15');}
    return v;
  }
  if(Array.isArray(v))return v.map(upgrade);
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,upgrade(x)]));
  return v;
}
const output=structuredClone(input),weatherIndex=output['1'].findIndex(n=>n.d0===246);
assert(weatherIndex>=0,'Weather group missing');
output['1'][weatherIndex]=upgrade(output['1'][weatherIndex]);
assert.equal(panels,1,'Expected one Weather PNG URL reference');
output['3']='Widgy Weather 15';
output['4']='Weather 15: main cloud reduced by 10% around its approved center; five UV risk categories filled cumulatively through the current level, with higher levels gray; wind speed without the extra direction row. Next local sunrise/sunset and existing tabs preserved.';
// Account-specific sources and unrelated tabs must remain identical.
for(const n of input['1'])if(n.d0!==246)assert(isDeepStrictEqual(output['1'].find(x=>x.d0===n.d0),n),'Unrelated group changed');
assert(isDeepStrictEqual(output['36'],input['36']),'Variables changed');
const raw=Buffer.from(JSON.stringify(output));
fs.writeFileSync('work/private/Widgy_Health_Premium_1.json',raw,{mode:0o600});
const key=Buffer.from(JSON.parse(fs.readFileSync('work/private/copy-key.json')).key,'base64url'),iv=randomBytes(12);
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('widgy-health-premium-copy:v1:20261010'));
const data=Buffer.concat([cipher.update(gzipSync(raw,{level:9})),cipher.final(),cipher.getAuthTag()]);
const hash=createHash('sha256').update(raw).digest('hex');
fs.writeFileSync('tools/widgy-health-premium-1.enc.json',JSON.stringify({v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:hash})+'\n');
let html=fs.readFileSync('tools/widgy-health-premium-copy.html','utf8');
html=html.replace(/<title>.*?<\/title>/,'<title>Widgy — Weather 15</title>')
  .replace(/widgy-health-premium-copy\.js\?v=[^"']+/,'widgy-health-premium-copy.js?v=15')
  .replace(/<h1>[\s\S]*?<section class="card">/,'<h1>Weather 15 — ליטוש התצוגה</h1><p>הענן הראשי הוקטן ב־10% סביב אותו מרכז. פס הקרינה מציג חמישה מקטעים צבעוניים, אחד לכל רמת UV: המקטעים עד לרמה הנוכחית מוארים במלואם, והרמות הגבוהות יותר אפורות. שורת כיוון הרוח הוסרה.</p><p>משבצת השמש ממשיכה להציג את האירוע הבא: Sunset ביום ו־Sunrise בלילה, כולל הזריחה של מחר אחרי השקיעה. המעבר מופיע ברענון הבא של Widgy.</p><p>זהו הווידג׳ט המלא. Home, Calendar, Health ומנגנון המיקום המשותף נשמרו.</p><section class="card">')
  .replace(/<ol>[\s\S]*?<\/ol>/,'<ol><li>לחץ על <b>Copy Full JSON</b>.</li><li>יבא כעותק נפרד דרך <b dir="ltr">Import → Import URL Or JSON</b>. שם העותק: <b dir="ltr">Widgy Weather 15</b>.</li><li>פתח את Weather ובדוק את גודל הענן ופס הקרינה החדש. שמור את העותק הקודם כגיבוי.</li></ol>')
  .replace(/[\d,]+ bytes/,raw.length.toLocaleString('en-US')+' bytes');
assert(!html.includes(key.toString('base64url')));
fs.writeFileSync('tools/widgy-health-premium-copy.html',html);
console.log(JSON.stringify({bytes:raw.length,sha256:hash,weatherRevision:15,panels,unrelatedGroupsPreserved:true}));
