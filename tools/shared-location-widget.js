import {withDirectLocationLabel} from './direct-location-label.js';

export function sharedLocationText(latitude,longitude,endpoint) {
  var lat=String(latitude).trim().replace(',','.'),lon=String(longitude).trim().replace(',','.');
  var number=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if(!number.test(lat)||!number.test(lon)||Math.abs(Number(lat))>90||Math.abs(Number(lon))>180){sendToWidgy('Location unavailable');return;}
  fetch(endpoint+'&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)).then(function(r){
    if(!r.ok)throw Error('unavailable');return r.json();
  }).then(function(result){
    var e=result.entry;
    if(!e||e.latitude!==Number(lat)||e.longitude!==Number(lon)||!e.city||!e.countryName)throw Error('mismatch');
    sendToWidgy(e.city+', '+e.countryName);
  }).catch(function(){sendToWidgy('Location unavailable');});
}
export function withSharedLocationWidget(input,accessToken,origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app') {
  if(!/^[a-zA-Z0-9_-]{43}$/.test(accessToken))throw Error('Invalid access token');
  if(new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('Invalid origin');
  const w=withDirectLocationLabel(input);
  const source=name=>w['36'].find(v=>v['1']===name)['3'];
  const endpoint=origin+'/api/fetch-probe?location_shared=1&location_key='+accessToken;
  source('calendar_location_pair')['66']=[{'5':'Javascript','6':'Async + No main()','10':sharedLocationText.toString()+'\nsharedLocationText("${widgy.map_latitude_max5}","${widgy.map_longitude_max5}",'+JSON.stringify(endpoint)+');'}];
  source('map_request')['66']=[{'5':'Custom Text','6':'Text','25':origin+'/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60&shared_location=1&location_key='+accessToken+'&lat=${widgy.map_latitude_max5}&lon=${widgy.map_longitude_max5}&t=${widgy.calendar_refresh_minute}'}];
  return w;
}
