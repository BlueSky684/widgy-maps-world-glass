import {withMapMaskImageAppearedOff} from './map-mask-image-appeared-off.js?v=appeared-off-1';

// Captured independently from native Night group84020 and background84040,
// exported 2026-10-06 12:28 Asia/Jerusalem. Image source736 is different.
const groupAppearedOff = {b:0,a:[{d:747,a:-1,b:747,c:0}]};
const shapeAppearedOff = {a:[{d:747,a:-1,c:0,b:747}],b:0};
const flatten = nodes => nodes.flatMap(n => [n,...(Array.isArray(n['1']) ? flatten(n['1']) : [])]);

export function withMapMaskAppearedOff(persistent) {
  const widget = withMapMaskImageAppearedOff(persistent);
  const map = widget['1'].find(n => n.d0 === 84100);
  if (map?.z !== '13' || map.a !== true ||
      JSON.stringify(map['1'].map(n => n.d0)) !== '[84020,84010,84040]') throw Error('unexpected_map_group');
  const nodes = flatten(map['1']);
  if (nodes.length !== 7) throw Error('unexpected_map_children');
  for (const [id,type,effect] of [
    [84100,'13',groupAppearedOff], [84020,'13',groupAppearedOff],
    [84010,'13',groupAppearedOff], [84040,'2',shapeAppearedOff]
  ]) {
    const matches = [map,...nodes].filter(n => n.d0 === id);
    if (matches.length !== 1 || matches[0].z !== type || Object.hasOwn(matches[0],'r0'))
      throw Error('unexpected_map_node_' + id);
    matches[0].r0 = structuredClone(effect);
  }
  const title = widget['1'].find(n => n.d0 === 245)?.['1'].find(n => n.d0 === 84050);
  if (title?.['66']?.[0]?.['25'] !== 'PERSISTENT MASK') throw Error('unexpected_title');
  title['66'][0]['25'] = 'APPEARED OFF';
  widget['3'] = 'Widgy Map Mask Appeared Off 1';
  widget['4'] = 'Separate transition diagnostic derived from generated Persistent1. Set only the captured native Layer Appeared Transition Off field r0 on all eight map nodes: four images (source736), three groups and background (source747). Native group UI says Off disables all child animations; this inherited behavior is part of the test even though stored Auto/Interpolate content settings are unchanged. No explicit disappeared-transition field is added; existing reversed-In behavior is not independently verified. Same hierarchy, frames, blend effects, four cached image sources, three five-minute URL scripts, assets, server and Home/Calendar actions. Calendar stays blank. No location, accounts or health sources. This is not an iPhone performance result, atomic mask update or background refresh guarantee. Check full D/N composition without a black-day blink on Home returns, Calendar coverage, ordinary navigation speed and matching advancing D/N stamps. Preserve Persistent1 and the working Five Minute1.';
  return widget;
}
