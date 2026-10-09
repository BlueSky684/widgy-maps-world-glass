import assert from 'node:assert/strict';
import {flatten,variableReferences} from './compact-widget-structure.js';
const HOME_ONLY = new Set(['wx_status','wx_wind_speed','day_greeting','day_progress','steps_today','steps_label','calendar_home_count','calendar_home_event_word','calendar_home_title','calendar_home_meta']);
const NAV = new Set([5021,5022,5023,5024,5012,5013,80310,80311,5015,5016,5017,5018,6195,5020]);
export function withLiveMapOnlyHome(input) {
  assert.equal(input['3'],'Widgy Native City Spelling Test 2');
  const widget=structuredClone(input),home=widget['1'].find(n=>n.d0===245);
  const map=home['1'].find(n=>n.d0===6170);
  assert.equal(map['1'],'Web URL');assert.equal(map['2'],'${widgy.map_request}');
  const source=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
  assert.equal(source['6'],'Async + No main()');
  assert(source['10'].includes('reverse-geocode-client'));
  assert(source['10'].includes('city_cache_v1'));
  const before=flatten(home['1']).length;
  home['1']=home['1'].filter(n=>n===map||NAV.has(n.d0));
  assert.equal(home['1'].length,15);
  assert.equal(home['1'].filter(n=>n.z==='11').length,4);
  const removed=widget['36'].filter(v=>HOME_ONLY.has(v['1']));
  assert.equal(removed.length,10);
  widget['36']=widget['36'].filter(v=>!HOME_ONLY.has(v['1']));
  assert.equal(variableReferences(widget,removed).size,0,'Home definitions must not serve retained content');
  widget['3']='Widgy Live Map Only Home Test 1';
  widget['4']='User-requested isolation on Native City Spelling Test 2. Home retains only the exact live map and original navigation. Remove Home clock, date/greeting, events, weather/health, gauges, chrome/backgrounds and ten now-unreferenced Home-only definitions. Full Calendar including city stacking fix, Weather and Fitness tabs are unchanged. Original live map image/frame/options, precise GPS, async city resolver/cache, marker, minute refresh, day/night mask and full lossless resolution are unchanged. No static map or synthetic city. Tests the combined Home content/source group, not a proven individual bottleneck. Keep the full Home control.';
  return {widget,audit:{homeNodesBefore:before,homeNodesAfter:15,layers:flatten(widget['1']).length,variables:widget['36'].length,removedVariables:removed.map(v=>v['1'])}};
}
