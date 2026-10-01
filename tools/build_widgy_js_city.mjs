import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const original = read('./Widgy_Home_Glass.json');
const widget = structuredClone(original);
const native = read('./widgy-native-max5-source.json');
const origin = new URL(process.argv[2]);
assert(origin.protocol === 'https:' && origin.pathname === '/' && !origin.search && !origin.hash);

// Review copy: external location lookup is OFF until the user approves sending
// current precise coordinates to BigDataCloud. Existing dashboard is untouched.
const lookupEnabled = false;
for (const [index, name, field] of [
  [1, 'map_latitude_max5', 'Latitude (Decimal)'],
  [2, 'map_longitude_max5', 'Longitude (Decimal)'],
]) {
  const template = original['36'].find(v => v['1'] === (index === 1 ? 'Latitude' : 'Longitude'));
  assert(template);
  const variable = structuredClone(template);
  variable['0'] = `C5D5F231-73AF-48A7-B002-${String(index).padStart(12, '0')}`;
  variable['1'] = name;
  variable['2'] = 0;
  variable['3'].s = 'Variable: ' + name;
  variable['3']['66'] = [{'5': 'Location', '6': field}];
  variable['3'][native.propertyKey] = structuredClone(native.max5);
  widget['36'].push(variable);
}
const request = widget['36'].find(v => v['1'] === 'map_request');
assert(request);
request['3']['66'] = [{'5': 'Javascript', '6': 'Async + No main()',
  '10': buildCityMapScript(origin.origin + '/api/night-map?mode=live&width=3306&presentation=glass', {enabled: lookupEnabled})}];
widget['3'] = 'Widgy Home Glass JS City Review';
widget['4'] = 'Review copy. BigDataCloud lookup DISABLED pending permission. Max 5 coordinate inputs verified outside the editor in IMG_9648. Proposed phone-side async reverse geocoding bypasses the empty native City JS binding. Network flow and async map URL still need device verification. Uses existing coarse map inputs while disabled. Approved map assets and one-decimal display unchanged. Calendar remains demo data.';
assert.deepEqual(widget['1'], original['1']);
assert.deepEqual(widget['2'], original['2']);
assert.equal(widget['36'].length, original['36'].length + 2);
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_Review.json', import.meta.url), JSON.stringify(widget));
console.log('Built JS City review copy; external lookup OFF; original dashboard and all visual layers unchanged.');
