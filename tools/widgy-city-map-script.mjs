// Runs on the phone, never on the map server. The public client API permits
// only the calling device's current native location, with user permission.
// Do not call this provider from tests or replay screenshot coordinates.
export function cityMapRuntime(latitude, longitude, endpoint, enabled, fallbackLatitude, fallbackLongitude) {
  var finished = false;
  function finish(url) {
    if (finished) return;
    finished = true;
    sendToWidgy(url);
  }
  function coordinate(value, limit) {
    var raw = String(value).trim().replace(/\u2212/g, '-').replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
    var number = Number(raw);
    return isFinite(number) && Math.abs(number) <= limit ? number : null;
  }
  var lat = coordinate(enabled ? latitude : fallbackLatitude, 90);
  var lon = coordinate(enabled ? longitude : fallbackLongitude, 180);
  // Explicit empty coordinates suppress the map server's IP-location fallback.
  var base = endpoint + '&lat=' + (lat === null ? '' : encodeURIComponent(lat)) +
    '&lon=' + (lon === null ? '' : encodeURIComponent(lon));
  function mapURL(city) {
    return base + (city ? '&city=' + encodeURIComponent(city) : '') + '&t=' + Date.now();
  }
  if (!enabled || lat === null || lon === null) {
    finish(mapURL(''));
    return;
  }
  var lookup = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
    encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&localityLanguage=en';
  Promise.resolve().then(function () {
    return fetch(lookup);
  }).then(function (response) {
    if (!response || response.ok === false ||
        (typeof response.status === 'number' && (response.status < 200 || response.status >= 300))) {
      throw new Error('City lookup failed');
    }
    return response.json();
  }).then(function (data) {
    // Never put an IP-derived or mismatched city next to the GPS marker.
    var returnedLat = coordinate(data && data.latitude, 90);
    var returnedLon = coordinate(data && data.longitude, 180);
    var city = '';
    if (data && data.lookupSource === 'coordinates' && returnedLat !== null && returnedLon !== null &&
        Math.abs(returnedLat - lat) <= 0.000011 && Math.abs(returnedLon - lon) <= 0.000011 &&
        typeof data.city === 'string') {
      city = Array.from(data.city.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 80).join('');
    }
    finish(mapURL(city));
  }).catch(function () {
    // HTTP, JSON and fetch failures still return a map URL with its GPS marker.
    // No timer API is available in the tested Widgy runtime; a request which
    // never settles is still subject to Widgy's own execution/network timeout.
    finish(mapURL(''));
  });
}

export function buildCityMapScript(endpoint, {enabled = false} = {}) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.pathname !== '/api/night-map') throw Error('Unexpected map endpoint');
  const token = name => JSON.stringify('${widgy.' + name + '}');
  return cityMapRuntime.toString() + '\ncityMapRuntime(' +
    [token('map_latitude_max5'), token('map_longitude_max5'), JSON.stringify(endpoint),
      JSON.stringify(enabled), token('Latitude'), token('Longitude')].join(',') + ');';
}
