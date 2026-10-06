import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMaskLive} from './map-mask-live.js';
import {withMapMaskImageAppearedOff} from './map-mask-image-appeared-off.js';

const html = readFileSync(new URL('./widgy-map-mask-persistent-1.html',import.meta.url),'utf8');
const source = html.split('// BEGIN PERSISTENT TRANSFORM')[1].split('\n').slice(1).join('\n').split('// END PERSISTENT TRANSFORM')[0];
const context = {structuredClone};
vm.runInNewContext(source,context);
const origin = 'https://example.test';
const template = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const persistent = structuredClone(context.persistentMask(withMapMaskLive(thinNativeStepsRing(compactCalendarDots(consolidateWidget(
  personalizedWidget(template,origin+'/api/calendar-dots?token=unused-mask-test',origin+'/api/calendar-widget?token=unused-mask-test')
))),origin)));
const before = structuredClone(persistent);
const changed = withMapMaskImageAppearedOff(persistent);
assert.deepEqual(persistent,before);
const flatten = nodes => nodes.flatMap(n => [n,...(Array.isArray(n['1']) ? flatten(n['1']) : [])]);
const patched = flatten(changed['1']).filter(n => Object.hasOwn(n,'r0'));
assert.deepEqual(patched.map(n => n.d0).sort(),[84011,84012,84021,84022]);
for (const node of patched) {
  assert.equal(node.z,'5');
  assert.deepEqual(node.r0,{b:0,a:[{d:736,a:-1,b:736,c:0}]});
  delete node.r0;
}
// Entire-document equality after removing only the four observed effect fields:
// no geometry, grouping, provider, URL, variable, tap, blend or content-animation change.
assert.deepEqual(changed,before);
const invalid = structuredClone(before);
flatten(invalid['1']).find(n => n.d0 === 84011).z = '13';
assert.throws(() => withMapMaskImageAppearedOff(invalid),/unexpected_image_84011/);
assert.throws(() => withMapMaskImageAppearedOff(withMapMaskImageAppearedOff(before)),/unexpected_image_/);
console.log('PASS: native image Off mapping; exact four-field isolation; input unchanged; reject wrong types/existing effects.');
