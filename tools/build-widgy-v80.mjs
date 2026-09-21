import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v77.json')),data=structuredClone(before);
const ids=new Set([77102,77105,77108,77202,77205,77208,77211]);
const source=JSON.parse(read('widgy-capsule-source.json'));
// Construct the contour in layer units, THEN normalize it for Widgy.
// Normalizing a generic rounded square before stretching distorted v79 caps.
const sample=before['1'][0]['1'].find(l=>ids.has(l.d0));
const w=sample.d.a[0].a,h=sample.e.a[0].a,r=w/2,segments=64;
const points=[];
for(const [cy,start] of [[r,Math.PI],[h-r,0]]){
 for(let n=0;n<=segments;n++){
  const angle=start+n*Math.PI/segments;
  points.push({x:(r+r*Math.cos(angle))/w,y:(cy+r*Math.sin(angle))/h});
 }
}
assert.equal(points.length,130);
for(const p of points)assert(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);
// No inferred spline interpolation: fine arc chords bound the approximation.
const maxDeviation=r*(1-Math.cos(Math.PI/(2*segments)));
assert(maxDeviation<0.002);
const shapeId='E785CA80-9F64-4DB1-A105-528838F93C80';
const library={items:[{id:shapeId,name:'Rain Capsule v80',shape:{rounding:0,points}}]};
source['2']=Buffer.from(JSON.stringify(library)).toString('base64');source['3']=shapeId;
assert.equal(source['1'].a[0].a,75);
let changed=0;
for(const layer of data['1'][0]['1']){
 if(!ids.has(layer.d0))continue;
 const old=before['1'][0]['1'].find(l=>l.d0===layer.d0);
 for(const key of ['1','2','3'])layer[key]=structuredClone(source[key]);
 layer.s=layer.s.replace('Single Rounded Shape · v77','Proportioned Capsule · v80');
 for(const k of ['b','c','d','e','q','i','g','z'])assert.deepEqual(layer[k],old[k]);
 changed++;
}
assert.equal(changed,7);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v80 - Proportioned Capsule';
data['4']='Based on v77. Seven native custom shapes use a capsule contour computed in actual layer units before normalization: parallel sides and two semicircular ends, each sampled with 64 arc segments. Maximum chord deviation is below 0.002 layout units. Custom spline rounding is disabled. This corrects the aspect distortion of v79 generic capsule preset. Frames, rotation, colour, spacing and other layers are unchanged. On-device rendering still requires visual approval.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v80.json',payload);
const html=read('widgy-v77.html').replaceAll('v77','v80')
 .replace('פסי גשם — ליטוש עדין','פסי גשם — קצוות עגולים לפי מידות הפס')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v80.html',html);
console.log(JSON.stringify({changedStrokes:changed,customShapeId:source['3'],points:points.length,maxDeviation,payloadLength:payload.length,sha256:hash}));
