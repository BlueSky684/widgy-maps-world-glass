import assert from 'node:assert/strict';
import {flatten} from './compact-widget-structure.js';

export function withNativeCityUngated(input) {
  assert.equal(input['3'], 'Widgy Calendar Compact Stable Test 1');
  assert.equal(flatten(input['1']).length, 1190);
  assert.equal(input['36'].length, 55);
  const widget = structuredClone(input);
  const calendar = widget['1'].find(n => n.d0 === 247);
  const row = calendar['1'].find(n => n.d0 === 80337);
  const fallback = calendar['1'].find(n => n.d0 === 81871);
  const native = fallback['1'].find(n => n.d0 === 81869);
  const prefix = widget['36'].find(v => v['1'] === 'calendar_city_prefix');
  assert.deepEqual(row.o1, {'0':prefix['0'], '1':1, '2':''});
  assert.deepEqual(fallback.o1, {'0':prefix['0'], '1':0, '2':''});
  assert.deepEqual(native['66'], [
    {'5':'Location','6':'City'},
    {'5':'Custom Text','6':'Text','25':', '},
    {'5':'Location','6':'Country'},
  ]);
  row['66'] = structuredClone(native['66']);
  delete row.o1;
  calendar['1'] = calendar['1'].filter(n => n !== fallback);
  widget['3'] = 'Widgy Native City Ungated Test 1';
  widget['4'] = 'City-display diagnostic based on Compact Stable. Only the Calendar location row reads native City and Country without variable visibility gates; remove its overlapping fallback group. All variables, Home, full-resolution live map, GPS, clock, gauges and Calendar data/navigation are unchanged. Native spelling may be Ashqelon and need not match the map resolver. Temporary diagnostic, not an approved city replacement or speed fix. Keep Compact Stable.';
  return widget;
}
