import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v100.json')),data=structuredClone(before);
const layers=data['1'][0]['1'],source=layers.find(l=>l.d0===77102);
const storm=layers.find(l=>l.d0===7006),background=layers.find(l=>l.d0===5001).g;
assert.equal(storm['3'],'cloud.bolt.rain');
const ids=new Set();
function collect(v){if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object'){if('d0' in v)ids.add(v.d0);Object.values(v).forEach(collect);}}
collect(data);assert(!ids.has(79201)&&!ids.has(79202));
const scale={x:1134/1600,y:1182/1600};
const frame=v=>({a:[{a:v,b:168,c:0,d:168}],b:0});
// Oriented bounds measured from the two surplus lower rain marks in native
// IMG_9385, including antialiased edges and 1.5 reference pixels of clearance.
// The upper pair already supplies one matching native stroke on each side.
const specs=[
  {id:79201,side:'Left',box:{x:429,y:784,w:25,h:31},points:[
    [442.78108891324547,786.6208348754011],[451.812177826491,791.8349364905389],
    [440.45096189432326,811.5131397208144],[431.41987298107773,806.2990381056766]]},
  {id:79202,side:'Right',box:{x:499,y:784,w:24,h:31},points:[
    [511.9820508075689,786.7368602791855],[521.0442286340599,791.9689110867544],
    [509.6830127018921,811.64711431703],[500.62083487540116,806.4150635094611]]}
];
const masks=specs.map(({id,side,box,points})=>{
  const mask=structuredClone(source),uuid=`58D02F49-A55C-4C62-8C71-${String(id).padStart(12,'0')}`;
  const normalized=points.map(([x,y])=>({x:(x-box.x)/box.w,y:(y-box.y)/box.h}));
  for(const p of normalized)assert(p.x>0&&p.x<1&&p.y>0&&p.y<1);
  const name=`Thunderstorm · ${side} Surplus Rain Mask · v101`;
  mask.d0=id;mask.s=name;mask.g=background;delete mask.p;
  mask['2']=Buffer.from(JSON.stringify({items:[{id:uuid,name,shape:{rounding:0,points:normalized}}]})).toString('base64');
  mask['3']=uuid;
  mask.b=frame(box.x/scale.x);mask.c=frame(box.y/scale.y);
  mask.d=frame(box.w/scale.x);mask.e=frame(box.h/scale.y);
  return mask;
});
// Front-to-back: v100 lightning, cloud-opening mask, these two masks, base symbol.
layers.splice(layers.indexOf(storm),0,...masks);
const restored=structuredClone(data);
restored['1'][0]['1']=restored['1'][0]['1'].filter(l=>![79201,79202].includes(l.d0));
assert.deepEqual(restored,before);
data.a2=Math.max(Number(data.a2)||0,79203);
data['3']='Native Weather Icons Master Board v101 - Two Storm Rain Strokes';
data['4']='Based on v100 and native IMG_9385. Hide only the two surplus lower rain strokes of cloud.bolt.rain using two native background-colored oriented masks. Preserve the original upper rain pair, one stroke on each side of the lightning. Preserve the v100 lightning contour and rounded cloud opening exactly. All existing layers, including the approved day rain strokes and moon/cloud stack, remain unchanged. No raster assets. Native visual review required.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v101.json',payload);
const html=read('widgy-v100.html').replaceAll('v100','v101')
  .replace('סופה — הברק והחיבור לענן','סופה — קו גשם אחד מכל צד')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));write('widgy-v101.html',html);
console.log(JSON.stringify({addedMasks:2,existingLayersUnchanged:true,payloadLength:payload.length,sha256:hash}));
