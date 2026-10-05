import {withHomeMapOnlyCity} from './widget-home-map-diagnostic.js?v=map-only-city-1';

// An isolated add-back to the previously fast Map Only City control.
// No data is fetched here. The owner browser supplies the personalized export.
export const RESTORED_HOME_VARIABLES=Object.freeze([
  'wx_status','wx_wind_speed','day_greeting','day_progress',
  'steps_today','steps_goal','steps_progress','steps_label',
  'calendar_home_count','calendar_home_event_word','calendar_home_title','calendar_home_meta'
]);

export function withHomeMapVariables(original){
  const widget=withHomeMapOnlyCity(original);
  const full=original['36'],sparse=widget['36'];
  const names=new Set(full.map(v=>v['1']));
  const ids=new Set(full.map(v=>v['0']));
  const retained=new Set(sparse.map(v=>v['1']));
  const restored=full.filter(v=>!retained.has(v['1'])).map(v=>v['1']);
  if(full.length!==81 || sparse.length!==69 || names.size!==81 || ids.size!==81 ||
      restored.length!==12 || !RESTORED_HOME_VARIABLES.every(name=>restored.includes(name)))
    throw Error('unexpected_template');
  // Restore original IDs, exact source definitions and original array order.
  // Do not add consumers: this checks definition presence, not the cost of
  // sources when referenced by visible layers. Widgy may evaluate them lazily.
  widget['36']=structuredClone(full);
  widget['3']='Widgy Home Map Variables 1';
  widget['4']='Compare with Widgy Home Map Only City Diagnostic. Exactly the same sparse Home, original full-resolution live map/city, navigation and all other tabs. Restore only the 12 original Home variable definitions in their original order (69 to 81), without adding visible consumers or changing sources. All other document fields match the map-only control except this name/description. A fast result does not prove that unused definitions were evaluated or that their visible consumers are cheap. No measured speed claim. Keep this private calendar export private.';
  return widget;
}
