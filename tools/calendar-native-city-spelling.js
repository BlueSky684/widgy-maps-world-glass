import assert from 'node:assert/strict';
import {flatten} from './compact-widget-structure.js';

export function withNativeCitySpelling(input) {
  assert.equal(input['3'], 'Widgy Calendar Compact Stable Test 1');
  assert.equal(flatten(input['1']).length, 1190);
  assert.equal(input['36'].length, 55);
  const widget=structuredClone(input), calendar=widget['1'].find(n=>n.d0===247);
  const row=calendar['1'].find(n=>n.d0===80337);
  const fallback=calendar['1'].find(n=>n.d0===81871);
  const prefix=widget['36'].find(v=>v['1']==='calendar_city_prefix');
  const native=widget['36'].find(v=>v['1']==='calendar_native_city');
  assert.deepEqual(row.o1, {'0':prefix['0'],'1':1,'2':''});
  assert.deepEqual(fallback.o1, {'0':prefix['0'],'1':0,'2':''});
  assert.deepEqual(fallback['1'].map(n=>n.o1), [
    {'0':native['0'],'1':1,'2':'Ashqelon'},
    {'0':native['0'],'1':0,'2':'Ashqelon'},
  ]);
  assert.deepEqual(fallback['1'][1]['66'],[
    {'5':'Custom Text','6':'Text','25':'Ashkelon, '},
    {'5':'Location','6':'Country'},
  ]);
  // Keep both original native-city/spelling branches, unchanged in their group.
  // Remove only the outer dependency on map-derived prefix and its competing row.
  delete fallback.o1;
  calendar['1']=calendar['1'].filter(n=>n!==row);
  widget['3']='Widgy Native City Spelling Test 1';
  widget['4']='Calendar city diagnostic on Compact Stable. Use the original native City/Country group with its existing conditional Ashqelon-to-Ashkelon correction. Remove only its outer map-derived prefix visibility gate and the competing map-prefix text row. All variables, Home/map/GPS, clock, gauges and Calendar data remain exact. Native spelling gate still needs phone verification; this is not a speed fix. Keep Compact Stable.';
  return widget;
}
