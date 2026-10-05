import {withHomeSyncMapLean} from './home-sync-map-lean.js?v=home-sync-map-lean-1';

// Map-only work on the owner's current Lean control. Backend TTL/ETag already
// govern age; t is ignored by the renderer/cache key but changes the client URL.
export function withMapCacheURL(original){
  const widget=withHomeSyncMapLean(original);
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  const stamp="    var instant = Date.now();\n    var stamp = reuseSeconds === 60 ? Math.floor(instant / 60000) * 60000 : instant;\n";
  const suffix=" + '&t=' + stamp";
  if(source['5']!=='Javascript' || source['6']!=='Script' ||
      source['10'].split(stamp).length!==2 || source['10'].split(suffix).length!==2 ||
      !source['10'].includes('reuse=60'))throw Error('unexpected_template');
  source['10']=source['10'].replace(stamp,'').replace(suffix,'');
  widget['3']='Widgy Map Cache URL 1';
  widget['4']='Map-first trial based on Home Sync Map Lean 1, retaining its 69 variables, 1289 layers, sparse Home and all other tabs. Change only map_request script to omit the minute t suffix; at unchanged coordinates the map URL stays identical across time. Preserve synchronous mode, native GPS precision/validation, unavailable-coordinate handling, renderer endpoint, private reuse=60 policy, full 3306x1558 lossless PNG and image layer/frame. Coordinate changes still change the URL. Backend uses current server time, not t. Private max-age/ETag allow reuse but actual Widgy cache behavior and automatic day/night refresh with a stable URL require phone verification; no guarantee of retained-last-good image, fixed latency or a completed repair. Prior stable-URL trial on a different full baseline gave slight subjective benefit only. Do not restore other Home data yet. Compare with Lean after first load and again after waiting; report stalls and missing/stale maps. Keep this private calendar export private.';
  return widget;
}
