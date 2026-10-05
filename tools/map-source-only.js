import {withMapMinimalPair} from './map-minimal-pair.js?v=map-minimal-pair-1';

// Active source consumer: merely retaining unused definitions could let Widgy
// skip them. Show the exact URL as plain native text; do not request the image.
export function withMapSourceOnly(original){
  const widget=withMapMinimalPair(original);
  const home=widget['1'].find(n=>n.d0===245);
  const index=home?.['1'].findIndex(n=>n.d0===6170);
  const map=home?.['1'][index],label=home?.['1'].find(n=>n.d0===5013);
  if(index<0 || map?.z!=='5' || map['1']!=='Web URL' || map['2']!=='${widgy.map_request}' ||
      label?.z!=='1' || label['1']!=='BarlowCondensed-Light' ||
      widget['36'].length!==5)throw Error('unexpected_template');
  // Reuse existing Custom Text variable substitution used throughout the
  // approved Steps/Calendar labels. This is neither a Web URL nor Web View.
  const text={z:'1',d0:map.d0,s:'Map URL Text (No Image Request)',
    '1':label['1'],'66':[{'5':'Custom Text','6':'Text','25':map['2']}],f:label.f};
  for(const key of ['b','c','d','e'])text[key]=structuredClone(map[key]);
  home['1'][index]=text;
  widget['3']='Widgy Map Source Only 1';
  widget['4']='Temporary source-consumption probe after Navigation Only 1 was reported immediate while Minimal Pair 1 still intermittently waits. Starting from Minimal Pair, replace only image6170 with a plain native Custom Text consumer of the exact same map_request variable. Preserve its frame, parent, ID and sibling position; reuse the existing Home label font/color. All five source definitions, synchronous script, four GPS substitutions/formatters, endpoint and minute timestamp remain exact. The completed map URL is displayed locally as text; this text layer does not request or decode an image and adds no geocoder. Twenty-one layers/five variables, same navigation and static Calendar test page. This does not assume text and image consumers have identical native scheduling, prove GPS latency or test image loading speed. Home intentionally shows a long URL instead of a map. Confirm resolved text before comparing transitions. The full widget and earlier controls remain intact.';
  return widget;
}
