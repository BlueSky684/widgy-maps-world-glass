import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {allNodes} from './build-widgy-v110.mjs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const write = (name, value) => writeFileSync(new URL(name, import.meta.url), value);
const before = JSON.parse(read('widgy-v110.json'));
const data = structuredClone(before);
const nodes = allNodes(data);
const changed = new Set();
const measurements = [];

// Compare card bounds, excluding the master image's surrounding margin:
// master card approximately (45, 48, 1134, 1182), device card (0, 0, 1134, 1182).
// Widgy's 1600-square coordinate system maps to this rectangular device export.
// Values below are native frames, calibrated from the v110 screenshot's ink bounds.
function frame(id, x, y, width, height) {
  const node = nodes.find(n => n.d0 === id);
  assert(node, `Missing header layer ${id}`);
  const original = Object.fromEntries(['b', 'c', 'd', 'e'].map(k => [k, node[k].a[0].a]));
  for (const [key, value] of Object.entries({b: x, c: y, d: width, e: height})) {
    node[key].a[0].a = value;
  }
  measurements.push({id, name: node.s, before: original, after: {b:x, c:y, d:width, e:height}});
  changed.add(id);
  return node;
}

frame(6101, 60, 34, 285, 170);
for (const id of [6102, 80103, 80104, 80105]) frame(id, 347, 34, 665, 170);
const weekday = frame(6103, 1118, 58, 260, 66);
const month = frame(6104, 1129, 109, 248, 72);
frame(6105, 1428, 27, 130, 185);
frame(6190, 1400, 72, 2, 103);

// Use the already verified native Javascript source format. Explicit English
// arrays keep the master's uppercase typography independent of device locale.
const weekdays = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
function calendarScript(words, getter) {
  return `function main() {\n  return ${JSON.stringify(words)}[new Date().${getter}()];\n}`;
}
weekday['66'] = [{'5':'Javascript', '6':'Script', '10':calendarScript(weekdays, 'getDay')}];
month['66'] = [{'5':'Javascript', '6':'Script', '10':calendarScript(months, 'getMonth')}];
data['3'] = 'Widgy Home v111 - Master Header Alignment';
data['4'] = before['4'] + ' v111 adjusts only header typography and geometry against the approved master card: greeting height +10.4%, compact uppercase weekday/month, larger numeric date and repositioned divider. Existing native fonts and colors are retained. English weekday/month use local Date Javascript. Exact iOS glyph rendering still requires an imported-widget screenshot.';

// A scope check protects the established weather logic, variables and native
// drawings, including the dynamic day-progress layers, from accidental edits.
const restored = structuredClone(data);
const restoredNodes = allNodes(restored);
for (const node of allNodes(before)) {
  if (!changed.has(node.d0)) continue;
  const target = restoredNodes.find(n => n.d0 === node.d0);
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, structuredClone(node));
}
restored['3'] = before['3'];
restored['4'] = before['4'];
assert.deepEqual(restored, before);
assert.deepEqual(data['36'], before['36']);

// Check calendar rollovers, all weekdays and all months with a controlled local
// date. This checks the only changed data sources, without retesting old logic.
for (const date of [
  ...Array.from({length:7}, (_, day) => new Date(2026, 8, 20 + day, 12)),
  ...Array.from({length:12}, (_, m) => new Date(2026, m, 15, 12)),
  new Date(2026, 11, 31, 23, 59), new Date(2027, 0, 1, 0, 0),
]) {
  class TestDate extends Date { constructor() { super(date.getTime()); } }
  assert.equal(runInNewContext(weekday['66'][0]['10'] + '\nmain()', {Date:TestDate}), weekdays[date.getDay()]);
  assert.equal(runInNewContext(month['66'][0]['10'] + '\nmain()', {Date:TestDate}), months[date.getMonth()]);
}

const payload = JSON.stringify(data);
const hash = createHash('sha256').update(payload).digest('hex');
const packed = gzipSync(Buffer.from(payload)).toString('base64');
const html = read('widgy-v110.html').replaceAll('v110', 'v111')
  .replace('ברכה לפי השעה והתקדמות היום מחצות עד חצות.', 'התאמת הברכה ובלוק התאריך למאסטר המאושר.')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/, `const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/, `const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/, `packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/, `text.length!==${payload.length}`);
assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1], 'base64')).toString(), payload);
write('widgy-v111.json', payload);
write('widgy-v111.html', html);
write('widgy-v111-integration.json', JSON.stringify({
  status:'ready-for-device-verification',
  base:'v110, verified by user at night and next morning',
  reference:'Approved master supplied 2026-09-22; card bounds exclude surrounding margin',
  measurements,
  unchanged:'All non-header layers, variables, weather rules, day progress, fonts and colors',
  validation:'Full unrelated-data equality; all seven weekdays and twelve months; year rollover; copy-page payload equality',
  deviceVerified:false,
  payloadBytes:Buffer.byteLength(payload), sha256:hash,
}, null, 2) + '\n');
console.log(JSON.stringify({changedHeaderLayers:changed.size, bytes:Buffer.byteLength(payload), sha256:hash, validation:'PASS'}));
