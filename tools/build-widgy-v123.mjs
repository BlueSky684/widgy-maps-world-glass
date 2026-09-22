import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v122.json')),data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const asset=readFileSync(new URL('../assets/earth/approved-map-v123.png',import.meta.url));
const imageHash=createHash('sha256').update(asset).digest('hex');
const width=asset.readUInt32BE(16),height=asset.readUInt32BE(20);
assert.deepEqual([width,height],[1828,860]);
const url='https://widgy-maps-world-glass.vercel.app/assets/earth/approved-map-v123.png';
map['2']=url;
map['22']=`var main = function() {\n  return '${url}';\n}`;
// Match the original aspect ratio exactly: no shader, raster processing or crop.
const oldHeight=map.e.a[0].a;
map.e.a[0].a=map.d.a[0].a*height/width;
map.c.a[0].a+=(oldHeight-map.e.a[0].a)/2;
data['3']='Widgy Home v123 - Approved Map Original';
data['4']='v123: uses the exact user-approved 1828x860 PNG, unchanged. Image frame preserves the original aspect ratio and is vertically centered within the previous map area. Lighting, city lights and blue halo are fixed in the artwork; no live location marker or location label is added. Native clock, agenda, weather, fitness, tabs and variables remain as in v122. Live Timer (24 hours, No Seconds) is preserved. Device appearance requires verification after import.';
const restored=structuredClone(data);
Object.assign(allNodes(restored).find(n=>n.d0===6170),structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];assert.deepEqual(restored,before);
assert.equal(allNodes(data).find(n=>n.d0===6110)['66'][0]['6'],'Live Timer (24 hours, No Seconds)');
assert.ok(Math.abs(map.d.a[0].a/map.e.a[0].a-width/height)<1e-12);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v122.html').replaceAll('v122','v123')
 .replace('גבולות מדינות ברורים יותר וגווני גרפיט, עם תאורת יום ולילה משתנה.','קובץ המפה שאישרת, בצבעים וביחס התמונה המקוריים. התאורה קבועה וללא סמן מיקום.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v123.json',payload);write('widgy-v123.html',html);
write('widgy-v123-integration.json',JSON.stringify({base:'v122',changedLayerIds:[6170],imageEndpoint:url,
 resolution:[width,height],imageSha256:imageHash,imageBytes:asset.length,staticLighting:true,locationMarker:false,
 frame:{x:map.b.a[0].a,y:map.c.a[0].a,width:map.d.a[0].a,height:map.e.a[0].a},
 nativePreservationVerified:true,deviceVerified:false,bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
console.log(JSON.stringify({version:123,bytes:Buffer.byteLength(payload),sha256:hash,imageSha256:imageHash,nativePreservation:'verified',aspectRatio:'verified',copyPayload:'verified'}));
