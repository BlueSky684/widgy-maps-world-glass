import {withMapMinimalPair} from './map-minimal-pair.js?v=map-minimal-pair-1';

// Negative control for the intermittent stalls still reported in Minimal Pair.
// Remove the complete map consumer/source group, not another URL/cache variant.
export function withNavigationOnly(original){
  const widget=withMapMinimalPair(original);
  const home=widget['1'].find(n=>n.d0===245);
  const maps=home?.['1'].filter(n=>n.d0===6170);
  if(maps?.length!==1 || maps[0].z!=='5' || maps[0]['2']!=='${widgy.map_request}' ||
      widget['36'].length!==5)throw Error('unexpected_template');
  home['1']=home['1'].filter(n=>n.d0!==6170);
  const removed=widget['36'];
  widget['36']=[];
  widget['3']='Widgy Navigation Only 1';
  widget['4']='Temporary negative control for Map Minimal Pair 1 after intermittent pre-Home waiting remains. Remove only its map image and all five map/GPS variable definitions, plus update this name/description. Preserve every other layer, source, navigation action, frame, font, color and document setting exactly. Home is intentionally empty except Home/Calendar navigation. Calendar retains its static CALENDAR TEST title and native graphite background. Twenty layers, zero variables, no remaining image layer, JavaScript source, native location source or calendar data. Existing font resource metadata remains, so this is not a guarantee of zero OS/network activity. No permanent change to the full widget, speed guarantee, city restoration or proof of a Widgy bug. Compare repeated two-way transitions in the same slot/network against Minimal Pair 1.';
  const serialized=JSON.stringify(widget),lower=serialized.toLowerCase();
  if(serialized.includes('${widgy.'))throw Error('unexpected_template');
  for(const v of removed)if(lower.includes(v['0'].toLowerCase()))throw Error('unexpected_template');
  return widget;
}
