import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v88.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const maxFill=.025;
// Local addition to the upper half of the right quarter, tapering with
// zero first, second and third derivatives at its boundaries. Retain the
// lower part of that quarter and the side join exactly as they were in v88.
for(let n=13;n<18;n++){
 const t=(n-12)/6;
 item.shape.points[n].x+=maxFill*Math.sin(Math.PI*t)**4/boxW;
 assert.equal(item.shape.points[n].y,original[n].y);
 assert(item.shape.points[n].x>original[n].x);
}
for(let n=0;n<50;n++)if(n<=12||n>=18)assert.deepEqual(item.shape.points[n],original[n]);
const toPhysical=p=>({x:p.x*boxW,y:p.y*boxH});
const contour=item.shape.points.map(toPhysical),previous=original.map(toPhysical);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const across=p=>p.x*Math.cos(Math.PI/6)+p.y*Math.sin(Math.PI/6);
const minAcross=across(previous[0]),maxAcross=across(previous[24]);
for(let n=0;n<50;n++){
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 assert(across(contour[n])>=minAcross-1e-9&&across(contour[n])<=maxAcross+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert(cross(sub(b,a),sub(c,b))>0,'Keep a convex contour');
 // This change must only add fill; the complete old outline stays inside.
 for(const q of previous)assert(cross(sub(b,a),sub(q,a))>=-1e-9);
}
assert.equal(Math.min(...contour.map(p=>p.y)),Math.min(...previous.map(p=>p.y)));
assert.equal(Math.max(...contour.map(p=>p.y)),Math.max(...previous.map(p=>p.y)));
item.id='E785CA89-9F64-4DB1-A105-528838F93C89';
item.name='Tiny Upper Right Rain Fill v89';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Fine Right Cap · v88','Tiny Upper Right Fill · v89');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
assert.deepEqual(data['1'].slice(1),before['1'].slice(1));
data['3']='Native Weather Icons Master Board v89 - Tiny Upper Right Rain Fill';
data['4']='Based on v88 and feedback IMG_9362. Add at most 0.025 reference pixel of horizontal fill to only the upper part of the right cap. A sin-fourth taper changes five points; every other contour point is identical to v88. The contour remains convex and within the same body width. The side join, lower cap, frame, color and other layers are unchanged. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v89.json',payload);
const html=read('widgy-v88.html').replaceAll('v88','v89')
 .replace('ליטוש זעיר לקשת — פס בדיקה אחד','תוספת עדינה לקשת העליונה — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v89.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,changedPoints:5,maxFill,payloadLength:payload.length,sha256:hash}));
