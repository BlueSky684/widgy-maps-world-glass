import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-v98.json')),data=structuredClone(before);
const layers=data['1'][0]['1'];
const get=id=>layers.find(l=>l.d0===id);
const dayCloud=get(7302),dayMask=get(7303),daySeparator=get(7053);
const nightCloud=get(7010),moon=get(7011);
assert.equal(dayCloud['3'],'cloud');assert.equal(dayMask['3'],'cloud.fill');
assert.equal(daySeparator['3'],'cloud.fill');assert.equal(moon['3'],'moon.fill');
assert.equal(dayMask.f,daySeparator.f);
const dx=daySeparator.b.a[0].a-dayCloud.b.a[0].a;
const dy=daySeparator.c.a[0].a-dayCloud.c.a[0].a;
assert.equal(dx,5);assert.equal(dy,-5);
for(const key of ['b','c','d','e'])assert.deepEqual(dayCloud[key],dayMask[key]);
const usedIds=new Set();
function collect(value){
  if(Array.isArray(value)){value.forEach(collect);return;}
  if(!value||typeof value!=='object')return;
  if('d0' in value)usedIds.add(value.d0);
  Object.values(value).forEach(collect);
}
collect(data);
assert(!usedIds.has(79001)&&!usedIds.has(79002));
const interior=structuredClone(dayMask);
const separator=structuredClone(daySeparator);
for(const key of ['b','c','d','e']){
  interior[key]=structuredClone(nightCloud[key]);
  separator[key]=structuredClone(nightCloud[key]);
}
interior.d0=79001;
interior.s='WX · Partly Cloudy Night · Exact Interior Fill MASK · v99';
separator.d0=79002;
separator.s='WX · Partly Cloudy Night · CLOUD FILL SEPARATOR · +5X -5Y · v99';
separator.b.a[0].a+=dx;separator.c.a[0].a+=dy;
// Widgy serializes this stack front-to-back, as in the approved day icon:
// green cloud outline, exact background fill, offset background fill, moon.
const index=layers.indexOf(nightCloud);
assert.equal(layers[index+1],moon);
layers.splice(index+1,0,interior,separator);
assert.deepEqual(layers.filter(l=>![79001,79002].includes(l.d0)),before['1'][0]['1']);
const restored=structuredClone(data);
restored['1'][0]['1']=restored['1'][0]['1'].filter(l=>![79001,79002].includes(l.d0));
assert.deepEqual(restored,before);
data.a2=Math.max(Number(data.a2)||0,79003);
data['3']='Native Weather Icons Master Board v99 - Night Cloud Separation';
data['4']='Based on v98. Apply the approved v53 Partly Cloudy Day layer construction to Partly Cloudy Night: original green cloud outline, matching background-colored cloud.fill interior mask, a second cloud.fill separator offset +5X -5Y, then the original moon.fill behind. Both mask sizes match the existing night cloud frame. Preserve the original moon and cloud layers exactly, including size, position and weight. The standalone moon, all seven approved rain strokes, the entire day row and all other existing layers remain unchanged. Two native SF Symbol mask layers are added. Requires native visual review of the moon/cloud overlap.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v99.json',payload);
const html=read('widgy-v98.html').replaceAll('v98','v99')
  .replace('הפס המאושר — בכל פסי הגשם הקל והכבד','ירח עם ענן — הפרדה לפי הפתרון המאושר')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));
write('widgy-v99.html',html);
console.log(JSON.stringify({addedLayers:2,allExistingLayersUnchanged:true,separatorOffset:{dx,dy},
  payloadLength:payload.length,sha256:hash}));
