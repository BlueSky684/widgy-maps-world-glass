import assert from 'node:assert/strict';
export function withNativeCityFront(input) {
  assert.equal(input['3'],'Widgy Native City Spelling Test 1');
  const widget=structuredClone(input), calendar=widget['1'].find(n=>n.d0===247);
  const row=calendar['1'].find(n=>n.d0===81871);
  const chrome=calendar['1'].find(n=>n.d0===80408);
  const date=calendar['1'].find(n=>n.d0===80338);
  assert(row&&chrome&&date&&!Object.hasOwn(row,'o1'));
  assert(calendar['1'].indexOf(row)>calendar['1'].indexOf(chrome));
  // Widgy paints earlier entries in front. Keep every field in the group exact.
  calendar['1']=calendar['1'].filter(n=>n!==row);
  calendar['1'].splice(calendar['1'].indexOf(date),0,row);
  widget['3']='Widgy Native City Spelling Test 2';
  widget['4']='Fix the confirmed Calendar location stacking error in Native City Spelling Test 1: move the existing city/spelling group in front of the opaque static background, alongside the date row. Every group field, source, spelling condition, variable, font, coordinate and all other layers remain exact. Dynamic native city with Ashkelon correction; Home/map/GPS untouched. Phone display confirmation required. No speed improvement claimed.';
  return widget;
}
