import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v115.json'));
const data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=116';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v116 - Balanced Night Map';
data['4']=before['4']+' v116: night texture brightness balanced halfway between v114 and v115, restoring dim geographic detail while preserving bright city lights. Solar geometry, transition and day rendering remain as in v115. Native map URL and release metadata only.';

const restored=structuredClone(data),r=allNodes(restored).find(n=>n.d0===6170);
Object.assign(r,structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];
assert.deepEqual(restored,before);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v115.html').replaceAll('v115','v116')
 .replace('יום ולילה לפי מיקום השמש, עם מעבר רך בגבול המחושב.','פרטי היבשות בלילה ברורים יותר, עם יום ולילה לפי מיקום השמש.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Solar Day and Night','Balanced Night Map');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v116.json',payload);
write('widgy-v116.html',html);
write('widgy-v116-integration.json',JSON.stringify({base:'v115',status:'prepared',
 changedLayerIds:[6170],imageEndpoint:url,scope:'Night brightness only; all other native layers identical to v115',
 nightGain:'Midpoint of v114 and v115; .66 to 1, preserving bright lights',
 solarModel:'Unchanged v115 NOAA/Meeus current UTC geometry and symmetric horizon blend',
 refresh:'On Widgy data-source refresh',location:'Approximate IP, not phone GPS',
 clock:'Unchanged; native no-seconds Live Timer remains pending',
 deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v115-copy.html','utf8').replaceAll('v115','v116')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Solar Day and Night','Balanced Night Map')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v116-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:116,bytes:Buffer.byteLength(payload),sha256:hash,changedLayerIds:[6170],copyPayload:'verified'}));
