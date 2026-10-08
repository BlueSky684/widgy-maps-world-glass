// Read the percent-encoded city already returned by the unchanged map source.
// This runs as a synchronous Script source. Native dependency scheduling must
// still be verified on the phone; this is not an in-memory-cache assumption.
export function calendarCityFromMap(url) {
  var match = /[?&]city=([^&#]*)/.exec(String(url));
  var city = '';
  try {
    city = match ? decodeURIComponent(match[1]).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80) : '';
  } catch (error) {}
  return city ? city + ', ' : '';
}

export function withSharedCalendarCity(original) {
  const widget = structuredClone(original);
  function variable(name) {
    const matches = widget['36'].filter(v => v['1'] === name);
    if (matches.length !== 1) throw Error('unexpected_template:' + name);
    return matches[0];
  }
  const source = name => variable(name)['3']['66'][0];
  const map = source('map_request'), city = source('calendar_city_prefix');
  const native = source('calendar_native_city');
  if (map['5'] !== 'Javascript' || map['6'] !== 'Async + No main()' ||
      !map['10'].includes('reverse-geocode-client') ||
      map['10'].includes('${widgy.calendar_city_prefix}') ||
      city['5'] !== 'Javascript' || city['6'] !== 'Async + No main()' ||
      !city['10'].includes('reverse-geocode-client') ||
      native['5'] !== 'Location' || native['6'] !== 'City' ||
      variable('calendar_city_prefix')['3']['66'].length !== 1) {
    throw Error('unexpected_template:city_sources');
  }
  city['6'] = 'Script';
  city['10'] = calendarCityFromMap.toString() +
    '\nfunction main() { return calendarCityFromMap("${widgy.map_request}"); }';
  widget['3'] = 'Widgy City Reuse Test 1';
  widget['4'] = 'Stable map and native day gauge. Calendar reuses the city from map_request; phone performance validation pending.';
  return widget;
}
