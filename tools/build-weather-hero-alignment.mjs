import fs from 'node:fs';import {randomBytes,createCipheriv,createHash} from 'node:crypto';import {gzipSync} from 'node:zlib';

const input=JSON.parse(fs.readFileSync(process.argv[2]));
let changed=0;
function upgrade(v){if(typeof v==='string'&&v.includes('/api/weather-panel?')&&v.includes('&v=12')){changed++;return v.replace('&v=12','&v=13');}if(Array.isArray(v))return v.map(upgrade);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,upgrade(x)]));return v;}
const output=upgrade(input);if(changed!==9)throw Error('Expected nine weather panel URL references, got '+changed);
const raw=Buffer.from(JSON.stringify(output));
fs.writeFileSync('work/private/Widgy_Health_Premium_1.json',raw,{mode:0o600});
const key=Buffer.from(JSON.parse(fs.readFileSync('work/private/copy-key.json')).key,'base64url'),iv=randomBytes(12);
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('widgy-health-premium-copy:v1:20261010'));
const data=Buffer.concat([cipher.update(gzipSync(raw,{level:9})),cipher.final(),cipher.getAuthTag()]);
fs.writeFileSync('tools/widgy-health-premium-1.enc.json',JSON.stringify({v:1,iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')})+'\n');
let html=fs.readFileSync('tools/widgy-health-premium-copy.html','utf8');
html=html.replace(/<h1>.*?<\/h1>/,'<h1>אחידות סמלי מזג האוויר — בדיקת Widgy</h1>').replace(/[\d,]+ bytes/,raw.length.toLocaleString('en-US')+' bytes').replace('פתח את Health וצלם את הטבלה השבועית לבדיקה.','פתח את Calendar ואת Weather ובדוק שמופיעים שם העיר והמדינה.');
fs.writeFileSync('tools/widgy-health-premium-copy.html',html);
console.log(JSON.stringify({bytes:raw.length,weatherRevision:13}));
