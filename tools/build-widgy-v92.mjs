import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v91.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const physical=original.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const span=sub(physical[24],physical[0]);
const radius=Math.hypot(span.x,span.y)/2;
const across={x:span.x/(2*radius),y:span.y/(2*radius)};
const along={x:-across.y,y:across.x};
const center={x:(physical[0].x+physical[24].x)/2,y:(physical[0].y+physical[24].y)/2};
const local=p=>({x:dot(sub(p,center),across),y:dot(sub(p,center),along)});
const fromLocal=p=>({x:center.x+p.x*across.x+p.y*along.x,y:center.y+p.x*across.y+p.y*along.y});
const normalized=p=>({x:p.x/boxW,y:p.y/boxH});
const theta=n=>Math.PI+n*Math.PI/24;
assert(Math.abs(radius-4.625)<1e-9);
// Recover the existing left arc's geometry in display coordinates. Its
// slight axial stretch comes from the established Widgy frame aspect ratio.
const axialRadius=local(physical[8]).y/Math.sin(theta(8));
for(let n=0;n<=8;n++){
 const p=local(physical[n]);
 assert(Math.abs(p.x-radius*Math.cos(theta(n)))<1e-9);
 assert(Math.abs(p.y-axialRadius*Math.sin(theta(n)))<1e-9);
}
const crown=local(physical[12]);
assert(Math.abs(crown.x)<1e-9);
const crownOffset=-crown.y-axialRadius;
assert(crownOffset>0&&crownOffset<.1);
// Retain the crown and left shoulder. Join them with a symmetric sin^4
// envelope: zero first derivative at the crown and zero first/second
// derivatives at the shoulder boundaries. Mirroring the old patched arc
// verbatim would create a cusp at the crown because its slope was nonzero.
const cap=n=>{
 const a=theta(n);
 const offset=n>8&&n<16?crownOffset*Math.sin(Math.PI*(n-8)/8)**4:0;
 return {x:(radius+offset)*Math.cos(a),y:(axialRadius+offset)*Math.sin(a)};
};
let maxLeftAdjustment=0;
for(let n=9;n<12;n++){
 const p=fromLocal(cap(n));
 maxLeftAdjustment=Math.max(maxLeftAdjustment,Math.hypot(p.x-physical[n].x,p.y-physical[n].y));
 item.shape.points[n]=normalized(p);
}
assert(maxLeftAdjustment<.017);
// Rebuild the right quarter exclusively from the left quarter. Discard all
// earlier localized right-edge additions and rational-curve weighting.
for(let n=13;n<24;n++){
 const p=item.shape.points[24-n];
 const left=local({x:p.x*boxW,y:p.y*boxH});
 item.shape.points[n]=normalized(fromLocal({x:-left.x,y:left.y}));
}
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
let maxSymmetryError=0,previousSymmetryError=0;
for(let n=0;n<=12;n++){
 const l=local(contour[n]),r=local(contour[24-n]);
 maxSymmetryError=Math.max(maxSymmetryError,Math.hypot(l.x+r.x,l.y-r.y));
 const a=local(physical[n]),b=local(physical[24-n]);
 previousSymmetryError=Math.max(previousSymmetryError,Math.hypot(a.x+b.x,a.y-b.y));
}
assert(maxSymmetryError<1e-9);
for(let n=0;n<50;n++){
 if(n<=8||n===12||n>=24)assert.deepEqual(item.shape.points[n],original[n]);
 const p=item.shape.points[n],l=local(contour[n]);
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 assert(l.x>=-radius-1e-9&&l.x<=radius+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert(cross(sub(b,a),sub(c,b))>0,'Keep a convex contour');
}
// Independent geometric checks of the sampled exported outline: matching
// turning curvature on both halves, unchanged length and unchanged sides.
const curvature=(p,n)=>{
 const a=sub(p[n],p[n-1]),b=sub(p[n+1],p[n]),c=sub(p[n+1],p[n-1]);
 return 2*cross(a,b)/(Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)*Math.hypot(c.x,c.y));
};
for(let n=1;n<12;n++)assert(Math.abs(curvature(contour,n)-curvature(contour,24-n))<1e-9);
const length=points=>{
 const positions=points.map(p=>dot(p,along));
 return Math.max(...positions)-Math.min(...positions);
};
assert(Math.abs(length(contour)-length(physical))<1e-9);
let maxChordError=0;
for(let n=0;n<24;n++)for(let j=1;j<100;j++){
 const p=fromLocal(cap(n+j/100)),a=contour[n],b=contour[n+1];
 maxChordError=Math.max(maxChordError,Math.abs(cross(sub(b,a),sub(p,a)))/Math.hypot(b.x-a.x,b.y-a.y));
}
assert(maxChordError<.015);
item.id='E785CA92-9F64-4DB1-A105-528838F93C92';
item.name='Mirrored Rain Cap v92';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Smoothed Right Edge · v91','Mirrored Cap · v92');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
assert.deepEqual(data['1'].slice(1),before['1'].slice(1));
data['3']='Native Weather Icons Master Board v92 - Mirrored Rain Cap';
data['4']='Based on v91 and IMG_9368. Rebuild the upper-right quarter by reflecting the upper-left quarter about the stroke axis in reference display coordinates. Replace accumulated asymmetric right-edge adjustments. Smooth the crown join with a symmetric sin-fourth envelope; only three left-crown vertices move, by less than 0.017 reference pixel. Retain the crown point, body width, axial length, angle, frame, both side joins, lower cap and every other layer. Both cap halves match in position and sampled curvature. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v92.json',payload);
const html=read('widgy-v91.html').replaceAll('v91','v92')
 .replace('עידון הקשת המעוגלת — פס בדיקה אחד','קצה מעוגל וסימטרי — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v92.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,bodyWidth:2*radius,previousSymmetryError,maxSymmetryError,maxLeftAdjustment,maxChordError,payloadLength:payload.length,sha256:hash}));
