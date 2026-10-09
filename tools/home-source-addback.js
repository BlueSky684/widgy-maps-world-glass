import {withLiveMapOnlyHome} from './live-map-only-home.js';
export function withHomeSourceAddback(full) {
  const {widget}=withLiveMapOnlyHome(full);
  widget['36']=structuredClone(full['36']);
  widget['3']='Widgy Home Source Addback Test 1';
  widget['4']='Paired with the fast Live Map Only Home Test 1: restore only its ten removed Home variable definitions, with original IDs, exact sources and ordering from Native City Spelling Test 2. Every layer, Home map/navigation, complete Calendar, city spelling/stacking, map/GPS/resolver and other tab remain identical to the fast control. Home still shows only the live map and navigation. Restored definitions have no visible consumers; their native evaluation is unverified. This tests definition presence, not all provider work during active Home display. No speed or root-cause claim.';
  return widget;
}
