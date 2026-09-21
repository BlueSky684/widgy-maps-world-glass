import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v87.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const original=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const physical=original.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const angle=Math.PI/6,across={x:Math.cos(angle),y:Math.sin(angle)};
const side={x:-Math.sin(angle),y:Math.cos(angle)};
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const radius=dot(sub(physical[24],physical[0]),across)/2;
assert(Math.abs(radius-4.625)<1e-9);
// Replace the entire right-quarter segment with one rational quadratic.
// Retain its endpoints and analytic tangents. At the start (-60 degrees),
// the retained v84 correction has a nonzero derivative; the earlier v85
// bump had zero value and derivative there. Preserve the retained tangent.
const startAngle=-Math.PI/3;
const phase=2*(startAngle+Math.PI/2);
const offset=.10*Math.sin(phase)**4;
const derivative=.80*Math.sin(phase)**3*Math.cos(phase);
const tangent={
 x:radius*across.x+derivative*Math.cos(startAngle)-offset*Math.sin(startAngle),
 y:radius*across.y+derivative*Math.sin(startAngle)+offset*Math.cos(startAngle)
};
const start=physical[12],end=physical[24];
const distance=cross(sub(end,start),side)/cross(tangent,side);
assert(distance>0);
const control={x:start.x+distance*tangent.x,y:start.y+distance*tangent.y};
assert(Math.abs(cross(sub(control,start),tangent))<1e-9);
assert(Math.abs(cross(sub(end,control),side))<1e-9);
assert(dot(sub(end,control),side)>0);
// Preserve the v87 rational curve and rebalance its right outline subtly.
const weight=.9;
const baseCurve=t=>{
 const a=(1-t)**2,b=2*weight*t*(1-t),c=t*t,d=a+b+c;
 return {x:(a*start.x+b*control.x+c*end.x)/d,y:(a*start.y+b*control.y+c*end.y)/d};
};
// Move at most 0.05 reference pixel horizontally: inward near the cap,
// outward near the side join. The single polynomial has zero value and
// derivative at both ends, so endpoint positions and tangents stay fixed.
const maxShift=.05;
const shift=t=>maxShift*25*Math.sqrt(5)*t*t*(1-t)**2*(2*t-1);
const curve=t=>{const p=baseCurve(t);return {x:p.x+shift(t),y:p.y};};
assert.equal(Math.abs(shift(0)),0);assert.equal(Math.abs(shift(1)),0);
for(let n=1;n<12;n++){
 const t=n/12,p=baseCurve(t),index=12+n;
 assert(Math.hypot(p.x-physical[index].x,p.y-physical[index].y)<1e-9);
 if(n===6)continue;
 item.shape.points[index].x=original[index].x+shift(t)/boxW;
 assert.equal(item.shape.points[index].y,original[index].y);
 assert(n<6?shift(t)<0:shift(t)>0);
}
assert.deepEqual(item.shape.points[18],original[18]);
for(let n=0;n<50;n++)if(n<=12||n>=24)assert.deepEqual(item.shape.points[n],original[n]);
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const minAcross=dot(physical[0],across),maxAcross=dot(physical[24],across);
for(let n=0;n<50;n++){
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 assert(dot(contour[n],across)>=minAcross-1e-9&&dot(contour[n],across)<=maxAcross+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert(cross(sub(b,a),sub(c,b))>0,'Contour must remain convex');
}
assert.equal(Math.min(...contour.map(p=>p.y)),Math.min(...physical.map(p=>p.y)));
assert.equal(Math.max(...contour.map(p=>p.y)),Math.max(...physical.map(p=>p.y)));
let maxChordError=0;
for(let n=0;n<=1200;n++){
 const t=n/1200,p=curve(t),segment=Math.min(11,Math.floor(t*12));
 const a=contour[12+segment],b=contour[13+segment];
 maxChordError=Math.max(maxChordError,Math.abs(cross(sub(b,a),sub(p,a)))/Math.hypot(b.x-a.x,b.y-a.y));
 assert(dot(p,across)>=minAcross-1e-9&&dot(p,across)<=maxAcross+1e-9);
}
assert(maxChordError<.025);
item.id='E785CA88-9F64-4DB1-A105-528838F93C88';
item.name='Fine Balanced Right Rain Cap v88';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Balanced Right Cap · v87','Fine Right Cap · v88');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
data['3']='Native Weather Icons Master Board v88 - Fine Right Rain Cap';
data['4']='Based on v87 and feedback IMG_9360. A single smooth polynomial shifts the upper part of the right cap inward and its later side-join region outward by at most 0.05 reference pixel. The correction has zero value and slope at both endpoints. Preserve all y coordinates, the exact endpoints and tangent directions, body width, lower cap, frame, and every other layer. Only ten contour vertices change. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v88.json',payload);
const html=read('widgy-v87.html').replaceAll('v87','v88')
 .replace('איזון הקשת הימנית — פס בדיקה אחד','ליטוש זעיר לקשת — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v88.html',html);
console.log(JSON.stringify({changedStrokes:1,points:50,changedPoints:10,maxShift,weight,maxChordError,payloadLength:payload.length,sha256:hash}));
