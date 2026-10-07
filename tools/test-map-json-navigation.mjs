import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapStaticOnly} from './map-static-only.js';
import {withMapJsonNavigation} from './map-json-navigation.js';

const origin = 'https://example.test';
const template = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json', import.meta.url)));
const full = thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  origin + '/api/calendar-dots?token=unused-map-test', origin + '/api/calendar-widget?token=unused-map-test'))));
const before = structuredClone(full);
const control = withMapStaticOnly(full, origin);
const result = withMapJsonNavigation(full, origin);
assert.deepEqual(full, before);
const map = widget => widget['1'].find(n => n.d0 === 245)['1'].find(n => n.d0 === 6170);
const image = map(result);
const fields = ['1', '2', '8', '9', '11', '13'];
assert.deepEqual(Object.fromEntries(fields.map(k => [k, image[k]])), {
  '1': 'JSON Endpoint',
  '2': origin + '/assets/diagnostics/map-mask-compare-1/night.png',
  '8': origin + '/tools/widgy-map-source.json',
  '9': 'GET',
  '11': {__widgy_auth_prefix: 'Bearer', __widgy_auth_header_name: 'Authorization'},
  '13': ['image']
});
assert(!Object.hasOwn(image, '3'));
// Restore only the provider fields and identifying metadata; all navigation,
// layout, appearance and other document settings must match the fast control.
const restored = structuredClone(result);
for (const k of [...fields, '3']) delete map(restored)[k];
for (const k of ['1', '2', '3']) map(restored)[k] = map(control)[k];
restored['3'] = control['3'];
restored['4'] = control['4'];
assert.deepEqual(restored, control);
const walk = nodes => nodes.flatMap(n => [n, ...(n.z === '13' ? walk(n['1']) : [])]);
const nodes = walk(result['1']);
const ids = new Set(nodes.map(n => n.d0));
assert.equal(nodes.length, 21);
assert.equal(ids.size, 21);
assert.equal(nodes.filter(n => n.z === '5').length, 1);
assert.equal(nodes.filter(n => n.z === '11').length, 4);
assert.deepEqual(result['36'], []);
for (const n of nodes) if (n['1a']?.startsWith('button_')) {
  for (const id of n['1a'].slice(7).split(/[-,]/).map(Number)) assert(ids.has(id));
}
const serialized = JSON.stringify(result);
assert(!/\$\{widgy\.|token=|\/api\/|data:image|Javascript/.test(serialized));
assert(Buffer.byteLength(serialized) < 20000);
console.log('PASS: native provider fields, zero variables, input immutability, 21 unique layers, valid navigation actions, exact preserved frame/settings, no embedded image or private/calendar endpoints. Native performance remains unmeasured.');
