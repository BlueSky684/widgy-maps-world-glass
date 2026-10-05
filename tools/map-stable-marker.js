import {withMapFixedMarker} from './map-fixed-marker.js?v=map-fixed-marker-1';

// Change only the emitted URL suffix. Keep clock work to isolate URL identity.
export function withMapStableMarker(original,origin){
  const widget=withMapFixedMarker(original,origin);
  const source=widget['36'][0]['3']['66'][0],suffix=" + '&t=' + stamp;";
  if(source['10'].split(suffix).length!==2)throw Error('unexpected_template');
  source['10']=source['10'].replace(suffix,';');
  widget['3']='Widgy Map Stable Marker 1';
  widget['4']='Temporary matched control after Fixed Marker1 also developed a delay after about one idle minute, then improved with repeat transitions. Keep its exact synthetic0,0 marked full-size live PNG path and all21 layers/one synchronous map_request variable. Remove only the appended &t=stamp expression from the returned image URL; deliberately retain Date.now/minute-stamp calculations to isolate emitted URL identity rather than also simplifying script evaluation. No GPS, city, geocoder, new data, provider/backend/cache-policy/TTL change or synthetic-CDN flag. Existing server renders current time and private cache expires at most60 seconds after render. Stable URL does not promise fresh requests, retained images, instantaneous transitions or current day/night pixels in Widgy; device refresh behavior remains unverified. Compare first Home return after the same idle minute with warm repeats. Prior no-delay Minute URL result and older no-improvement large-widget Cache URL trial remain contrary evidence; this is a new small matched idle comparison, not a proven fix. Final real location and city remain required.';
  return widget;
}
