// Local-only preparation of a private native export. Never commit its input/output.
import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath || inputPath === outputPath) throw new Error('Provide different input/output paths');
const original = JSON.parse(readFileSync(inputPath, 'utf8'));
const widget = structuredClone(original);
const walk = nodes => nodes.flatMap(n => [n, ...(n.z === '13' ? walk(n['1']) : [])]);
assert.equal(walk(widget['1']).length, 1514, 'Unexpected full-widget baseline');
assert.equal(widget['0'], 29);
const maps = walk(widget['1']).filter(n => n.d0 === 82316);
assert.equal(maps.length, 1);
const map = maps[0];
assert.equal(map.z, '5');
assert.equal(map['1'], 'Javascript');
assert(map['22'].includes('${widgy.map_png_base64}'));
const priorMap = structuredClone(map);
const origin = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const provider = {
  '1': 'JSON Endpoint',
  '2': origin + '/assets/diagnostics/map-mask-compare-1/reference.png',
  '8': origin + '/tools/widgy-map-source.json',
  '9': 'GET',
  '11': {__widgy_auth_prefix: 'Bearer', __widgy_auth_header_name: 'Authorization'},
  '13': ['image']
};
delete map['3'];
delete map['22'];
Object.assign(map, provider);

const removeNames = new Set(['map_png_base64', 'map_request']);
const removed = widget['36'].filter(v => removeNames.has(v['1']));
assert.equal(removed.length, 2);
widget['36'] = widget['36'].filter(v => !removeNames.has(v['1']));
const withoutRemoved = JSON.stringify(widget);
for (const v of removed) {
  assert(!withoutRemoved.includes('${widgy.' + v['1'] + '}'), 'Variable still referenced by name');
  assert(!withoutRemoved.toLowerCase().includes(v['0'].toLowerCase()), 'Variable still referenced by UUID');
}
widget['3'] = 'Full Widget External Map Test 1';
widget['4'] = 'Test copy of the full widget using the prepared external map. Original layout, calendar, weather, fitness and navigation retained. The test map has fixed day/night and no personal location marker. Keep the original widget for normal use.';

// Exact whole-document comparison: only the verified image provider fields,
// the two unreferenced map variables and identifying metadata may differ.
const restored = structuredClone(widget);
const restoredMap = walk(restored['1']).find(n => n.d0 === 82316);
for (const k of [...Object.keys(provider), '3', '22']) {
  delete restoredMap[k];
  if (Object.hasOwn(priorMap, k)) restoredMap[k] = priorMap[k];
}
restored['36'] = structuredClone(original['36']);
restored['3'] = original['3'];
restored['4'] = original['4'];
assert.deepEqual(restored, original);
assert.equal(walk(widget['1']).length, 1514);
assert.equal(widget['36'].length, 80);
const encoded = JSON.stringify(widget);
writeFileSync(outputPath, encoded);
assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf8')), widget);
console.log(JSON.stringify({bytes:Buffer.byteLength(encoded),layers:1514,variables:80,
  removedVariables:[...removeNames],provider:'JSON Endpoint',allOtherContentPreserved:true}));
