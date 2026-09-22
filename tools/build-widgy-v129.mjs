import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v128.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=129';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v129 - Soft Golden Glow';
data['4']='v129: restores the v127 golden lighting preferred by the user. Only the brightest direct-light cores are reduced by up to 5%, with a smooth selection ramp at source peaks 180-240/255. The reduction is applied to the visible direct contribution after clipping; the original 2.4-pixel golden bloom is preserved in colour, strength and radius. Dimmer light emission and halo contribution are unchanged. Night terrain gain is gently raised from v127 0.42 to 0.48 (below v128 0.62) to reveal relief without losing the dark backdrop. Daylight, solar geometry, twilight, approximate IP marker and calibration are retained. Only native map layer 6170 URL/script and release metadata change from v128. Live Timer (24 hours, No Seconds) and all other native widget data/layout are preserved. Dynamic lighting updates on Widgy data refresh. Illustrative artwork, not measured city-light data.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v128.html').replaceAll('v128','v129')
 .replace('אורות זהובים מעודנים יותר ומרקם קרקע ברור יותר בלילה. תאורת היום והלילה דינמית.','הזוהר הזהוב והרך של v127 חזר. מוקדי האור החזקים הוחלשו בעד 5%, והקרקע בלילה הובהרה מעט. ההילה ותאורת היום והלילה הדינמית נשמרו.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v129.json',payload);write('widgy-v129.html',html);
write('widgy-v129-integration.json',JSON.stringify({base:'v128',mapAppearanceBase:'v127',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[1827,861],staticLighting:false,maximumDirectCoreReduction:0.05,sourcePeakRamp:[180,240],bloomMultiplier:1,nightTerrainGain:0.48,
 originalGoldenColourAndBloom:true,nativePreservationVerified:true,deviceVerified:false,
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:129,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',copyPayload:'verified'}));
