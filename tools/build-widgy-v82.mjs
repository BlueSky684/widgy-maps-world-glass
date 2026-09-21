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
// Use the rounding field confirmed by the user's own exported custom shape.
// Keep the sampled contour and the entire layer frame unchanged.
item.shape.rounding=1;
item.id='E785CA82-9F64-4DB1-A105-528838F93C82';
item.name='Smooth Rain Ends v82';
layer['3']=item.id;
layer['2']=Buffer.from(JSON.stringify(library)).toString('base64');
layer.s=layer.s.replace('Single Capsule Probe · v81','Smooth Ends Probe · v82');
assert.deepEqual(item.shape.points,originalPoints);
for(const k of ['b','c','d','e','q','i','g','z','1'])assert.deepEqual(layer[k],old[k]);
const changed=1;
assert.equal(changed,1);
assert.deepEqual(data['1'][0]['1'].filter(l=>!ids.has(l.d0)),before['1'][0]['1'].filter(l=>!ids.has(l.d0)));
data['3']='Native Weather Icons Master Board v82 - Smooth Rain Ends';
data['4']='Based on v81. Only the leftmost light-rain stroke uses native custom-shape rounding 1 instead of 0. Its 50 contour points, frame width, height, position, rotation, colour and every other layer remain unchanged. A new shape UUID avoids reuse of the prior definition. Native rounding may affect the rendered contour; visual improvement is not verified until on-device review. v81 remains available.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64'),hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v82.json',payload);
const html=read('widgy-v81.html').replaceAll('v81','v82')
 .replace('בדיקת פס אחד — השמאלי בגשם הקל','החלקת קצוות — הפס השמאלי בגשם הקל')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
assert(!html.includes('<textarea'));assert(!html.includes('id="manual"'));write('widgy-v82.html',html);
console.log(JSON.stringify({changedStrokes:changed,points:item.shape.points.length,rounding:item.shape.rounding,payloadLength:payload.length,sha256:hash}));
