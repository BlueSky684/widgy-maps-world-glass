import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const source=JSON.parse(read('widgy-v74.json')), data=structuredClone(source);
const layers=data['1'][0]['1'], byId=new Map(layers.map(l=>[l.d0,l]));
const sx=1134/1600, sy=1182/1600;
const ids=[77102,77105,77108,77202,77205,77208,77211];
const remove=new Set(ids.flatMap(id=>[id-2,id-1,id]));
const value=(l,k)=>l[k].a[0].a;
const setFrame=(l,frame,unit)=>{
  for(const [i,k] of [...'bcde'].entries())l[k]={a:[{a:frame[i],b:unit,c:0,d:unit}],b:0};
};
// The actual screenshot shows 8px and 9px bodies despite equal JSON widths.
// Give every native primitive the same pixel-aligned 9px width. Build an
// upright capsule first, then apply ONE rotation at group level. All child
// frames use the absolute coordinates used by Widgy's exported groups.
const width=9, bodyLength=23, total=width+bodyLength, pitch=28;
const groups=new Map();
for(const family of [ids.slice(0,3),ids.slice(3)]){
  const oldCenters=family.map(id=>(value(byId.get(id),'b')+value(byId.get(id),'d')/2)*sx);
  const mean=oldCenters.reduce((a,b)=>a+b,0)/family.length;
  const firstX=Math.round(mean-(family.length-1)*pitch/2-width/2);
  for(const [i,id] of family.entries()){
    const oldBody=byId.get(id), top=structuredClone(byId.get(id-2)), bottom=structuredClone(byId.get(id-1));
    const body=structuredClone(oldBody);
    const x=firstX+i*pitch;
    const centerY=(value(oldBody,'c')+value(oldBody,'e')/2)*sy;
    const y=Math.round(centerY-total/2);
    setFrame(top,[x/sx,y/sy,width/sx,width/sy],170);
    setFrame(bottom,[x/sx,(y+bodyLength)/sy,width/sx,width/sy],170);
    setFrame(body,[x/sx,(y+width/2)/sy,width/sx,bodyLength/sy],168);
    delete body.q;
    body.d0=77500+ids.indexOf(id);
    top.s=top.s.replace('v71','v75');bottom.s=bottom.s.replace('v71','v75');
    body.s=body.s.replace('v71','v75');
    const group={z:'13',d0:id,s:oldBody.s.replace('Body · v71','Aligned Capsule · v75'),q:30,'1':[top,bottom,body]};
    setFrame(group,[x/sx,y/sy,width/sx,total/sy],1301);
    groups.set(id,group);
  }
}
data['1'][0]['1']=layers.flatMap(l=>groups.has(l.d0)?[groups.get(l.d0)]:remove.has(l.d0)?[]:[l]);
data['3']='Native Weather Icons Master Board v75 - Grouped Rain Strokes';
data['4']='Based on v74 and IMG_9333.png. Each rain stroke is an upright native rectangle with two native circle.fill caps, aligned to a shared 9px width at the 1134x1182 reference size, then rotated 30 degrees as one group. The 7 groups share a 23px centreline length and 28px pitch; Light has 3 and Heavy has 4 strokes. This avoids separately positioning already-rotated caps. Other layers and colours are unchanged. Requires native Widgy screenshot verification of group transforms; no on-device render has been claimed.';
const unchangedBefore=source['1'][0]['1'].filter(l=>!remove.has(l.d0));
const unchangedAfter=data['1'][0]['1'].filter(l=>!groups.has(l.d0));
assert.deepEqual(unchangedAfter,unchangedBefore);
const allIds=[];
function visit(l){allIds.push(l.d0);if(l.z==='13')l['1'].forEach(visit)}
data['1'].forEach(visit);assert.equal(new Set(allIds).size,allIds.length);
for(const group of groups.values()){
  const [top,bottom,body]=group['1'];
  assert.equal(group.q,30);assert.equal(body.q,undefined);
  assert.equal(value(top,'b'),value(body,'b'));assert.equal(value(bottom,'b'),value(body,'b'));
  assert.equal(value(top,'d'),value(body,'d'));assert.equal(value(bottom,'d'),value(body,'d'));
  assert(Math.abs(value(top,'e')*sy-width)<1e-9);
  assert(Math.abs((value(top,'c')+value(top,'e')/2)-value(body,'c'))<1e-9);
  assert(Math.abs((value(bottom,'c')+value(bottom,'e')/2)-(value(body,'c')+value(body,'e')))<1e-9);
  assert.equal(top.f,body.g);assert.equal(bottom.f,body.g);
}
const payload=JSON.stringify(data);
write('widgy-v75.json',payload);
const packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
const html=read('widgy-v74.html').replaceAll('v74','v75')
 .replace('קצוות מעוגלים וחיבור חלק ואחיד','פסי גשם — יישור וסיבוב משותף')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));
write('widgy-v75.html',html);
console.log(JSON.stringify({groups:groups.size,widthPx:width,totalLengthPx:total,pitchPx:pitch,otherLayersUnchanged:unchangedAfter.length,jsonLength:payload.length,sha256:hash}));
