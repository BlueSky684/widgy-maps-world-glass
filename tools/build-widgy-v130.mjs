import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v129.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=129';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v130 - Fine Golden Night Lights';
data['4']='v130: night lighting rebuilt from the NASA Black Marble 2016 historical colour composite, mapped onto the existing illustrated terrain using coastal landmark registration. Fine urban emission and two soft amber bloom scales are separate; a smooth highlight response avoids broad white clipping. Source registration is approximate, not survey-grade. It is not a live satellite feed: UTC solar position dynamically gates lights and glow on each Widgy image refresh. The v129 terrain texture, colours, gain 0.48, day/night shading, borders, marker calibration and native frame are unchanged. Only the decorative blue-air coordinate field is smoothed to reduce triangle-boundary kinks. All native widget nodes except map 6170 URL/script and release metadata are preserved, including Live Timer (24 hours, No Seconds).';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v129.html').replaceAll('v129','v130')
 .replace('הזוהר הזהוב והרך של v127 חזר. מוקדי האור החזקים הוחלשו בעד 5%, והקרקע בלילה הובהרה מעט. ההילה ותאורת היום והלילה הדינמית נשמרו.','תאורת לילה חדשה: נקודות אור קטנות עם הילה זהובה רכה. הקרקע נשמרה כמו ב־v129. היום והלילה ממשיכים להתעדכן באופן דינמי.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v130.json',payload);write('widgy-v130.html',html);
write('widgy-v130-integration.json',JSON.stringify({base:'v129',terrainBase:'v129',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[1827,861],staticLighting:false,nightSource:'NASA Black Marble 2016 colour composite',
 sourceRegistration:'approximate illustrated-atlas controls; not survey-grade',nightTerrainGain:0.48,terrainUnchanged:true,
 bloomSigma:[0.85,3.2],bloomStrength:[0.58,0.38],coreColour:[1,0.79,0.46],nearColour:[1,0.70,0.30],farColour:[1,0.60,0.20],
 airOverlaySmoothed:true,originalSolarField:true,nativePreservationVerified:true,deviceVerified:false,
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:130,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',copyPayload:'verified'}));
