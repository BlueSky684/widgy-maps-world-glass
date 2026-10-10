// Owner's full export stays local; only AES-GCM encrypted output is committed.
import fs from 'node:fs';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {withHealthPremium,PREVIEW} from './health-premium-widget.js';
const [baseline,out,keyPath]=process.argv.slice(2);
if(!baseline||!out||!keyPath)throw Error('Usage: node tools/build-health-private-copy.mjs <v10.json> <private-output-dir> <private-key.json>');
const prefix='widgy-health-premium',title='Widgy Health Premium 1';
const raw=Buffer.from(JSON.stringify(withHealthPremium(JSON.parse(fs.readFileSync(baseline)))));
const key=Buffer.from(JSON.parse(fs.readFileSync(keyPath)).key,'base64url'),iv=randomBytes(12);
const aad=prefix+'-copy:v1:20261010';const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(aad));
const data=Buffer.concat([cipher.update(gzipSync(raw,{level:9})),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')};
const js=fs.readFileSync('tools/widgy-weather-premium-copy.js','utf8').replaceAll('widgy-weather-premium',prefix).replaceAll('Widgy Weather Premium 10',title).replaceAll(prefix+'-10.enc.json',prefix+'-1.enc.json').replace('20261009','20261010');
const intro=`<h1>Health — גרסת בדיקה ראשונה</h1>
<p dir="ltr">${title}</p>
<p>לוח הפעילות והבריאות בעיצוב שאישרת: צעדים, פעילות, דופק, HRV, דופק במנוחה, חמצן בדם, משך שינה, הפרעות נשימה ו־Cardio Fitness. הערכים מגיעים ממקורות Widgy במכשיר; נתוני הבריאות אינם נשלחים לשרת.</p>
<p>כולל הקטנה של 10% לשמש הראשית ב־Weather. שאר אייקוני מזג האוויר נשמרו. Home, Calendar, המפה וה־GPS נשמרו, והלשונית הרביעית נקראת כעת Health.</p>
<p><b>זו גרסת חיבור ראשונית, לא גרסה סופית:</b> בטבלה השבועית מחובר כרגע היום הנוכחי בלבד. ששת ימי העבר ושעת המדידה עדיין דורשים דוגמת הגדרות מתוך Widgy. משך השינה הוא הסיכום היומי של המקור, ולא זיהוי מאומת של הלילה האחרון. אין מספרי דוגמה בווידג׳ט.</p>
<p>מדד בריאות ללא ערך זמין יוצג כמקף. ערכי אפס במדדי הבריאות מוסתרים בשלב זה עד שנאמת את התנהגות המקור; אפס צעדים ופעילות נשארים תקינים. מידות הטבעות, היחידות והטקסט דורשות בדיקת תצוגה באייפון. אין חיווי אבחנתי או התראות.</p>
<section class="card">`;
let html=fs.readFileSync('tools/widgy-weather-premium-copy.html','utf8')
 .replaceAll('widgy-weather-premium',prefix).replaceAll('Widgy Weather Premium 10',title)
 .replace(/<h1>[\s\S]*?<section class="card">/,intro)
 .replace('<title>Widgy — Weather — העיצוב המאושר</title>','<title>Widgy — Health Premium 1</title>')
 .replace(/<li>לחץ על Weather[\s\S]*?<\/li>/,'<li>פתח את Health בסרגל התחתון וצלם את המסך לבדיקה. שמור את Weather Premium 10 כגיבוי.</li>')
 .replace('Widgy_Weather_Premium_10.json','Widgy_Health_Premium_1.json').replace('929,896 bytes',raw.length.toLocaleString('en-US')+' bytes');
for(const [name,value]of [[prefix+'-1.enc.json',JSON.stringify(envelope)+'\n'],[prefix+'-copy.js',js],[prefix+'-copy.html',html]]){
 if(value.includes(key.toString('base64url')))throw Error('Private key found in public artifact');
 fs.writeFileSync('tools/'+name,value);
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/Widgy_Health_Premium_1.json',raw,{mode:0o600});
fs.writeFileSync(out+'/health-copy-link.txt',PREVIEW+'/tools/'+prefix+'-copy.html#key='+key.toString('base64url')+'\n',{mode:0o600});
console.log(JSON.stringify({title,bytes:raw.length,sha256:envelope.sha256}));
