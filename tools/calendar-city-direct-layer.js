import {flatten, variableReferences} from './compact-widget-structure.js';
import {calendarCityFromMap} from './calendar-shared-city.js';

// Compatibility/performance probe, not a replacement for the normal export.
// No persistent JS storage or native scheduling behavior is assumed.
export function withCalendarCityDirectLayer(input) {
  const ensure = (ok, message) => { if (!ok) throw Error(message); };
  ensure(input['3'] === 'Widgy Calendar Compact Stable Test 1', 'Unexpected baseline');
  const widget = structuredClone(input), nodes = flatten(widget['1']);
  ensure(nodes.length === 1190 && widget['36'].length === 55, 'Unexpected structure');
  const findVariable = name => {
    const matches = widget['36'].filter(v => v['1'] === name);
    ensure(matches.length === 1, 'Unexpected variable ' + name);
    return matches[0];
  };
  const prefix = findVariable('calendar_city_prefix');
  const nativeCity = findVariable('calendar_native_city');
  const map = findVariable('map_request');
  const script = calendarCityFromMap.toString() +
    '\nfunction main() { return calendarCityFromMap("${widgy.map_request}"); }';
  const sources = prefix['3']['66'];
  ensure(sources.length === 1 && sources[0]['5'] === 'Javascript' &&
    sources[0]['6'] === 'Script' && sources[0]['10'] === script, 'Unexpected city parser');
  ensure(map['3']['66'][0]['6'] === 'Async + No main()' &&
    map['3']['66'][0]['10'].includes('city_cache_v1=read'), 'Unexpected map source');
  const calendar = widget['1'].find(n => n.d0 === 247 && n.z === '13');
  const location = nodes.find(n => n.d0 === 80337);
  const fallback = nodes.find(n => n.d0 === 81871);
  ensure(calendar && location?.z === '1' && fallback?.z === '13', 'Missing city layers');
  ensure(calendar['1'].includes(location) && calendar['1'].includes(fallback), 'Unexpected city parents');
  ensure(JSON.stringify(location['66']) === JSON.stringify([
    {'5':'Custom Text','6':'Text','25':'${widgy.calendar_city_prefix}'},
    {'5':'Location','6':'Country'}]), 'Unexpected city display');
  ensure(location.o1?.['0'] === prefix['0'] && location.o1['1'] === 1 && location.o1['2'] === '' &&
    fallback.o1?.['0'] === prefix['0'] && fallback.o1['1'] === 0 && fallback.o1['2'] === '', 'Unexpected city visibility');
  ensure(fallback['1'].length === 2 && fallback['1'][0].d0 === 81869 &&
    fallback['1'][1].d0 === 81870, 'Unexpected fallback');
  location['66'][0] = structuredClone(sources[0]);
  delete location.o1;
  // This explicit probe has no alternate city provider. If the map city is
  // unavailable, the script emits empty text and the native country remains.
  // That transient behavior differs from the baseline and is a phone gate.
  calendar['1'] = calendar['1'].filter(n => n !== fallback);
  widget['36'] = widget['36'].filter(v => v !== prefix && v !== nativeCity);
  ensure(variableReferences(widget, [prefix, nativeCity]).size === 0, 'Remaining city references');
  widget['3'] = 'Widgy Calendar Direct City Test 1';
  widget['4'] = 'One isolated trial: Calendar parses the existing map URL directly in its text layer. Same Home, live map, exact GPS, clock, native gauges and Calendar design. The intermediary city variables and their fallback layers are removed. If the map city is unavailable, only the native country is shown. Native binding and speed are unverified; keep Calendar Compact Stable Test 1.';
  return widget;
}
