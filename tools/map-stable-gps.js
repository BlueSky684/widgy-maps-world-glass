import {withMapGPSPair} from './map-gps-pair.js?v=map-gps-pair-1';

// Native location remains dynamic; time alone no longer changes image identity.
export function withMapStableGPS(original,origin){
  const widget=withMapGPSPair(original,origin);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const suffix=" + '&t=' + stamp;";
  if(source['10'].split(suffix).length!==2)throw Error('unexpected_template');
  source['10']=source['10'].replace(suffix,';');
  widget['3']='Widgy Map Stable GPS 1';
  widget['4']='Temporary matched dynamic-location follow-up after Stable Marker1 was reported free of delays even after four idle minutes. Same21 layers/full3306x1558 lossless live map/renderer/navigation/static Calendar. Compared with GPS Pair1 remove only the emitted &t=stamp suffix and rename the trial; original primary native coordinate definitions, identities, formatting and strict parser are unchanged. Compared with Stable Marker1 restore only those two definitions and native inputs. Three variables. Retain clock/stamp work as in both controls; unchanged coordinates yield identical URLs across time, changed valid coordinates still change URL without new rounding. Missing/invalid coordinates remain explicitly empty without IP fallback. No legacy GPS pair, city, geocoder, async/fetch/timers or backend/cache-policy/provider change. Current server time still drives actual renders; a stable URL does not guarantee Widgy refetches or that day/night/location are fresh. Confirm the expected real marker, compare after four idle minutes, then separately verify freshness before adopting or restoring city/full Home. Earlier no-improvement large-widget stable-URL trial and fast no-location minute-URL result remain contrary evidence; no unique cause or complete fix is established.';
  return widget;
}
