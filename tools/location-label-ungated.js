import assert from 'node:assert/strict';
// Diagnostic: preserve the shared location variable and all its existing inputs.
// Remove only the two alternative native fallback groups and the label guards.
export function withLocationLabelUngated(input) {
 const w=structuredClone(input);
 for(const [groupId,fallbackId,textId] of [[247,81871,83204],[246,84006,84013]]) {
  const group=w['1'].find(n=>n.d0===groupId);
  assert(group['1'].some(n=>n.d0===fallbackId));
  const text=group['1'].find(n=>n.d0===textId);assert(text);
  assert.equal(text['66'][0]['25'],'${widgy.calendar_location_pair}');
  assert.equal(text.o1['0'],w['36'].find(v=>v['1']==='calendar_location_pair')['0']);
  delete text.o1;
  group['1']=group['1'].filter(n=>n.d0!==fallbackId);
 }
 return w;
}
