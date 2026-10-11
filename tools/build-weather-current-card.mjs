// Rebuild the owner's encrypted full-widget import without publishing its JSON.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const source=process.argv[2];if(!source)throw Error('Pass the private revision-13 widget JSON');
const input=JSON.parse(fs.readFileSync(source));
let panels=0,chrome=0;
function upgrade(v){
  if(typeof v==='string'){
    if(v.includes('/api/weather-panel?')&&v.includes('&v=13')){panels++;v=v.replaceAll('&v=13','&v=14');}
    if(v.includes('/assets/weather-premium/chrome-r6.png')){chrome++;v=v.replaceAll('/assets/weather-premium/chrome-r6.png','/assets/weather-premium/chrome-r14.png');}
    return v;
  }
  if(Array.isArray(v))return v.map(upgrade);
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,upgrade(x)]));
  return v;
}
const output=structuredClone(input),weatherIndex=output['1'].findIndex(n=>n.d0===246);
assert(weatherIndex>=0,'Weather group missing');
output['1'][weatherIndex]=upgrade(output['1'][weatherIndex]);
assert.equal(panels,1,'Expected one Weather PNG URL reference');assert.equal(chrome,1,'Expected one Weather glass reference');
output['3']='Widgy Weather 14';
output['4']='Weather 14: centered current-condition icon and temperature by visible artwork bounds; four columns of metrics; daily rain probability and wind direction; Global Solar UV Index colors; next local sunrise or sunset with tomorrow and DST support. Existing Home, Calendar, Health and shared location behavior preserved.';
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
html=html.replace(/<title>.*?<\/title>/,'<title>Widgy — Weather 14</title>')
  .replace(/widgy-health-premium-copy\.js\?v=[^"']+/,'widgy-health-premium-copy.js?v=14')
  .replace(/<h1>[\s\S]*?<section class="card">/,'<h1>Weather 14 — העיצוב המעודכן</h1><p>הענן והטמפרטורה ממורכזים יחד, עם שוליים מאוזנים. הנתונים מסודרים בארבע עמודות: נוספו סיכוי לגשם היום וכיוון רוח, ופס הקרינה צבוע בהתאם לרמת UV.</p><p>משבצת השמש מציגה את האירוע הבא: Sunset ביום ו־Sunrise בלילה, כולל הזריחה של מחר אחרי השקיעה. הבחירה מבוססת על זמני התחזית ואזור הזמן המקומי. המעבר מופיע ברענון הבא של Widgy.</p><p>זהו הווידג׳ט המלא. Home, Calendar, Health ומנגנון המיקום המשותף נשמרו.</p><section class="card">')
  .replace(/<ol>[\s\S]*?<\/ol>/,'<ol><li>לחץ על <b>Copy Full JSON</b>.</li><li>יבא כעותק נפרד דרך <b dir="ltr">Import → Import URL Or JSON</b>. שם העותק: <b dir="ltr">Widgy Weather 14</b>.</li><li>פתח את Weather ובדוק את מרכוז הטמפרטורה, סידור הנתונים ופס הקרינה. שמור את העותק הקודם כגיבוי.</li></ol>')
  .replace(/[\d,]+ bytes/,raw.length.toLocaleString('en-US')+' bytes');
assert(!html.includes(key.toString('base64url')));
fs.writeFileSync('tools/widgy-health-premium-copy.html',html);
const manifestPath='tools/public-site-files.json',manifest=JSON.parse(fs.readFileSync(manifestPath));
for(const path of ['assets/weather-premium/chrome-r14.png'])if(!manifest.files.includes(path))manifest.files.push(path);
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({bytes:raw.length,sha256:hash,weatherRevision:14,panels,chrome,unrelatedGroupsPreserved:true}));
