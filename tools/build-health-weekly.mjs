import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const [exportPath]=process.argv.slice(2);
const input=JSON.parse(fs.readFileSync(exportPath));
const w=JSON.parse(fs.readFileSync('work/private/health-native-rings-candidate.json'));
function walk(n){return [n,...(Array.isArray(n['1'])?n['1'].flatMap(walk):[])];}
const template=walk(input).find(n=>n.d0===85064);
assert.equal(template.z,'6');assert.equal(template['25'].a[0].a,-7);assert.equal(template['7'].a[0].a,80);assert.equal(template['3'],'Phenomena-Regular');assert(!template['9']);
const health=w['1'].find(n=>n.d0===195);
const lime=health['1'].find(n=>n.s==='Health · exercise ring')['10'];
const muted=health['1'].find(n=>n.s==='Health · energy0').f;
let id=Math.max(w.a2,85064);
const scalar=(a,k=168)=>({a:[{a,b:k,c:0,d:k}],b:0});
function chart(name,field,x,y,width,height,labels,color,spacing){
 const n=structuredClone(template);n.d0=++id;n.s=name;n['2']=field;n['4']=color;n['7']=scalar(spacing,1319);n['10'].a[0].a=labels?1:0;n['26']=scalar(0,1316);
 n.b=scalar(x*1600/1135);n.c=scalar(y*1600/1184);n.d=scalar(width*1600/1135);n.e=scalar(height*1600/1184);
 return n;
}
// Native seven-row layout: pitch 31.5 design px; 80% gap gives a 6.3 px bar.
// Values use independent transparent charts so their type stays readable and fixed in columns.
const bars=chart('Health · Weekly steps bars','Step Count',177.114846,806.85,410.672269,195.3,false,lime,80);
const steps=chart('Health · Weekly steps values','Step Count',646,794.25,150,220.5,true,'uicol_white-0',0);
const energy=chart('Health · Weekly energy values','Active Energy Burned',865,794.25,195,220.5,true,'uicol_white-0',0);energy.f=muted;
health['1']=health['1'].filter(n=>!/^Health · (steps[0-6]|energy[0-6]|Today steps bar)$/.test(n.s||''));
health['1'].unshift(bars,steps,energy);
w.a2=id;
const all=walk(w),ids=all.filter(n=>n.d0!==undefined).map(n=>n.d0);
assert.equal(new Set(ids).size,ids.length);
assert(!all.some(n=>[85063,85064].includes(n.d0)));
for(const n of [bars,steps,energy]){assert.equal(n['25'].a[0].a,-7);assert.equal(n['1'],'Health (Daily)');assert(!n['31']);}
for(const [i,max]of [[85037,300],[85038,45],[85039,12]])assert.equal(all.find(n=>n.d0===i)['20'],max);
const raw=Buffer.from(JSON.stringify(w));
fs.writeFileSync('work/private/Widgy_Health_Premium_1.json',raw,{mode:0o600});
const key=Buffer.from(JSON.parse(fs.readFileSync('work/private/copy-key.json')).key,'base64url'),iv=randomBytes(12);
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('widgy-health-premium-copy:v1:20261010'));
const data=Buffer.concat([cipher.update(gzipSync(raw,{level:9})),cipher.final(),cipher.getAuthTag()]);
fs.writeFileSync('tools/widgy-health-premium-1.enc.json',JSON.stringify({v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')})+'\n');
let html=fs.readFileSync('tools/widgy-health-premium-copy.html','utf8');
html=html.replace(/<h1>.*?<\/h1>/,'<h1>Health — פעילות שבועית מחוברת</h1>').replace(/<p><b>זו גרסת חיבור ראשונית[\s\S]*?<\/p>/,'<p>צעדים וקלוריות בשבעת הימים האחרונים מחוברים כעת לתרשימים המובנים של Widgy. זוהי בניית בדיקה: יש לבדוק באייפון את גודל המספרים ויישור השורות. שלוש טבעות הפעילות מוגדרות ליעדים 300 קלוריות, 45 דקות אימון ו־12 שעות עמידה. הכיתוב Day Progress הורם מעט.</p>').replace('פתח את Home ואת Weather וצלם את שני המסכים לבדיקה.','פתח את Health וצלם את הטבלה השבועית לבדיקה.').replace(/939,624 bytes/,raw.length.toLocaleString('en-US')+' bytes');
fs.writeFileSync('tools/widgy-health-premium-copy.html',html);
console.log(JSON.stringify({nativeCharts:3,lastDays:7,removedPlaceholders:14,bytes:raw.length,ids:[bars.d0,steps.d0,energy.d0]}));
