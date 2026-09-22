import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {allNodes} from './build-widgy-v110.mjs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const write = (name, value) => writeFileSync(new URL(name, import.meta.url), value);
const before = JSON.parse(read('widgy-v111.json'));
const data = structuredClone(before);
const nodes = allNodes(data);
const ids = [6103, 6104];

// Native text property 2 stores horizontal alignment as an animated value.
// The structure and value come from zdunex25/zeppos-onlyus-widgy,
// Widget/Widgy_iOS/OnlyUs.json: "Touches:", "Kisses:" and "Hearts:" use
// value 2 to sit at the right edge immediately before their numeric values.
// Its title and numeric values use 1 (center), independently corroborated by
// mhd-riaz/widgy's modern-clock.json and its rendered clock screenshot.
// Use right alignment, value 2, and an identical right boundary for both labels.
// This keeps the position independent of the weekday/month string's length.
for (const id of ids) {
  const node = nodes.find(n => n.d0 === id);
  assert(node?.z === '1', `Missing text layer ${id}`);
  node['2'] = {a:[{a:2, b:168}], b:0};
  node.b.a[0].a = 1115;
  node.d.a[0].a = 260;
}

data['3'] = 'Widgy Home v112 - Right Aligned Date';
data['4'] = before['4'] + ' v112 corrects horizontal text alignment of Header Weekday and Header Month to Right (native text property 2). Both frames now share x=1115 and width=260, ending at 1375 before the divider. Text size, vertical position and dynamic data sources are preserved. On-device alignment rendering requires confirmation.';

// Validate the meaningful scope constraint: only horizontal alignment and frame
// x/width on these two labels can change, apart from release name/description.
const restored = structuredClone(data);
for (const id of ids) {
  const original = allNodes(before).find(n => n.d0 === id);
  const node = allNodes(restored).find(n => n.d0 === id);
  for (const key of ['2', 'b', 'd']) {
    if (Object.hasOwn(original, key)) node[key] = structuredClone(original[key]);
    else delete node[key];
  }
}
restored['3'] = before['3'];
restored['4'] = before['4'];
assert.deepEqual(restored, before);

const payload = JSON.stringify(data);
const packed = gzipSync(Buffer.from(payload)).toString('base64');
const hash = createHash('sha256').update(payload).digest('hex');
const html = read('widgy-v111.html').replaceAll('v111', 'v112')
  .replace('התאמת הברכה ובלוק התאריך למאסטר המאושר.', 'יישור שם היום והחודש לימין, לפי המאסטר המאושר.')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/, `const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/, `const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/, `packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/, `text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1], 'base64')).toString(), payload);
write('widgy-v112.json', payload);
write('widgy-v112.html', html);
write('widgy-v112-integration.json', JSON.stringify({
  status:'ready-for-device-verification', base:'v111',
  changedLayerIds:ids, horizontalAlignment:{property:'2', value:2},
  nativeAlignmentSource:'https://github.com/zdunex25/zeppos-onlyus-widgy/blob/master/Widget/Widgy_iOS/OnlyUs.json',
  frames:{x:1115, width:260, right:1375},
  validation:'Only alignment and horizontal frame geometry differ on the two date labels; embedded copy payload matches JSON.',
  deviceVerified:false, payloadBytes:Buffer.byteLength(payload), sha256:hash,
}, null, 2) + '\n');
console.log(JSON.stringify({changedLayers:ids, bytes:Buffer.byteLength(payload), sha256:hash, validation:'PASS'}));
