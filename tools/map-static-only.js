import {withMapMinimalPair} from './map-minimal-pair.js?v=map-minimal-pair-1';

// Full-size image consumer without native GPS/JS or on-request map rendering.
// Reuse the existing public fixed-time diagnostic PNG, never the smaller asset.
export function withMapStaticOnly(original,origin){
  const base=new URL(origin);
  if(base.protocol!=='https:' || base.origin!==origin)throw Error('invalid_origin');
  const widget=withMapMinimalPair(original);
  const home=widget['1'].find(n=>n.d0===245),map=home?.['1'].find(n=>n.d0===6170);
  if(map?.z!=='5' || map['1']!=='Web URL' || map['2']!=='${widgy.map_request}' ||
      widget['36'].length!==5)throw Error('unexpected_template');
  map['2']=new URL('/assets/diagnostics/Home_Map_Static_3306x1558.png',base).href;
  const removed=widget['36'];
  widget['36']=[];
  widget['3']='Widgy Map Static Only 1';
  widget['4']='Temporary image-only probe on the minimal two-screen baseline, after Navigation Only 1 and Map Source Only 1 were reported without waiting. The original image layer/frame/provider/cache flag/parent/order remain; its Web URL is now the direct same-origin public Home_Map_Static_3306x1558.png. Remove all five map/GPS definitions. Twenty-one layers, zero variables/JavaScript/location/calendar sources. The existing full-resolution lossless PNG has a fixed 2026-10-04 06:00 UTC day/night image with no personal marker or city. No shrinking, re-encoding, data URL, renderer/API change or new provider. All other fields/navigation/fonts remain exact. This tests the combined static-image delivery/cache/decode/display path; a fast or slow result does not alone isolate networking, server computation, memory or a Widgy bug. Confirm the whole map appears before judging speed. This fixed image is a temporary test, not the final live map.';
  const serialized=JSON.stringify(widget),lower=serialized.toLowerCase();
  if(serialized.includes('${widgy.'))throw Error('unexpected_template');
  for(const v of removed)if(lower.includes(v['0'].toLowerCase()))throw Error('unexpected_template');
  return widget;
}
