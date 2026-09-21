import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v77.json')),data=structuredClone(before);
const ids=new Set([77102]);
const source=JSON.parse(read('widgy-capsule-source.json'));
// Native v80 screenshot matches the upper arc alone (65/130 vertices).
// Keep this diagnostic contour below that suspected point ceiling.
const sample=before['1'][0]['1'].find(l=>l.d0===77102);
const w=sample.d.a[0].a,h=sample.e.a[0].a,r=w/2,segments=24;
const points=[];
for(const [cy,start] of [[r,Math.PI],[h-r,0]]){
 for(let n=0;n<=segments;n++){
  const t=start+n*Math.PI/segments;
  points.push({x:(r+r*Math.cos(t))/w,y:(cy+r*Math.sin(t))/h});
 }
}
assert.equal(points.length,50);
const maxDeviation=r*(1-Math.cos(Math.PI/(2*segments)));
assert(maxDeviation<0.014);
for(let n=0;n<points.length;n++){
 const p=points[n],cy=n<=segments?r:h-r;
 assert(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1);
 assert(Math.abs(Math.hypot(p.x*w-r,p.y*h-cy)-r)<1e-10);
}
const shapeId='E785CA81-9F64-4DB1-A105-528838F93C81';
const library={items:[{id:shapeId,name:'Single Rain Probe v81',shape:{rounding:0,points}}]};
source['2']=Buffer.from(JSON.stringify(library)).toString('base64');source['3']=shapeId;
assert.equal(source['1'].a[0].a,75);
let changed=0;
for(const layer of data['1'][0]['1']){
 if(!ids.has(layer.d0))continue;
 const old=before['1'][0]['1'].find(l=>l.d0===layer.d0);
 for(const key of ['1','2','3'])layer[key]=structuredClone(source[key]);
 layer.s=layer.s.replace('Single Rounded Shape · v77','Single Capsule Probe · v81');
 for(const k of ['b','c','d','e','q','i','g','z'])assert.deepEqual(layer[k],old[k]);
 changed++;
}
assert.equal(changed,1);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v81 - Single Rain Probe';
data['4']='Isolated test based on v77. ONLY the leftmost light-rain stroke (77102) uses a 50-point custom capsule. Both full semicircles and straight sides are included, with rounding 0. Maximum chord deviation is under 0.014 layout units. The v80 screenshot matched only its first semicircle; a point-count limit is suspected, not confirmed. All other layers remain exactly v77. This is a native rendering diagnostic, not an approved final fix.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v81.json',payload);
const html=read('widgy-v77.html').replaceAll('v77','v81')
 .replace('פסי גשם — ליטוש עדין','בדיקת פס אחד — השמאלי בגשם הקל')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v81.html',html);
console.log(JSON.stringify({changedStrokes:changed,customShapeId:source['3'],points:points.length,maxDeviation,payloadLength:payload.length,sha256:hash}));
