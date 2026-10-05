import {withMapStableGPS} from './map-stable-gps.js?v=map-stable-gps-1';

// Same stable location URL, with one opt-in bitmap timestamp diagnostic.
export function withMapRefreshClock(original,origin){
  const widget=withMapStableGPS(original,origin);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const query='atlas=r6&reuse=60';
  if(source['10'].split(query).length!==2)throw Error('unexpected_template');
  source['10']=source['10'].replace(query,query+'&diagnostic=refresh-v1');
  widget['3']='Widgy Map Refresh Clock 1';
  widget['4']='Temporary image-freshness diagnostic after Stable GPS1 was reported fast even after four idle minutes. Keep its21 layers/three variables, exact native coordinate sources/parser and time-stable image URL, no city. Add only constant diagnostic=refresh-v1 to the map query and rename the trial. The server burns MAP TIME with date/time in Asia/Jerusalem into the PNG during rendering, using exactly the same instant as solar pixels and X-Map-Rendered-At. It is not a separate clock layer, request-arrival time or timestamp painted onto an old cached map. The stamped PNG itself is cached for the existing private reuse60 lifetime with a separate diagnostic cache key; hits preserve its old stamp/ETag. No no-cache option, t suffix, forced reload, timer, request counter or new widget source. Full3306x1558 lossless PNG; small opaque diagnostic strip covers only part of the map temporarily. Compare the printed time before/after a normal four-minute idle Calendar return. An unchanged stamp means no newer render is displayed in that observation, not necessarily permanent freezing. Changed native coordinates may also cause a request; this does not prove unchanged-URL freshness under all conditions. Preserve the fast unlabelled control. Real location freshness, city and full Home remain separate gates.';
  return widget;
}
