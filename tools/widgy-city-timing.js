// Only the user's current consenting browser may call the client geocoder.
// Coordinates remain local to this function and the direct provider request.
// Never replay screenshot coordinates, invoke this from the server, or put
// location values, response bodies or request URLs in the report/logs.
const ms=n=>Math.round(n*10)/10;
const abortError=()=>Object.assign(Error('cancelled'),{name:'AbortError'});
function position(geolocate,signal){
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(abortError());return;}
    let settled=false;
    const finish=(fn,value)=>{if(settled)return;settled=true;signal.removeEventListener('abort',cancel);fn(value);};
    const cancel=()=>finish(reject,abortError());
    signal.addEventListener('abort',cancel,{once:true});
    try{geolocate(p=>finish(resolve,p),e=>finish(reject,Error('location_'+({1:'denied',2:'unavailable',3:'timeout'}[e.code]||'failed'))),{maximumAge:0,timeout:15000,enableHighAccuracy:true});}
    catch{finish(reject,Error('location_unavailable'));}
  });
}
export async function measureCityLookup({geolocate=(ok,fail,options)=>navigator.geolocation.getCurrentPosition(ok,fail,options),fetcher=fetch,now=()=>performance.now(),signal,lookupTimeoutMs=15000}={}){
  const controller=new AbortController(),cancel=()=>controller.abort();
  if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
  const started=now(),result={test:'city-timing-1',ok:false};
  let timer,timedOut=false,lookupStarted=null;
  try{
    const p=await position(geolocate,controller.signal),positionAt=now();
    result.locationMs=ms(positionAt-started);
    if(controller.signal.aborted)throw abortError();
    const lat=p.coords.latitude,lon=p.coords.longitude;
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error('location_invalid');
    lookupStarted=positionAt;
    timer=setTimeout(()=>{timedOut=true;controller.abort();},lookupTimeoutMs);
    const url='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lon)+'&localityLanguage=en';
    const response=await fetcher(url,{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
    result.lookupHeadersMs=ms(now()-positionAt);result.httpStatus=response.status;
    if(!response.ok)throw Error('lookup_http_'+response.status);
    let data;try{data=await response.json();}catch{throw Error('lookup_invalid_json');}
    result.lookupMs=ms(now()-positionAt);
    const match=typeof data?.latitude==='number' && typeof data?.longitude==='number' && Math.abs(data.latitude-lat)<=0.000011 && Math.abs(data.longitude-lon)<=0.000011;
    result.returnedCoordinatesMatch=match;
    result.lookupSourceCoordinates=data?.lookupSource==='coordinates';
    result.cityAvailable=Boolean(match && result.lookupSourceCoordinates && typeof data?.city==='string' && data.city.trim());
    result.ok=true;
  }catch(error){
    // Whitelist our own codes only; arbitrary network errors may contain URLs.
    const code=String(error?.message||'');
    result.error=timedOut?'lookup_timeout':controller.signal.aborted?'cancelled':/^(location_(denied|unavailable|timeout|failed|invalid)|lookup_(http_\d{3}|invalid_json))$/.test(code)?code:'lookup_network_failed';
  }finally{
    if(lookupStarted!==null && result.lookupMs===undefined)result.lookupMs=ms(now()-lookupStarted);
    result.totalMs=ms(now()-started);clearTimeout(timer);signal?.removeEventListener('abort',cancel);
  }
  return result;
}
export function cityReport(result){
  // Explicit allowlist: never serialize a position, provider payload or URL.
  const fields=['test','ok','locationMs','lookupHeadersMs','lookupMs','httpStatus','returnedCoordinatesMatch','lookupSourceCoordinates','cityAvailable','error','totalMs'];
  return JSON.stringify({measuredAt:new Date().toISOString(),environment:'Browser only; location time may include permission prompt. Not Widgy JS runtime or image timing.',...Object.fromEntries(fields.filter(k=>Object.hasOwn(result,k)).map(k=>[k,result[k]]))},null,2);
}
if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);let active=null;
  const seconds=n=>typeof n==='number'?(n/1000).toFixed(2)+' שניות':'—';
  $('run').addEventListener('click',async()=>{
    if(active)return;active=new AbortController();$('run').disabled=true;$('cancel').hidden=false;$('report').hidden=true;$('copy-status').textContent='';
    $('status').textContent='ממתין למיקום הנוכחי ולתשובת שירות איתור העיר…';
    try{
      const result=await measureCityLookup({signal:active.signal});
      $('location-time').textContent=seconds(result.locationMs);$('lookup-time').textContent=seconds(result.lookupMs);$('total-time').textContent=seconds(result.totalMs);
      $('text').value=cityReport(result);$('report').hidden=false;
      $('status').textContent=result.ok?'המדידה הסתיימה. העתק את התוצאות לשיחה.':result.error==='location_denied'?'הרשאת המיקום לא ניתנה. לא נשלח מיקום לשירות.':'המדידה לא הושלמה. אפשר להעתיק גם את תוצאת השגיאה.';
    }finally{active=null;$('run').disabled=false;$('cancel').hidden=true;}
  });
  $('cancel').addEventListener('click',()=>active?.abort());
  $('copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('text').value);$('copy-status').textContent='הועתק. אפשר להדביק בשיחה.';}
    catch{$('text').focus();$('text').select();$('text').setSelectionRange(0,$('text').value.length);$('copy-status').textContent='סמן והעתק את הטקסט שבתיבה.';}
  });
}
