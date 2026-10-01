// Text-layer diagnostic: one direct client request, no async variable chain.
// Actual current coordinates may only be sent from the phone, with permission.
export function cityFetchDiagnostic(latitude, longitude) {
  var finished = false;
  function finish(text) {
    if (finished) return;
    finished = true;
    sendToWidgy(text);
  }
  function coordinate(value, limit) {
    var raw = String(value).trim().replace(/\u2212/g, '-').replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
    var number = Number(raw);
    return isFinite(number) && Math.abs(number) <= limit ? number : null;
  }
  var lat = coordinate(latitude, 90), lon = coordinate(longitude, 180);
  if (lat === null || lon === null) {finish('INPUT MISSING / INVALID');return;}
  var status = '?';
  try {
    fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
      encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&localityLanguage=en')
      .then(function (response) {
        status = typeof response.status === 'number' ? response.status : '?';
        if (response.ok === false || (status !== '?' && (status < 200 || status >= 300))) {
          throw new Error('HTTP ' + status);
        }
        return response.json();
      }).then(function (data) {
        var returnedLat = coordinate(data && data.latitude, 90);
        var returnedLon = coordinate(data && data.longitude, 180);
        var same = returnedLat !== null && returnedLon !== null &&
          Math.abs(returnedLat - lat) <= 0.000011 && Math.abs(returnedLon - lon) <= 0.000011;
        function clean(value) {return String(value == null ? '[missing]' : value).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 70);}
        finish('HTTP: ' + status + ' | source: ' + clean(data && data.lookupSource) +
          '\nCity: [' + clean(data && data.city) + ']' +
          '\nGPS match: ' + (same ? 'YES' : 'NO') + ' | JSON received');
      }).catch(function (error) {
        // Error text may include the request URL in some runtimes. Omit it.
        finish('FAILED | HTTP: ' + status + ' | ' + (error && error.name || 'Error'));
      });
  } catch (error) {
    finish('FETCH CALL FAILED | ' + (error && error.name || 'Error'));
  }
}
