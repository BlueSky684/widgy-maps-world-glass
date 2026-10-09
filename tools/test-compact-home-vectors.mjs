import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import sharp from 'sharp';
import {flatten} from './compact-widget-structure.js';import {compactHomeVectors,VECTOR_RUNS} from './compact-home-vectors.js';
const source=JSON.parse(readFileSync(process.argv[2])),w=structuredClone(source),changes=compactHomeVectors(w);
const before=new Map(flatten(source['1']).map(n=>[n.d0,n])),after=new Map(flatten(w['1']).map(n=>[n.d0,n]));
assert.equal(before.size-after.size,8);
const points=n=>{
 const item=JSON.parse(Buffer.from(n['2'],'base64')).items.find(i=>i.id===n['3']);
 return item.shape.points.map(p=>[n.b.a[0].a+p.x*n.d.a[0].a,n.c.a[0].a+p.y*n.e.a[0].a]);
};
const polygon=n=>`<polygon points="${points(n).map(p=>p.join(',')).join(' ')}" fill="#c8ff00"/>`;
const svg=(body,width)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="${width}" height="${Math.round(width*1184/1135)}">${body}</svg>`;
let comparisons=0;
for(const run of VECTOR_RUNS){
 const old=run.ids.map(id=>before.get(id)),n=after.get(run.ids[0]);
 assert.equal(n.g,old[0].g);
 for(const width of [367,707,1134,1600]){
  const a=await sharp(Buffer.from(svg(old.map(polygon).join(''),width))).ensureAlpha().raw().toBuffer();
  const b=await sharp(Buffer.from(svg(polygon(n),width))).ensureAlpha().raw().toBuffer();
  assert(a.equals(b),run.name+' exact raster at '+width);comparisons++;
 }
}
// Every original leaf remains in its original conditional parent and order.
// Restoring only the five declared sibling runs recovers the entire export.
for(const run of VECTOR_RUNS){
 const parent=after.get(run.parent),index=parent['1'].findIndex(n=>n.d0===run.ids[0]);
 parent['1'].splice(index,1,...run.ids.map(id=>structuredClone(before.get(id))));
}
assert.deepEqual(w,source);
console.log(JSON.stringify({pass:true,mergedRuns:changes.length,drawingsRemoved:8,exactRasterComparisons:comparisons,
 conditionsMaterialsOrderAndOtherFieldsExact:true,nativeRendererExecuted:false}));
