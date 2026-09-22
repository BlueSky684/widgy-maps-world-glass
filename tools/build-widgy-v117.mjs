import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const write=(name,data)=>writeFileSync(new URL(name,import.meta.url),data);
const before=JSON.parse(read('widgy-v116.json'));
const data=structuredClone(before);
const map=allNodes(data).find(n=>n.d0===6170);
const oldFrame=Object.fromEntries(['b','c','d','e'].map(key=>[key,map[key].a[0].a]));
assert.deepEqual(oldFrame,{b:58,c:210,d:1484,e:640});
const scale=1.04,round=n=>Math.round(n*100)/100;
const frame={b:round(oldFrame.b-oldFrame.d*(scale-1)/2),
 c:round(oldFrame.c-oldFrame.e*(scale-1)),d:round(oldFrame.d*scale),e:round(oldFrame.e*scale)};
for(const [key,value] of Object.entries(frame)) {
 assert.equal(map[key].a.length,1);
 map[key].a[0].a=value;
}
// Uniform enlargement: same full image and aspect ratio, bottom anchored.
assert.equal(frame.c+frame.e,oldFrame.c+oldFrame.e);
assert(Math.abs(frame.d/frame.e-oldFrame.d/oldFrame.e)<1e-12);
assert(frame.b>=20&&frame.b+frame.d<=1580);
assert.equal(frame.b+frame.d/2,800);
assert.equal(map['2'],'https://widgy-maps-world-glass.vercel.app/api/home-map?v=116');
data['3']='Widgy Home v117 - Larger World Map';
data['4']=before['4']+' v117: uniformly enlarges only the native map image frame by 4%, centred horizontally and anchored to the same bottom edge. Same complete image content, aspect ratio and v116 renderer; no additional geographic crop. Other native layers unchanged.';

const restored=structuredClone(data),r=allNodes(restored).find(n=>n.d0===6170);
Object.assign(r,structuredClone(allNodes(before).find(n=>n.d0===6170)));
restored['3']=before['3'];restored['4']=before['4'];
assert.deepEqual(restored,before);
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
let html=read('widgy-v116.html').replaceAll('v116','v117')
 .replace('פרטי היבשות בלילה ברורים יותר, עם יום ולילה לפי מיקום השמש.','המפה גדולה ב־4%, עם כל תמונת המפה באותו יחס רוחב וגובה.')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`)
 .replaceAll('Balanced Night Map','Larger World Map');
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1],'base64')).toString(),payload);
write('widgy-v117.json',payload);
write('widgy-v117.html',html);
write('widgy-v117-integration.json',JSON.stringify({base:'v116',status:'prepared',
 changedLayerIds:[6170],scope:'Native map frame only',scale,oldFrame,frame,
 imageEndpoint:map['2'],rendererRevision:116,
 clipping:'No additional crop; same image aspect and native fitting settings',
 extent:'Same displayed geography: longitude -180..180, latitude 85..-65',
 anchor:'Horizontal centre 800; bottom 850',deviceVerified:false,
 bytes:Buffer.byteLength(payload),sha256:hash},null,2)+'\n');
let fragment=readFileSync('/workspace/widgy-v116-copy.html','utf8').replaceAll('v116','v117')
 .replace(/<script type="application\/json" data-packed>[\s\S]*?<\/script>/,`<script type="application/json" data-packed>${JSON.stringify(packed)}</script>`)
 .replace(/payload.length !== \d+/,`payload.length !== ${payload.length}`)
 .replaceAll('Balanced Night Map','Larger World Map')
 .replace(/hash !== '[^']+'/,`hash !== '${hash}'`);
writeFileSync('/workspace/widgy-v117-copy.html',fragment);
assert.equal(gunzipSync(Buffer.from(JSON.parse(fragment.match(/data-packed>([\s\S]*?)<\/script>/)[1]),'base64')).toString(),payload);
console.log(JSON.stringify({version:117,bytes:Buffer.byteLength(payload),sha256:hash,scale,frame,changedLayerIds:[6170],copyPayload:'verified'}));
