import {withMapSyncRecovery} from './native-city-url.js?v=map-sync-recovery-1';

// Same current map/source pipeline as the full, phone-tested Sync Recovery.
// Unlike the old Map Only City control, retain EVERY variable definition.
export function withHomeSyncMapOnly(original){
  const widget=withMapSyncRecovery(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  const maps=home?.['1'].filter(n=>n.s==='Home Hero World Map');
  const navigation=new Set([5021,5022,5023,5024,5012,5013,80310,80311,5015,5016,5017,5018,6195,5020]);
  const retained=home?.['1'].filter(n=>navigation.has(n.d0));
  if(widget['36']?.length!==81 || maps?.length!==1 || maps[0].d0!==6170 ||
      maps[0].z!=='5' || maps[0]['1']!=='Web URL' || maps[0]['2']!=='${widgy.map_request}' ||
      retained?.length!==14 || new Set(retained.map(n=>n.d0)).size!==14 ||
      retained.filter(n=>n.z==='11').length!==4 ||
      retained.some(n=>n.z!=='11' && !/^(HOME|CALENDAR|WEATHER|FITNESS) Nav /.test(n.s)))
    throw Error('unexpected_template');
  home['1']=home['1'].filter(n=>n===maps[0] || navigation.has(n.d0));
  widget['3']='Widgy Home Sync Map Only 1';
  widget['4']='Temporary sparse-Home comparison against Widgy Map Sync Recovery 1, whose owner reports the map visible on all tested returns but Home still slow. Retain the exact current full-resolution live map layer, frame, GPS inputs, synchronous URL script, minute timestamp and all 81 variable definitions in original order. Retain 14 original Home navigation nodes and every other tab/document field. Remove only other Home display nodes, including their inline data bindings; name/description identify this test. Unlike the older Map Only City control, no Home variables are removed and no city lookup is restored. Map temporarily labels live coordinates; Calendar retains native city fallback. This tests removed Home display/source consumers and interactions, not variable evaluation by itself, network independence or a permanent design change. A fast result does not prove all unreferenced variables were evaluated. Compare after first map load in the same slot/network with Sync Recovery. Keep this private calendar export private.';
  return widget;
}
