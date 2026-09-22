import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v113.json'));
const data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=114';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v114 - Refined World Map';
data['4']=before['4']+' v114: darker detailed relief, clearer borders, warm city lights and atmospheric twilight matching the approved reference style more closely. Native map frame and all other native layers unchanged. Missing IP city names display coordinates only. Location remains approximate IP data; GPS and the native no-seconds timer are still pending.';

const restored=structuredClone(data),r=allNodes(restored).find(n=>n.d0===6170);
Object.assign(r,structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];
assert.deepEqual(restored,before);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v113.html').replaceAll('v113','v114')
 .replace('מפת עולם מפורטת עם יום–לילה דינמיים וסמן ליים.','מפה מלוטשת: עומק, גבולות ברורים ואורות לילה מודגשים.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Living World Map','Refined World Map');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v114.json',payload);
write('widgy-v114.html',html);
write('widgy-v114-integration.json',JSON.stringify({base:'v113',status:'prepared',
 changedLayerIds:[6170],imageEndpoint:url,scope:'Map-only visual refinement; all other native layers unchanged',
 location:'Approximate Vercel IP location; missing city uses coordinates only, not phone GPS',
 clock:'Unchanged; native no-seconds Live Timer remains pending',
 deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v113-copy.html','utf8').replaceAll('v113','v114')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Living World Map','Refined World Map')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v114-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:114,bytes:Buffer.byteLength(payload),sha256:hash,scope:'map-only',copyPayload:'verified'}));
