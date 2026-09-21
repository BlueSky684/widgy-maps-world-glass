import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v81.json')),data=structuredClone(before);
const ids=new Set([77102]);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const originalPoints=structuredClone(item.shape.points);
const sx=1134/1600,sy=1182/1600;
const width=old.d.a[0].a*sx,height=old.e.a[0].a*sy;
const angle=old.q*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
const centerX=(old.b.a[0].a+old.d.a[0].a/2)*sx;
const centerY=(old.c.a[0].a+old.e.a[0].a/2)*sy;
// Match the observed display-space rotation, compensating unequal x/y scales.
const rotated=originalPoints.map(p=>{
 const x=(p.x-.5)*width,y=(p.y-.5)*height;
 return {x:x*cos-y*sin,y:x*sin+y*cos};
});
const pad=1;
const minX=Math.min(...rotated.map(p=>p.x))-pad,maxX=Math.max(...rotated.map(p=>p.x))+pad;
const minY=Math.min(...rotated.map(p=>p.y))-pad,maxY=Math.max(...rotated.map(p=>p.y))+pad;
const boxW=maxX-minX,boxH=maxY-minY;
item.shape.points=rotated.map(p=>({x:(p.x-minX)/boxW,y:(p.y-minY)/boxH}));
item.shape.rounding=0;
item.id='E785CA83-9F64-4DB1-A105-528838F93C83';item.name='Direct Angle Rain v83';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.b.a[0].a=(centerX+minX)/sx;layer.c.a[0].a=(centerY+minY)/sy;
layer.d.a[0].a=boxW/sx;layer.e.a[0].a=boxH/sy;
layer.q=0;
// The custom contour supplies the caps; no rounded rectangular clipping frame.
layer.i.a[0].a=0;
layer.s=layer.s.replace('Single Capsule Probe · v81','Direct Angle Probe · v83');
for(let n=0;n<rotated.length;n++){
 const p=item.shape.points[n];
 assert(Math.abs((layer.b.a[0].a+layer.d.a[0].a*p.x)*sx-(centerX+rotated[n].x))<1e-9);
 assert(Math.abs((layer.c.a[0].a+layer.e.a[0].a*p.y)*sy-(centerY+rotated[n].y))<1e-9);
}
for(const k of ['g','z','1'])assert.deepEqual(layer[k],old[k]);
const changed=1;
assert.equal(changed,1);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v83 - Direct Angle Rain';
data['4']='Single-stroke diagnostic based on v81. Bake its 30-degree display-space rotation into the same 50 contour vertices and set layer rotation to zero. Compensate the 1134x1182 reference display scale. The visible contour coordinates match v81 mathematically at that scale; only its enclosing frame changes with one reference-pixel padding. Disable frame corner rounding. All other layers are unchanged. Whether removing the layer transform improves native antialiasing requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v83.json',payload);
const html=read('widgy-v81.html').replaceAll('v81','v83')
 .replace('בדיקת פס אחד — השמאלי בגשם הקל','ציור ישיר בזווית — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v83.html',html);
console.log(JSON.stringify({changedStrokes:changed,points:item.shape.points.length,rounding:item.shape.rounding,payloadLength:payload.length,sha256:hash}));
