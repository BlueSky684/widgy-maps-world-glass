import {withMapGPSPair} from './map-gps-pair.js?v=map-gps-pair-1';

// Matched location-path control: render a marker, without native location reads.
export function withMapFixedMarker(original,origin){
  const widget=withMapGPSPair(original,origin);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  for(const name of ['map_latitude_max5','map_longitude_max5']){
    const binding='"'+'$'+'{widgy.'+name+'}"';
    if(source['10'].split(binding).length!==2)throw Error('unexpected_template');
    source['10']=source['10'].replace(binding,JSON.stringify('0'));
  }
  widget['36']=widget['36'].filter(v=>v['1']==='map_request');
  widget['3']='Widgy Map Fixed Marker 1';
  widget['4']='Temporary matched control after Map GPS Pair 1 developed a small delay after several idle minutes, then improved with repeated use. Use explicit synthetic coordinates 0,0 instead of the two native coordinate bindings and remove those two native definitions. Retain the exact coordinate parser, synchronous script kind, minute t suffix, map_request identity/image binding, all 21 layers, image settings and navigation. One variable. The marker deliberately appears at 0,0 south of West Africa, never at the owner location. The map still uses current server time and the existing live renderer, full lossless3306x1558 PNG and existing private client cache/CDN no-store; no synthetic-CDN flag, city, geocoder, native GPS source, private export or backend change. This separates the fixed marked-image path from native location dependencies and changing coordinates, but does not isolate GPS hardware, guarantee identical PNG bytes/cache warmth or prove a cold-start cause. Earlier fixed-coordinate tests in the large widget were inconclusive and remain recorded. Compare the first return after natural phone inactivity with subsequent transitions; real dynamic location and city remain required for the final widget.';
  return widget;
}
