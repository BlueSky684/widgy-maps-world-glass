import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v121.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const url='https://widgy-maps-world-glass.vercel.app/api/home-map?v=122';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}&t=' + Date.now();\n}`;
data['3']='Widgy Home v122 - Clear Country Borders';
data['4']='v122: separate Natural Earth 1:10m border layer keeps countries visible at widget size in daylight and darkness. Graphite tone curve reduces flat grey land and saturation; geographic borders are applied independently of terrain and solar tint, before historical city lights. Uses the v121 Master-derived illustrative terrain. This is a closer stylistic match, not a pixel-identical extraction of the approved reference. Projection, solar geometry, locations, native positions, weather rules, variables and Live Timer (24 hours, No Seconds) are preserved from v121. IP location is approximate. Images update with Widgy refresh.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v121.html').replaceAll('v121','v122')
 .replace('מפה בעיצוב המבוסס על המאסטר, עם תאורת יום ולילה משתנה.','גבולות מדינות ברורים יותר וגווני גרפיט, עם תאורת יום ולילה משתנה.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v122.json',payload);write('widgy-v122.html',html);
write('widgy-v122-integration.json',JSON.stringify({base:'v121',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[2400,1188],nativePreservationVerified:true,deviceVerified:false,
 geometry:'Natural Earth 1:10m; independent border layer; same projection as terrain, marker and sun',
 terrain:'v121 Master-derived illustrative material with graphite tone curve',
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:122,bytes:Buffer.byteLength(payload),sha256:hash,nativePreservation:'verified',copyPayload:'verified'}));
