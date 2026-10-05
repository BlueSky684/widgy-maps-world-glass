import {withMapStaticOnly} from './map-static-only.js?v=map-static-only-1';

// Matched to the fast static-image control: change only the image URL and
// document metadata. Explicit empty coordinates suppress IP-derived location.
export function withMapDirectLive(original,origin){
  const widget=withMapStaticOnly(original,origin);
  const map=widget['1'].find(n=>n.d0===245)?.['1'].find(n=>n.d0===6170);
  if(map?.['2']!==origin+'/assets/diagnostics/Home_Map_Static_3306x1558.png' ||
      widget['36'].length!==0)throw Error('unexpected_template');
  map['2']=origin+'/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&lat=&lon=';
  widget['3']='Widgy Map Direct Live 1';
  widget['4']='Temporary matched follow-up to fast Map Static Only 1. Only the image URL and document metadata change: use the existing same-origin night-map endpoint, current server time, full lossless 3306x1558 PNG, glass/r6 and existing reuse=60. Explicit empty lat/lon suppress IP location; no marker or city. Keep the same 21 layers, zero variables/JavaScript/native GPS/calendar sources, image frame/provider/cache flag/ID/parent/order, navigation and static Calendar. No timestamp/cache-buster, fixed time, synthetic CDN flag, new provider, backend or cache-policy change. This compares static delivery with the server-generated image path, including different time-dependent pixels and cache behavior. It cannot alone separate render, network, decode or Widgy scheduling. A constant URL does not guarantee a new request or fresh pixels on each tab switch; native refresh remains unverified. Confirm the whole map before judging speed. Final functionality will restore live location/city after isolation.';
  return widget;
}
