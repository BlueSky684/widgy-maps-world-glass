import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v83.json')),data=structuredClone(before);
const ids=new Set([77102]);
const layer=data['1'][0]['1'].find(l=>l.d0===77102);
const old=before['1'][0]['1'].find(l=>l.d0===77102);
const library=JSON.parse(Buffer.from(layer['2'],'base64').toString('utf8'));
const item=library.items.find(item=>item.id===layer['3']);
assert.equal(item.shape.rounding,0);
assert.equal(item.shape.points.length,50);
const originalPoints=structuredClone(item.shape.points);
const sx=1134/1600,sy=1182/1600;
const boxW=old.d.a[0].a*sx,boxH=old.e.a[0].a*sy;
const maxFill=0.10; // reference pixel; a local optical adjustment, not body width
let moved=0;
for(let n=0;n<25;n++){
 const a=Math.PI+n*Math.PI/24+Math.PI/6-2*Math.PI;
 if(a<=-Math.PI/2+1e-10||a>=-1e-10)continue;
 const t=(a+Math.PI/2)/(Math.PI/2);
 const fill=maxFill*Math.sin(Math.PI*t)**4;
 item.shape.points[n].x+=fill*Math.cos(a)/boxW;
 item.shape.points[n].y+=fill*Math.sin(a)/boxH;
 moved++;
}
assert.equal(moved,11);
// The lower arc, both side joins, and all other cap regions are untouched.
for(let n=0;n<50;n++)if(n<=8||n>=20)assert.deepEqual(item.shape.points[n],originalPoints[n]);
for(const p of item.shape.points)assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
const contour=item.shape.points.map(p=>({x:p.x*boxW,y:p.y*boxH}));
for(let n=0;n<50;n++){
 const a=contour[n],b=contour[(n+1)%50],c=contour[(n+2)%50];
 assert((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>0,'Keep convex contour');
}
item.id='E785CA84-9F64-4DB1-A105-528838F93C84';item.name='Upper Right Rain Polish v84';
layer['3']=item.id;layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Direct Angle Probe · v83','Upper Right Cap Polish · v84');
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
const changed=1;
assert.equal(changed,1);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v84 - Upper Right Rain Polish';
data['4']='Based on v83, which the user reported improved the rain stroke. ONLY the upper-right quadrant of the leftmost light-rain cap gets a smooth outward optical correction of at most 0.10 reference pixel, tapering to zero at both ends. The contour remains convex. Body width, lower cap, side joins, frame, position, rotation and all other layers are unchanged. Native visual appearance requires on-device review.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v84.json',payload);
const html=read('widgy-v83.html').replaceAll('v83','v84')
 .replace('ציור ישיר בזווית — פס בדיקה אחד','ליטוש הקצה העליון — פס בדיקה אחד')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v84.html',html);
console.log(JSON.stringify({changedStrokes:changed,points:item.shape.points.length,movedPoints:moved,maxFill,payloadLength:payload.length,sha256:hash}));
