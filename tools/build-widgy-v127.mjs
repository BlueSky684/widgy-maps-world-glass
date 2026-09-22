import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v125.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=127';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
const previousHeight=map.e.a[0].a;
map.e.a[0].a=map.d.a[0].a*861/1827;
map.c.a[0].a+=(previousHeight-map.e.a[0].a)/2;
data['3']='Widgy Home v127 - Rebuilt Reference Map';
data['4']='v127: rebuilt from the approved reference artwork using a newly extracted unlit base and a separate warm light-emission layer. No previous terrain textures or land masks are used. A 68-landmark illustrative calibration anchors dynamic solar shading and the approximate IP marker to the reference composition. This is stylized artwork, not satellite imagery or survey-grade geography. Day/night and all light emission update for server time at Widgy refresh. The native map frame matches the new 1827x861 artwork; other native layers and Live Timer (24 hours, No Seconds) are preserved from v125.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
assert.ok(Math.abs(map.d.a[0].a/map.e.a[0].a-1827/861)<1e-12);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v125.html').replaceAll('v125','v127')
 .replace('מפה דינמית בגוני גרפיט עמוקים יותר, עם קווי חוף מעודנים ואורות ערים בלילה.','המפה נבנתה מחדש מתוך הרפרנס, עם בסיס חדש ואורות חמים נפרדים. תאורת היום והלילה דינמית.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v127.json',payload);write('widgy-v127.html',html);
write('widgy-v127-integration.json',JSON.stringify({base:'v125',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[1827,861],staticLighting:false,artworkCalibration:'68 landmarks; illustrative, not survey-grade',assets:['reference-base-v127.png','reference-lights-v127.png','reference-coordinates-v127.bin.gz','reference-mesh-v127.json'],locationMarker:'approximate IP when available',
 nativePreservationVerified:true,deviceVerified:false,
 refresh:'new server-time image on Widgy data refresh; timestamp query prevents URL cache reuse',
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:127,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',aspectRatio:'verified',copyPayload:'verified'}));
