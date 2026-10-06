// Image-only helper for the composition-wide map-mask-appeared-off diagnostic.
// Native Persistent1 export 2026-10-06 12:17 Asia/Jerusalem, image84011,
// following a screenshot-confirmed Layer Appeared Transition = Off.
// This is NOT Layer Contents Updated Animation or an explicit Out setting.
const imageAppearedOff = {b:0,a:[{d:736,a:-1,b:736,c:0}]};
const imageIDs = [84011,84012,84021,84022];

export function withMapMaskImageAppearedOff(persistent) {
  if (persistent?.['3'] !== 'Widgy Map Mask Persistent 1') throw Error('unexpected_baseline');
  const widget = structuredClone(persistent);
  const flatten = nodes => nodes.flatMap(n => [n,...(Array.isArray(n['1']) ? flatten(n['1']) : [])]);
  const nodes = flatten(widget['1']);
  for (const id of imageIDs) {
    const matches = nodes.filter(n => n.d0 === id);
    if (matches.length !== 1 || matches[0].z !== '5' || matches[0]['1'] !== 'Web URL' ||
        Object.hasOwn(matches[0], 'r0')) throw Error('unexpected_image_' + id);
    matches[0].r0 = structuredClone(imageAppearedOff);
  }
  return widget;
}
