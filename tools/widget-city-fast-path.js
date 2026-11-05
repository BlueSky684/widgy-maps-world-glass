// Optional single-entry cache inside a reusable Widgy JavaScript context.
// Engines that create a new context on every invocation simply use HTTP.
// No persistent storage, location history, or timers on the warm path.
function sharedLocationText(latitude,longitude,endpoint) {
  var done=false,timer=null,controller=null;
  function finish(value) {
    if(done)return;
    done=true;
    if(timer!==null && typeof clearTimeout==='function')clearTimeout(timer);
    sendToWidgy(value);
  }
  function unavailable() {
    finish('Location unavailable');
    if(controller)try{controller.abort();}catch(error){}
  }
  var lat=String(latitude).trim().replace(',','.'),lon=String(longitude).trim().replace(',','.');
  var number=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
  if(!number.test(lat)||!number.test(lon)||Math.abs(Number(lat))>90||Math.abs(Number(lon))>180){unavailable();return;}
  var latitudeNumber=Number(lat),longitudeNumber=Number(lon);
  var host=typeof globalThis==='object' ? globalThis : null;
  var cacheName='__worldMapGlassCityV1',now=Date.now();
  try {
    var cached=host && host[cacheName];
    if(cached && cached.endpoint===endpoint && cached.latitude===latitudeNumber && cached.longitude===longitudeNumber &&
       typeof cached.text==='string' && cached.text && Number.isFinite(cached.receivedAt) && Number.isFinite(cached.expiresAt) &&
       cached.receivedAt<=now && now<cached.expiresAt && cached.expiresAt-cached.receivedAt<=60000) {
      finish(cached.text);return;
    }
  } catch(error) {}
  // Complete once even if headers/body never arrive. Abort is optional in
  // native JS; the callback guard also discards any late successful response.
  if(typeof setTimeout==='function')timer=setTimeout(unavailable,4000);
  try {
    if(typeof AbortController==='function')controller=new AbortController();
    fetch(endpoint+'&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon),controller?{signal:controller.signal}:undefined).then(function(r){
      if(!r.ok)throw Error('unavailable');return r.json();
    }).then(function(result){
      if(done)return;
      var e=result && result.entry;
      if(!e||e.latitude!==latitudeNumber||e.longitude!==longitudeNumber||typeof e.city!=='string'||!e.city||typeof e.countryName!=='string'||!e.countryName)throw Error('mismatch');
      var text=e.city+', '+e.countryName,receivedAt=Date.now();
      // The server may return a stale fallback on provider errors. Display it
      // as before, but do not keep it for another invocation. Also reject
      // unknown states/timestamps from the optional fast path.
      if(host && ['MEMORY','SHARED','LOOKUP'].indexOf(result.state)>=0 && Number.isFinite(e.observedAt) && e.observedAt<=receivedAt) {
        var expiresAt=Math.min(receivedAt+60000,e.observedAt+3600000);
        if(expiresAt>receivedAt)try {
          host[cacheName]={endpoint:endpoint,latitude:latitudeNumber,longitude:longitudeNumber,text:text,receivedAt:receivedAt,expiresAt:expiresAt};
        } catch(error) {}
      }
      finish(text);
    }).catch(unavailable);
  } catch(error) {unavailable();}
}
