import {withMapDirectLive} from './map-direct-live.js?v=map-direct-live-1';

// Isolate native variable-to-image binding, without JS, GPS or a changing URL.
export function withMapURLVariable(original,origin){
  const widget=withMapDirectLive(original,origin);
  const matches=original['36'].filter(v=>v['1']==='map_request');
  const source=matches[0];
  if(matches.length!==1 || source['0']!=='AD5D21AF-E1F3-486C-A001-000000000005' ||
      source['3']?.z!=='1' || !Array.isArray(source['3']['66']))throw Error('unexpected_template');
  const map=widget['1'].find(n=>n.d0===245)['1'].find(n=>n.d0===6170);
  const variable=JSON.parse(JSON.stringify(source));
  // Keep the existing variable identity/type/frame, but replace ALL sources.
  // The value is byte-identical to the immediate Direct Live control's URL.
  variable['3']['66']=[{'5':'Custom Text','6':'Text','25':map['2']}];
  widget['36']=[variable];
  map['2']='${widgy.map_request}';
  widget['3']='Widgy Map URL Variable 1';
  widget['4']='Temporary matched follow-up after Map Direct Live 1 was reported normal with no delays. Supply the exact same constant live-map URL through one native Custom Text variable named map_request and bind the existing image to that variable. No JavaScript, GPS, city lookup, timestamp or changing value. Keep 21 layers, image geometry/provider/cache flag/parent/order, navigation, static Calendar, all other document fields and the existing variable identity/type/frame. Full lossless 3306x1558 PNG, same endpoint/query and existing cache behavior; explicit empty lat/lon still prevent IP location. Only the single constant variable, image binding and identifying metadata differ. Tests verify the exported constant equals the direct URL; actual native resolution, refresh and transition timing require phone verification. A fast result does not prove dynamic sources are inexpensive, and a slow result does not prove all Widgy variables are slow. This is not the final location/city restoration.';
  return widget;
}
