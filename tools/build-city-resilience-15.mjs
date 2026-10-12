// Full Weather 15 update: change one city script and document description.
// Preserve the approved daily widget and encrypt before public publication.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {sharedLocationText} from './shared-location-widget.js';

const originalPath='work/private/weather15-before-city-resilience.json';
const rawBefore=fs.readFileSync(originalPath),hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(rawBefore),'4af8c286f333f3dcded3891f81ac267bb1711fc080a0923bbc637880cef970e7');
const original=JSON.parse(rawBefore),widget=structuredClone(original);
assert.equal(widget['3'],'Widgy Weather 15');
const city=w=>w['36'].find(v=>v['1']==='calendar_location_pair')['3']['66'][0];
assert.equal(city(widget)['5'],'Javascript');
assert.equal(city(widget)['6'],'Async + No main()');
const old=city(widget)['10'];
const match=old.match(/\nsharedLocationText\("\$\{widgy\.map_latitude_max5\}","\$\{widgy\.map_longitude_max5\}",("[^\n]+")\);\s*$/);
assert(match,'Unexpected city script call');
const endpoint=new URL(JSON.parse(match[1]));
assert.equal(endpoint.origin,'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app');
assert.equal(endpoint.pathname,'/api/fetch-probe');
assert.equal(endpoint.searchParams.get('location_shared'),'1');
city(widget)['10']=sharedLocationText.toString()+match[0];
widget['4']='Weather 15: city lookup resilience. City text completes once within four seconds; the server keeps the full-resolution dynamic map available when city lookup fails, using coordinates until a verified name is available. Approved design, 500 Cal goal and all other data retained. Native stability still requires observation.';
const restored=structuredClone(widget);city(restored)['10']=old;restored['4']=original['4'];
assert.deepEqual(restored,original,'Unexpected changes outside city script and description');

const key=Buffer.from(JSON.parse(fs.readFileSync('work/private/copy-key.json')).key,'base64url');
const aad=Buffer.from('widgy-health-premium-copy:v1:20261010');
const encPath='tools/widgy-health-premium-1.enc.json';
const oldEnvelope=fs.readFileSync(encPath,'utf8'),e=JSON.parse(oldEnvelope),ciphertext=Buffer.from(e.data,'base64url');
const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(e.iv,'base64url'));decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(rawBefore),'Public copy is not the audited baseline');
fs.writeFileSync('work/private/weather15-before-city-resilience.enc.json',oldEnvelope,{mode:0o600});
const raw=Buffer.from(JSON.stringify(widget)),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const data=Buffer.concat([cipher.update(gzipSync(raw,{level:9})),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:hash(raw)};
const verify=createDecipheriv('aes-256-gcm',key,iv);verify.setAAD(aad);verify.setAuthTag(data.subarray(-16));
assert(gunzipSync(Buffer.concat([verify.update(data.subarray(0,-16)),verify.final()])).equals(raw));
fs.writeFileSync('work/private/Widgy_Health_Premium_1.json',raw,{mode:0o600});
fs.writeFileSync(encPath,JSON.stringify(envelope)+'\n');
let js=fs.readFileSync('tools/widgy-health-premium-copy.js','utf8').replaceAll('15-clean','15-city-resilience');
let html=fs.readFileSync('tools/widgy-health-premium-copy.html','utf8').replaceAll('15-clean','15-city-resilience');
html=html.replace(/<h1>[\s\S]*?<p class="small">מקורות נתוני Weather:/,
 '<h1>Weather 15 — תיקון טעינת שם העיר</h1><p>כשל בחיפוש שם העיר כבר לא עוצר את יצירת המפה בשרת. אם אין שם מאומת זמין, המפה מציגה את סימון המיקום והקואורדינטות. טעינת שם העיר ב־Calendar וב־Weather מוגבלת בזמן ומחזירה תשובה פעם אחת בלבד.</p><p>זהו הווידג׳ט המלא בשם Widgy Weather 15. העיצוב, איכות המפה, שאר הנתונים ויעד התנועה של 500 קלוריות נשמרו. זה תיקון לנקודת כשל שהודגמה בקוד; יציבות התצוגה בתוך Widgy עדיין דורשת שימוש בפועל.</p><p class="small">מקורות נתוני Weather:');
html=html.replace('בדוק את תחתית Weather ואת השורה האחרונה בטבלת Health. שמור את העותק הקודם כגיבוי.',
 'הצב את העותק החדש באותו מקום במסך במקום עותק הבדיקה. בדוק שהמפה ושם העיר מופיעים, ואז השתמש כרגיל. שמור את העותק הקודם בתוך Widgy כגיבוי. אין צורך להשאיר כמה ווידג׳טים על המסך.');
html=html.replace(/[\d,]+ bytes/,raw.length.toLocaleString('en-US')+' bytes');
for(const value of [js,html,JSON.stringify(envelope)])assert(!value.includes(key.toString('base64url')),'Key exposed in public files');
fs.writeFileSync('tools/widgy-health-premium-copy.js',js);
fs.writeFileSync('tools/widgy-health-premium-copy.html',html);
console.log(JSON.stringify({name:widget['3'],bytes:raw.length,sha256:hash(raw),changes:['calendar_location_pair JavaScript','description'],allLayersAndImageURLsUnchanged:true,encryptedRoundTrip:true}));
