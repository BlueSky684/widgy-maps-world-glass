import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v127.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=128';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v128 - Refined Night Lighting';
data['4']='v128: refines the rebuilt reference map after the v127 device screenshot. Local light detail is separated from broad luminous bands; a smooth highlight shoulder preserves gold colour without white clipping. A higher night terrain floor reveals relief and borders. Reference artwork, approximate 68-landmark calibration, solar geometry, dynamic twilight, IP marker and native layout are retained. The image updates on Widgy refresh, not continuously. All other native layers and Live Timer (24 hours, No Seconds) are unchanged from v127. This remains illustrative artwork, not a pixel-identical reconstruction or measured city-light data.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v127.html').replaceAll('v127','v128')
 .replace('המפה נבנתה מחדש מתוך הרפרנס, עם בסיס חדש ואורות חמים נפרדים. תאורת היום והלילה דינמית.','אורות זהובים מעודנים יותר ומרקם קרקע ברור יותר בלילה. תאורת היום והלילה דינמית.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v128.json',payload);write('widgy-v128.html',html);
write('widgy-v128-integration.json',JSON.stringify({base:'v127',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[1827,861],staticLighting:false,artworkCalibration:'v127 illustrative calibration retained',
 changes:['reduce continuous bright bands relative to point lights','smooth highlight compression','night terrain gain 0.42 to 0.62'],
 nativePreservationVerified:true,deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:128,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',copyPayload:'verified'}));
