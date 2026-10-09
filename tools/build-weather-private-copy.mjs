// Run locally with the owner's private latest export. No plaintext/key enters Git.
import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {withWeatherPremium,PREVIEW} from './weather-premium-widget.js';
const [source,privateDirectory]=process.argv.slice(2);
if(!source||!privateDirectory)throw Error('Usage: node tools/build-weather-private-copy.mjs <baseline.json> <private-output-dir>');
const title='Widgy Weather Premium 8',prefix='widgy-weather-premium';
const widget=withWeatherPremium(JSON.parse(readFileSync(source))),raw=Buffer.from(JSON.stringify(widget));
const key=Buffer.from(JSON.parse(readFileSync(privateDirectory+'/weather-premium-copy-key.json')).key,'base64url'),iv=randomBytes(12),hash=createHash('sha256').update(raw).digest('hex');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(prefix+'-copy:v1:20261009'));
const data=Buffer.concat([cipher.update(gzipSync(raw,{level:9})),cipher.final(),cipher.getAuthTag()]);
const envelope=JSON.stringify({v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:hash})+'\n';
const js=readFileSync('tools/widgy-lean-clock-data-copy.js','utf8').replaceAll('widgy-lean-clock-data',prefix).replaceAll('Widgy Lean Clock and Data 1',title).replaceAll(prefix+'-1.enc.json',prefix+'-8.enc.json');
let html=readFileSync('tools/widgy-lean-clock-data-copy.html','utf8')
  .replaceAll('widgy-lean-clock-data',prefix).replaceAll('Widgy Lean Clock and Data 1',title)
  .replaceAll('Home ו־Calendar — חישובים קלים יותר','Weather — העיצוב המאושר')
  .replaceAll('Widgy_Lean_Clock_And_Data_1.json','Widgy_Weather_Premium_8.json')
  .replace('924,233 bytes',raw.length.toLocaleString('en-US')+' bytes')
  .replace(/<p>הווידג׳ט המלא[\s\S]*?<section class="card">/,'<p>גרסה 8: המרווח משני צדי האייקון והטמפרטורה בתחזית השעתית מאוזן לפי הגבולות הגלויים שלהם. תיאור מזג האוויר הוזז מעט ימינה ומתחיל בקו של הטמפרטורה. אייקוני התחזית השעתית והיומית מוגדלים וממורכזים, עם התאמת גובה האייקונים למרווח שבין השורות. הכיתוב הוא AQI בלבד. צורות האייקונים המאושרות נשמרו. תיקון הטעינה הראשונה של AQI נשמר, עם שימוש בערך שמור ורענון ברקע. התפריט המקורי ואייקוני התחזית המוגדלים נשמרו. Weather בעיצוב שאישרת, עם כל 11 האייקונים המאושרים: מזג אוויר נוכחי, תחזית ל־6 שעות ו־5 ימים, טמפרטורה מורגשת, לחות, רוח ומדד UV.</p><p>Home ו־Calendar נשמרו. העיר והמדינה משתמשות במנגנון הקיים. יחידות התצוגה: °C ו־km/h.</p><p>מקור הנתונים בטאב Weather הוא <a href="https://open-meteo.com/" rel="noreferrer">Open‑Meteo</a>, ברישיון <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a>; הנתונים מעוגלים ומעוצבים עבור הווידג׳ט. ייתכנו הבדלים לעומת ספק מזג האוויר המובנה של Home. זמני עדכון התחזית ואיכות האוויר מופיעים בתחתית. מקור AQI: <a href="https://ads.atmosphere.copernicus.eu/" rel="noreferrer">CAMS</a> דרך Open‑Meteo; זהו נתון ממודל אזורי. AQI מתרענן במטמון נפרד. אם הספק נכשל או אינו מחזיר נתון בזמן, יוצג מקף במקום מספר מומצא.</p><section class="card">')
  .replace('אין צורך לבצע מדידות או לשלוח צילום. שמור את City Country 1 כגיבוי והשתמש בחדש כשתרצה.','לחץ על Weather בסרגל התחתון. שמור את Lean Clock and Data 1 כגיבוי. גרסת בדיקה: התצוגה נבדקה ברינדור טכני, אך עדיין לא בתוך Widgy באייפון.');
for(const [name,value] of [[prefix+'-8.enc.json',envelope],[prefix+'-copy.js',js],[prefix+'-copy.html',html]]){
  if(value.includes(key.toString('base64url')))throw Error('Key in public artifact');
  writeFileSync('tools/'+name,value);
}
writeFileSync(privateDirectory+'/Widgy_Weather_Premium_8.json',raw,{mode:0o600});
// Reuse the owner's existing private key; each payload gets a fresh random IV.
writeFileSync(privateDirectory+'/weather-premium-copy-link.txt',PREVIEW+'/tools/'+prefix+'-copy.html#key='+key.toString('base64url')+'\n',{mode:0o600});
console.log(JSON.stringify({title,bytes:raw.length,sha256:hash}));
