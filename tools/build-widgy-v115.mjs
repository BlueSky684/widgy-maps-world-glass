import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v114.json'));
const data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=115';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v115 - Solar Day and Night';
data['4']=before['4']+' v115: geographic day/night shading follows the current UTC solar position, with a symmetric soft blend centred on the geometric solar horizon and no decorative halo or artificial curvature. The historical textures remain illustrative. Map refreshes with Widgy. Location remains approximate IP data; native no-seconds Live Timer is still pending.';

const restored=structuredClone(data),r=allNodes(restored).find(n=>n.d0===6170);
Object.assign(r,structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];
assert.deepEqual(restored,before);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v114.html').replaceAll('v114','v115')
 .replace('מפה מלוטשת: עומק, גבולות ברורים ואורות לילה מודגשים.','יום ולילה לפי מיקום השמש, עם מעבר רך בגבול המחושב.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Refined World Map','Solar Day and Night');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v115.json',payload);
write('widgy-v115.html',html);
write('widgy-v115-integration.json',JSON.stringify({base:'v114',status:'prepared',
 changedLayerIds:[6170],imageEndpoint:url,scope:'Solar shading refinement; other native layers identical to v114',
 solarModel:'NOAA/Meeus, current server UTC; 50% blend at geometric 0-degree solar horizon',
 transition:'Symmetric -6 to +6 solar degrees; no fake curvature or blue halo',
 refresh:'On Widgy data-source refresh; not continuous animation',
 location:'Approximate Vercel IP location, not phone GPS',
 clock:'Unchanged; native no-seconds Live Timer remains pending',
 deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v114-copy.html','utf8').replaceAll('v114','v115')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Refined World Map','Solar Day and Night')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v115-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:115,bytes:Buffer.byteLength(payload),sha256:hash,changedLayerIds:[6170],copyPayload:'verified'}));
