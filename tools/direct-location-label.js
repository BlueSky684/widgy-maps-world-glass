import assert from 'node:assert/strict';

// Native Widgy runtime: start the request during evaluation and complete once.
// Share one variable across Calendar and Weather, independently of map_request.
export function directLocationLabel(latitude, longitude) {
  var done = false;
  function finish(value) { if (!done) { done = true; sendToWidgy(value); } }
  function coordinate(value, limit) {
    var raw = String(value).trim().replace(/\u2212/g, '-').replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
    var n = Number(raw); return isFinite(n) && Math.abs(n) <= limit ? n : null;
  }
  function clean(value, length) {
    return typeof value === 'string' ? Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, length).join('') : '';
  }
  var lat = coordinate(latitude, 90), lon = coordinate(longitude, 180);
  if (lat === null || lon === null) { finish('Location unavailable'); return; }
  var memory;
  try {
    memory = typeof globalThis === 'object' ? globalThis : null;
    var saved = memory && memory.__widgyDirectLocationV1;
    var age = saved ? Date.now() - saved.time : -1;
    if (saved && saved.lat === lat && saved.lon === lon && age >= 0 && age < 300000) {
      finish(saved.label); return;
    }
  } catch (_) { memory = null; }
  var url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&localityLanguage=en';
  try {
    fetch(url).then(function (response) {
      if (!response || response.ok === false || (typeof response.status === 'number' && (response.status < 200 || response.status >= 300))) throw Error('Location lookup failed');
      return response.json();
    }).then(function (data) {
      var a = coordinate(data && data.latitude, 90), b = coordinate(data && data.longitude, 180);
      if (!data || data.lookupSource !== 'coordinates' || a === null || b === null || Math.abs(a - lat) > 0.000011 || Math.abs(b - lon) > 0.000011) throw Error('Location mismatch');
      var city = clean(data.city, 80) || clean(data.locality, 80), country = clean(data.countryName, 100);
      if (!city) throw Error('City missing');
      if (/^Ashqelon$/i.test(city)) city = 'Ashkelon';
      var label = city + (country ? ', ' + country : '');
      if (memory) { try { memory.__widgyDirectLocationV1 = {lat:lat, lon:lon, time:Date.now(), label:label}; } catch (_) {} }
      finish(label);
    }).catch(function () { finish('Location unavailable'); });
  } catch (_) { finish('Location unavailable'); }
}

export function withDirectLocationLabel(input) {
  const w = structuredClone(input);
  const variable = w['36'].find(v => v['1'] === 'calendar_location_pair');
  assert(variable);
  variable['3']['66'] = [{'5':'Javascript','6':'Async + No main()','10':directLocationLabel.toString() + '\ndirectLocationLabel("${widgy.map_latitude_max5}","${widgy.map_longitude_max5}");'}];
  for (const [groupId, fallbackId, textId] of [[247,81871,83204],[246,84006,84013]]) {
    const group = w['1'].find(n => n.d0 === groupId);
    assert(group['1'].some(n => n.d0 === fallbackId));
    const text = group['1'].find(n => n.d0 === textId); assert(text);
    assert.equal(text['66'][0]['25'], '${widgy.calendar_location_pair}');
    group['1'] = group['1'].filter(n => n.d0 !== fallbackId);
    delete text.o1;
    text.s = (groupId === 247 ? 'Calendar' : 'Weather') + ' Location · Direct GPS City and Country';
  }
  return w;
}
