import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v84.json')),data=structuredClone(before);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const originalPoints=structuredClone(item.shape.points);
const boxW=old.d.a[0].a*1134/1600,boxH=old.e.a[0].a*1182/1600;
const start=-Math.PI/3,end=Math.PI/6,maxFill=0.20;
let moved=0;
// IMG_9354 marks the right shoulder below the v84 correction's center.
// Add a compact outward adjustment that vanishes with zero slope at both
// boundaries, including the existing straight-side tangent at +30 degrees.
for(let n=0;n<25;n++){
 const angle=-5*Math.PI/6+n*Math.PI/24;
 if(angle<=start+1e-10||angle>=end-1e-10)continue;
 const t=(angle-start)/(end-start);
 const fill=maxFill*Math.sin(Math.PI*t)**4;
 item.shape.points[n].x+=fill*Math.cos(angle)/boxW;
 item.shape.points[n].y+=fill*Math.sin(angle)/boxH;
 moved++;
}
assert.equal(moved,11);
for(let n=0;n<50;n++)if(n<=12||n>=24)assert.deepEqual(item.shape.points[n],originalPoints[n]);
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
const across=p=>p.x*Math.cos(Math.PI/6)+p.y*Math.sin(Math.PI/6);
const minAcross=across(contour[0]),maxAcross=across(contour[24]);
let minCross=Infinity;
for(let n=0;n<50;n++){
 const p=item.shape.points[n];
 assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
 // The cap remains inside the original parallel sides: body width is fixed.
 assert(across(contour[n])>=minAcross-1e-9&&across(contour[n])<=maxAcross+1e-9);
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 const cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
 assert(cross>0,'Contour must remain convex, without a notch or spike');
 minCross=Math.min(minCross,cross);
}
item.id='E785CA85-9F64-4DB1-A105-528838F93C85';
item.name='Right Shoulder Rain Polish v85';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Upper Right Cap Polish · v84','Right Shoulder Cap Polish · v85');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
assert.deepEqual(data['1'][0]['1'].filter(l=>l.d0!==77102),before['1'][0]['1'].filter(l=>l.d0!==77102));
data['3']='Native Weather Icons Master Board v85 - Right Shoulder Rain Polish';
data['4']='Based on v84. Only the right shoulder of the upper cap of the leftmost light-rain stroke receives an additional smooth outward adjustment, at most 0.20 reference pixel. The correction tapers to zero at the existing side tangent. The contour remains convex and inside the original parallel sides. Body width, lower cap, top, straight edges, frame and all other layers are unchanged. Native appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v85.json',payload);
const html=read('widgy-v84.html').replaceAll('v84','v85')
 .replace('ליטוש הקצה העליון — פס בדיקה אחד','ליטוש הקשת הימנית — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v85.html',html);
console.log(JSON.stringify({changedStrokes:1,points:item.shape.points.length,movedPoints:moved,maxFill,minCross,payloadLength:payload.length,sha256:hash}));
