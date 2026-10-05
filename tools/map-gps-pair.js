import {withMapMinuteURL} from './map-minute-url.js?v=map-minute-url-1';

// Add only the two primary native coordinate sources. Their original formatting
// metadata stays exact; no unused fallback pair or city source is restored.
export function withMapGPSPair(original,origin){
  const widget=withMapMinuteURL(original,origin);
  const definitions=[
    ['map_latitude_max5','C5D5F231-73AF-48A7-B002-000000000001','Latitude (Decimal)'],
    ['map_longitude_max5','C5D5F231-73AF-48A7-B002-000000000002','Longitude (Decimal)']
  ].map(([name,id,kind])=>{
    const matches=original['36'].filter(v=>v['1']===name),v=matches[0];
    if(matches.length!==1 || v['0']!==id || v['3']?.z!=='1' ||
        v['3']['66']?.length!==1 || v['3']['66'][0]['5']!=='Location' ||
        v['3']['66'][0]['6']!==kind)throw Error('unexpected_template');
    return JSON.parse(JSON.stringify(v));
  });
  const variable=widget['36'][0],source=variable['3']['66'][0];
  if(widget['36'].length!==1 || variable['1']!=='map_request' ||
      source['5']!=='Javascript' || source['6']!=='Script')throw Error('unexpected_template');
  // Exact original coordinate parsing semantics; the old enabled=true path
  // selects these same primary inputs. Do not round or use IP fallback.
  source['10']=[
    'function main() {',
    '  function coordinate(value, limit) {',
    "    var raw = String(value).trim().replace(/\\u2212/g, '-').replace(',', '.');",
    '    if (!/^[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)$/.test(raw)) return null;',
    '    var number = Number(raw);',
    '    return isFinite(number) && Math.abs(number) <= limit ? number : null;',
    '  }',
    '  var lat = coordinate("${widgy.map_latitude_max5}", 90);',
    '  var lon = coordinate("${widgy.map_longitude_max5}", 180);',
    '  var instant = Date.now();',
    '  var stamp = Math.floor(instant / 60000) * 60000;',
    '  return '+JSON.stringify(origin+'/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60')+
      " + '&lat=' + (lat === null ? '' : encodeURIComponent(lat)) +",
    "    '&lon=' + (lon === null ? '' : encodeURIComponent(lon)) + '&t=' + stamp;",
    '}'
  ].join('\n');
  widget['36']=[...definitions,variable];
  widget['3']='Widgy Map GPS Pair 1';
  widget['4']='Temporary matched follow-up after Map Minute URL 1 was reported normal with no delays. Restore exactly the original primary map_latitude_max5/map_longitude_max5 native Location definitions, unchanged including formatting/IDs, and read them in a short synchronous map_request script. Keep the original coordinate validation/decimal-comma/Unicode-minus semantics, missing-coordinate suppression of IP fallback and minute t bucket. Do not restore the two unused legacy fallback definitions or city lookup. Three variables, 21 layers, exact image binding/frame/provider/cache flag/parent/order, navigation, static Calendar and other fields except script/added definitions/name/description. Same full lossless 3306x1558 PNG, server, existing cache policy and query structure; valid coordinates now add a live marker/coordinate label and change the location cache key. This adds native dependency evaluation plus location-dependent image work, not an isolated measurement of GPS hardware. No fetch/geocoder/timers/async completion in the script. Missing native coordinates may show a map without a marker; confirm expected marker before judging location performance. Final city and full Home are not restored yet.';
  return widget;
}
