import {readFileSync, writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const write = (name, value) => writeFileSync(new URL(name, import.meta.url), value);
const before = JSON.parse(read('widgy-v94.json'));
const data = structuredClone(before);
const source = JSON.parse(read('widgy-blur-source.json'));
assert.equal(source.layerId, 77102);
assert.equal(source.field, 'p');
assert.equal(source.value.a.length, 1);
assert.equal(source.value.a[0].a, 1);

const layer = data['1'][0]['1'].find(item => item.d0 === source.layerId);
const original = before['1'][0]['1'].find(item => item.d0 === source.layerId);
assert(layer && original);
assert.equal(original.p, undefined);

// The user's native export establishes p as Blur. Preserve its envelope,
// changing only the effect value. 0.2 is an experimental Widgy value;
// it is not a verified physical-pixel radius or a native-render guarantee.
layer.p = structuredClone(source.value);
layer.p.a[0].a = 0.2;
layer.s = 'Light Rain · Stroke 1 · Soft Edge Test · v95';

// Preserve the complete v94 contour, frame, fill, and all other layers.
const withoutTestChanges = structuredClone(data);
const restored = withoutTestChanges['1'][0]['1'].find(item => item.d0 === source.layerId);
delete restored.p;
restored.s = original.s;
assert.deepEqual(withoutTestChanges, before);

data['3'] = 'Native Weather Icons Master Board v95 - Single Stroke Soft Edge Test';
data['4'] = 'Based on v94. The user export 20260921-152125 identifies native Blur as field p with value 1 on layer 77102. This test sets that field to 0.2 on the same stroke only. The complete contour, frame, position, geometric width, length, angle and fill are unchanged; every other layer is unchanged. The effect may change perceived sharpness or width and requires native Widgy comparison. The value is not asserted to be a physical-pixel radius. v94 remains available as the baseline.';

const payload = JSON.stringify(data);
const packed = gzipSync(Buffer.from(payload)).toString('base64');
const hash = createHash('sha256').update(payload).digest('hex');
write('widgy-v95.json', payload);
const html = read('widgy-v94.html').replaceAll('v94', 'v95')
  .replace('ליטוש תצוגת הקצה — פס בדיקה אחד', 'בדיקת ריכוך עדין — הפס השמאלי בגשם קל')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/, `const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/, `const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/, `packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/, `text.length!==${payload.length}`);
assert(!html.includes('<textarea'));
assert(!html.includes('id="manual"'));
assert(html.includes('בדיקת ריכוך עדין'));
write('widgy-v95.html', html);
console.log(JSON.stringify({version:95, changedStrokes:1, blur:0.2,
  geometryUnchanged:true, otherLayersUnchanged:true,
  payloadLength:payload.length, sha256:hash}));
