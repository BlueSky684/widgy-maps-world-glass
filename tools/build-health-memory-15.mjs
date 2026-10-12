// One isolated resource change in the complete Weather 15 widget.
// Private source and encryption key remain local; only encrypted JSON is shipped.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';

const source='work/private/Widgy_Health_Premium_1.json';
const envelopePath='tools/widgy-health-premium-1.enc.json';
const hash=b=>createHash('sha256').update(b).digest('hex');
const before=fs.readFileSync(source);
assert.equal(hash(before),'a37852981a3c3a9b66a26449688792531ed47c2cc82394342ed8d81161f77f8a');
const original=JSON.parse(before),widget=structuredClone(original);
const walk=n=>[n,...(Array.isArray(n['1'])?n['1'].flatMap(walk):[])];
assert.equal(widget['3'],'Widgy Weather 15');
const health=walk(widget).filter(n=>n.d0===85059);
assert.equal(health.length,1); assert.equal(health[0]['1'],'Web URL');
const oldURL=health[0]['2'];
assert.equal(oldURL,'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/health-premium/chrome-h1-clean.png');
const asset='assets/health-premium/chrome-h1-clean-1320.png';
assert.equal(hash(fs.readFileSync(asset)),'b6f0618efa9772084d1b0a4bebd1b63e0cfa2a15a1270341a93d49732ae552e2');
health[0]['2']=oldURL.replace('chrome-h1-clean.png','chrome-h1-clean-1320.png');
widget['4']='Weather 15: lighter Health background (1320 x 1377). Same approved artwork with the current-day row background removed. Full-resolution dynamic map, live clock, city lookup resilience, layout, data and 500 Cal goal retained. Native map stability is not yet verified.';
const restored=structuredClone(widget);
walk(restored).find(n=>n.d0===85059)['2']=oldURL;
restored['4']=original['4'];
assert.deepEqual(restored,original,'Unexpected change outside Health artwork URL and description');
assert.equal(walk(widget).length-1,1204);assert.equal(widget['36'].length,74);
const key=Buffer.from(JSON.parse(fs.readFileSync('work/private/copy-key.json')).key,'base64url');
const aad=Buffer.from('widgy-health-premium-copy:v1:20261010');
const oldEnvelope=fs.readFileSync(envelopePath),e=JSON.parse(oldEnvelope),oldData=Buffer.from(e.data,'base64url');
function decrypt(iv,data){const d=createDecipheriv('aes-256-gcm',key,iv);d.setAAD(aad);d.setAuthTag(data.subarray(-16));return gunzipSync(Buffer.concat([d.update(data.subarray(0,-16)),d.final()]));}
assert(decrypt(Buffer.from(e.iv,'base64url'),oldData).equals(before),'Public encrypted widget differs from the audited baseline');
fs.writeFileSync('work/private/weather15-before-health-memory.json',before,{mode:0o600,flag:'wx'});
fs.writeFileSync('work/private/weather15-before-health-memory.enc.json',oldEnvelope,{mode:0o600,flag:'wx'});
const raw=Buffer.from(JSON.stringify(widget)),iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(aad);
const data=Buffer.concat([c.update(gzipSync(raw,{level:9})),c.final(),c.getAuthTag()]);
assert(decrypt(iv,data).equals(raw),'Encrypted copy does not round trip');
const envelope=JSON.stringify({v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:hash(raw)})+'\n';
let html=fs.readFileSync('tools/widgy-health-premium-copy.html','utf8').replaceAll('15-city-resilience','15-health-memory');
html=html.replace(/<h1>[\s\S]*?<p class="small">מקורות נתוני Weather:/,
 '<h1>Weather 15 — רקע Health קל יותר</h1><p>הגרסה המלאה עם רקע Health קטן יותר, באותו עיצוב. החיסכון המחושב לתמונת הרקע הוא כ־13.6 MiB בזיכרון תמונה מפוענחת. השפעת השינוי על יציבות המפה עדיין נבדקת באייפון.</p><p>המפה הדינמית נשארה באיכות המקורית. שם הווידג׳ט הוא Widgy Weather 15.</p><p class="small">מקורות נתוני Weather:');
html=html.replace('הצב את העותק החדש באותו מקום במסך במקום עותק הבדיקה. בדוק שהמפה ושם העיר מופיעים, ואז השתמש כרגיל. שמור את העותק הקודם בתוך Widgy כגיבוי. אין צורך להשאיר כמה ווידג׳טים על המסך.',
 'החלף את העותק שעל המסך בעותק החדש. פתח Health פעם אחת כדי לבדוק את החדות. בתוך Edit Widget → Warnings, צלם את Images memory usage. לאחר מכן חזור ל־Home והשתמש כרגיל. די בווידג׳ט אחד על המסך; שמור את העותק הקודם בתוך Widgy כגיבוי.');
html=html.replace(/[\d,]+ bytes/,raw.length.toLocaleString('en-US')+' bytes');
const js=fs.readFileSync('tools/widgy-health-premium-copy.js','utf8').replaceAll('15-city-resilience','15-health-memory');
for(const publicValue of [html,js,envelope])assert(!publicValue.includes(key.toString('base64url')),'Key exposed in public output');
fs.writeFileSync(source,raw,{mode:0o600});
fs.writeFileSync(envelopePath,envelope);
fs.writeFileSync('tools/widgy-health-premium-copy.html',html);
fs.writeFileSync('tools/widgy-health-premium-copy.js',js);
const report={name:widget['3'],bytes:raw.length,sha256:hash(raw),changedNode:85059,
  changes:['Health background URL','description'],allOtherWidgetDataUnchanged:true,
  nodes:walk(widget).length-1,variables:widget['36'].length,encryptedRoundTrip:true};
fs.writeFileSync('work/health-memory-15/widget-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
