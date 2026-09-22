import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v120.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=121';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v121 - Restored Master Map';
data['4']='v121: artistic terrain derived from the restored approved Master, registered to real geographic Natural Earth 1:10m land/coast/border masks. Separate NASA Black Marble 2016 city-light layer activates only during night/twilight. Low-saturation slate land remains readable at night; ink oceans and fine silver borders. Generated material contributes illustrative relief, not measured elevation or guaranteed pixel-identical artwork. NOAA/Meeus solar geometry and symmetric -6..+6 degree twilight blend remain unchanged. No baked terminator or static painted lights. Output 2400x1188. All native positions, weather conditions, variables and the live 24-hour no-seconds System Light clock are preserved from v120. IP location remains approximate; imagery refreshes with Widgy.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v120.html').replaceAll('v120','v121')
 .replace('מפה בגווני כחול עמוקים, קווי חוף מעודנים ואורות ערים מפורטים יותר.','מפה בעיצוב המבוסס על המאסטר, עם תאורת יום ולילה משתנה.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Coastal Relief Map','Restored Master Map');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v121.json',payload);write('widgy-v121.html',html);
write('widgy-v121-integration.json',JSON.stringify({base:'v120',status:'prepared',changedLayerIds:[6170],
 imageEndpoint:url,resolution:[2400,1188],nativePreservationVerified:true,deviceVerified:false,
 geometry:'Natural Earth 1:10m geographic masks; same projection as marker and solar boundary',
 material:'Restored Master-derived generated terrain; illustrative relief',
 lights:'Separate NASA Black Marble 2016 13500x6750 historical composite; night/twilight only',
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v120-copy.html','utf8').replaceAll('v120','v121')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Coastal Relief Map','Restored Master Map')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v121-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:121,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',copyPayload:'verified'}));
