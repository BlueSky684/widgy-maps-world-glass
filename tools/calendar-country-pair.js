import assert from 'node:assert/strict';
import {flatten} from './compact-widget-structure.js';

// Read a paired label supplied by the existing map observation, never perform
// another fetch in Calendar. No timer/storage/URL API is needed in native JS.
export function calendarLocationPair(url) {
  var value = String(url);
  function field(name) {
    var parts = value.split(new RegExp('[?&]' + name + '='));
    if (parts.length !== 2) return '';
    try { return decodeURIComponent(parts[1].split(/[&#]/)[0]); } catch (error) { return ''; }
  }
  var country = field('country_name'), city = field('city');
  var time = Number(field('city_cache_time')), age = Date.now() - time;
  if (!city || !country || !time || age < 0 || age >= 3600000) return '';
  city = Array.from(city.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 80).join('');
  country = Array.from(country.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 100).join('');
  if (/^Ashqelon$/i.test(city)) city = 'Ashkelon';
  return city && country ? city + ', ' + country : '';
}

export function withCalendarCountryPair(input, scope) {
  assert.equal(input['3'], 'Widgy Home Direct Data 1');
  assert.match(scope, /^[a-f0-9]{32}$/);
  const widget = structuredClone(input), nodes = flatten(widget['1']);
  assert.equal(nodes.length, 1187); assert.equal(widget['36'].length, 61);
  const variable = name => {
    const matches = widget['36'].filter(v => v['1'] === name);
    assert.equal(matches.length, 1); return matches[0];
  };
  const source = variable('map_request')['3']['66'][0];
  assert.equal(source['6'], 'Async + No main()');
  let runtime = source['10'];
  const replace = (from, to) => { assert.equal(runtime.split(from).length, 2, 'Unexpected runtime anchor'); runtime = runtime.replace(from, to); };
  replace('var finished = false, cityObservedAt = 0;', "var finished = false, cityObservedAt = 0, countryName = '';\n  function country(value) {\n    return typeof value === 'string' ? Array.from(value.replace(/[\\u0000-\\u001f\\u007f]/g, '').trim()).slice(0, 100).join('') : '';\n  }");
  assert.equal((runtime.match(/city_cache_scope=[a-f0-9]{32}/g) || []).length, 1);
  runtime = runtime.replace(/city_cache_scope=[a-f0-9]{32}/, 'city_cache_scope=' + scope);
  runtime = runtime.replaceAll('__homeGlassCityV1', '__homeGlassCityCountryV1');
  replace(" + '&t=' + stamp +", " + (city && countryName ? '&country_name=' + encodeURIComponent(countryName) : '') + '&t=' + stamp +");
  replace('      cityObservedAt = saved.time;', '      countryName = country(saved.countryName);\n      cityObservedAt = saved.time;');
  replace('      cityObservedAt = city ? Date.now() : 0;', '      countryName = country(data.countryName);\n      cityObservedAt = city ? Date.now() : 0;');
  replace('      cityObservedAt = saved.observedAt;', '      countryName = country(saved.countryName);\n      cityObservedAt = saved.observedAt;');
  assert.equal(runtime.split('city:city, time:cityObservedAt').length, 3);
  runtime = runtime.replaceAll('city:city, time:cityObservedAt', 'city:city, countryName:countryName, time:cityObservedAt');
  source['10'] = runtime;

  const calendar = widget['1'].find(n => n.d0 === 247), native = variable('calendar_native_city');
  const fallback = calendar['1'].find(n => n.d0 === 81871);
  assert(fallback && !fallback.o1 && fallback['1'].length === 2);
  // Widgy paints earlier entries in front (confirmed by the native city fix).
  assert(calendar['1'].indexOf(fallback) < calendar['1'].findIndex(n => n.d0 === 80408), 'Keep location in front of chrome');
  assert.deepEqual(fallback['1'].map(n => n['66']), [
    [{'5':'Location','6':'City'},{'5':'Custom Text','6':'Text','25':', '},{'5':'Location','6':'Country'}],
    [{'5':'Custom Text','6':'Text','25':'Ashkelon, '},{'5':'Location','6':'Country'}]
  ]);
  const country = structuredClone(native), pair = structuredClone(native);
  country['0'] = 'CA1E0000-0000-4000-C026-000000000001'; country['1'] = 'calendar_native_country';
  country['3'].s = 'Variable: calendar_native_country'; country['3']['66'] = [{'5':'Location','6':'Country'}];
  pair['0'] = 'CA1E0000-0000-4000-C026-000000000002'; pair['1'] = 'calendar_location_pair';
  pair['3'].s = 'Variable: calendar_location_pair';
  pair['3']['66'] = [{'5':'Javascript','6':'Script','10':calendarLocationPair.toString() + '\nfunction main() { return calendarLocationPair("${widgy.map_request}"); }'}];
  widget['36'].push(country, pair);
  const condition = (v, operator) => ({'0':v['0'],'1':operator,'2':''});
  const completeNative = structuredClone(fallback), cityOnly = structuredClone(fallback);
  completeNative.d0 = 83200; completeNative.s = 'Calendar Location · Native City and Country'; completeNative.o1 = condition(country, 1);
  cityOnly.d0 = 83201; cityOnly.s = 'Calendar Location · Native City while Country Pending'; cityOnly.o1 = condition(country, 0);
  cityOnly['1'][0].d0 = 83202; cityOnly['1'][0]['66'] = [{'5':'Location','6':'City'}];
  cityOnly['1'][1].d0 = 83203; cityOnly['1'][1]['66'] = [{'5':'Custom Text','6':'Text','25':'Ashkelon'}];
  fallback.o1 = condition(pair, 0); fallback['1'] = [completeNative, cityOnly];
  const pairedText = structuredClone(completeNative['1'][0]);
  pairedText.d0 = 83204; pairedText.s = 'Calendar Location · Paired Map City and Country';
  pairedText.o1 = condition(pair, 1);
  pairedText['66'] = [{'5':'Custom Text','6':'Text','25':'${widgy.calendar_location_pair}'}];
  calendar['1'].splice(calendar['1'].indexOf(fallback) + 1, 0, pairedText);
  const ids = flatten(widget['1']).map(n => n.d0); assert.equal(ids.length, new Set(ids).size);
  widget['3'] = 'Widgy Calendar City Country 1';
  widget['4'] = 'Based on Home Direct Data 1. Keep countryName from the existing exact-GPS phone geocoder and its private city cache, without an extra lookup. Calendar prefers a paired city/country label from that map observation; native City/Country and Ashkelon spelling remain the fallback. While country is missing, show city without a dangling comma. Same live lossless map and renderer, Home data, clock, day gauge, design and full month actions. Native dependency timing and country restoration still require confirmation; no speed or black-map fix claimed.';
  return widget;
}
