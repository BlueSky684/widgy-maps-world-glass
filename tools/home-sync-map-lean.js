import {withHomeSyncMapOnly} from './home-sync-map-only.js?v=home-sync-map-only-1';

const HOME_ONLY_VARIABLES=new Set([
  'wx_status','wx_wind_speed','day_greeting','day_progress',
  'steps_today','steps_goal','steps_progress','steps_label',
  'calendar_home_count','calendar_home_event_word','calendar_home_title','calendar_home_meta'
]);

// Paired with the current sparse Sync Map Only, not the older async city trial.
// Delete definitions only after checking every remaining field for references.
export function withHomeSyncMapLean(original){
  const widget=withHomeSyncMapOnly(original),variables=widget['36'];
  const removed=variables.filter(v=>HOME_ONLY_VARIABLES.has(v['1']));
  if(variables.length!==81 || new Set(variables.map(v=>v['1'])).size!==81 ||
      new Set(variables.map(v=>v['0'])).size!==81 || removed.length!==12 ||
      removed.some(v=>typeof v['0']!=='string' || !v['0']))throw Error('unexpected_template');
  widget['36']=variables.filter(v=>!HOME_ONLY_VARIABLES.has(v['1']));
  const remaining=JSON.stringify(widget),lower=remaining.toLowerCase();
  for(const v of removed)if(remaining.includes('${widgy.'+v['1']+'}') ||
      lower.includes(v['0'].toLowerCase()))throw Error('unexpected_template');
  widget['3']='Widgy Home Sync Map Lean 1';
  widget['4']='Temporary paired comparison with Widgy Home Sync Map Only 1. Remove only 12 unreferenced Home variable definitions: two weather, greeting/day progress, four steps and four Home calendar fields (81 to 69). Every remaining variable keeps its exact ID, source and order. Every layer, map image, synchronous URL/GPS pipeline, minute refresh, full lossless resolution, native Calendar city fallback, navigation, other tab and remaining document field is identical; only name/description additionally change. Both copies intentionally show only map/navigation in Home, with coordinates instead of map city. This tests presence of the unused definition group; it does not establish that Widgy evaluated it or diagnose a provider. Retest after first map load in the same slot/network. No speed claim, permanent deletion from the full Home, or production promotion. Keep this private calendar export private.';
  return widget;
}
