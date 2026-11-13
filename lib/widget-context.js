import {privateHeaders} from './calendar-bridge/security.js';
import {homeWidgyData} from './weather/widgy-data.js';
import {waitUntil} from '@vercel/functions';
import {nativeProjection} from './calendar-bridge/native-projection.js';

// One native JSON URL for the three small data reads already required by the
// full widget. Call existing handlers in-process and concurrently: no loopback
// HTTP, new provider, changed credentials, global response cache or event TTL.
// Each handler retains its own validation, authorization and source cache.
function subURL(path, input, keys, fixed) {
  const url=new URL(path,'https://widget-context.invalid');
  for(const key of keys)if(input.has(key))url.searchParams.set(key,input.get(key));
  for(const [key,value] of Object.entries(fixed))url.searchParams.set(key,value);
  return url.pathname+url.search;
}
function capture() {
  return {statusCode:200,headers:{},body:undefined,
    setHeader(k,v){this.headers[k.toLowerCase()]=String(v);return this;},
    status(code){this.statusCode=code;return this;},
    json(body){this.body=body;return this;},
    end(){return this;}};
}
function maxAge(part,now) {
  if(!part.ok)return 0;
  const cache=part.response.headers['cache-control']||'';
  if(!/\bprivate\b/.test(cache)||/\bno-store\b/.test(cache))return 0;
  const seconds=Number(cache.match(/(?:^|[,\s])max-age=(\d+)/)?.[1]||0);
  return Math.max(0,Math.floor((part.completedAt+Math.min(30,seconds)*1000-now)/1000));
}
export function createWidgetContext({calendar,weather,location,clock=Date.now,
  budgetMs=5000,defer=task=>waitUntil(task),
  log=entry=>console.info(JSON.stringify(entry))}={}) {
  return async function context(req,res) {
    const started=performance.now();
    privateHeaders(res);res.setHeader('Vercel-CDN-Cache-Control','no-store');
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('X-Widget-Context-Revision','native-projection-v2');
    if(!['GET','HEAD'].includes(req.method)) {
      res.setHeader('Allow','GET, HEAD');return res.status(405).end();
    }
    let input;
    try {
      input=new URL(req.url,'https://widget-context.invalid').searchParams;
      // Never silently collapse duplicate credentials/coordinates.
      for(const key of input.keys())if(input.getAll(key).length!==1)throw Error();
      if(input.get('context')!=='home-v1')throw Error();
    } catch {return res.status(400).json({error:'invalid_context'});}
    const calendarURL=subURL('/api/calendar-widget',input,['token','day_zone','flights','flight_mode','refresh'],
      {view:'today',reuse:'year-v2',metadata:'native-v1',presentation:'agenda-v2'});
    const weatherURL=subURL('/api/weather-panel',input,['lat','lon','refresh'],
      {v:input.get('wx_v')||'13',format:'json',view:'home-v1',reuse:'home-30s-v1'});
    const locationURL=subURL('/api/fetch-probe',input,['lat','lon','location_key'],
      {location_shared:'1',view:'label-v1'});
    async function run(load,url,valid) {
      const response=capture();
      const work=(async()=>{try {
        const handler=await load();
        // HEAD must calculate the same fields and headers as GET. Suppress only
        // the outer body, so all sub-handlers keep their established contracts.
        await handler({method:'GET',url,headers:{}},response);
        return {response,completedAt:clock(),ok:response.statusCode===200&&valid(response.body)};
      } catch {return {response,completedAt:clock(),ok:false};}})();
      // Optional metadata must not hold weather/city hostage to a slow calendar
      // provider. Native TODAY remains available; a late result may warm the
      // existing component cache but cannot mutate the delivered response.
      let timer;
      try {
        const timeout=new Promise(resolve=>{timer=setTimeout(()=>{
          try {defer(work.then(()=>{}));} catch {}
          resolve({response:{statusCode:504,headers:{}},completedAt:clock(),ok:false});
        },budgetMs);});
        return await Promise.race([work,timeout]);
      } finally {clearTimeout(timer);}
    }
    const [cal,wx,city]=await Promise.all([
      run(calendar,calendarURL,b=>typeof b?.encoded==='string'),
      run(weather,weatherURL,b=>typeof b?.icon_status==='string'),
      run(location,locationURL,b=>typeof b?.text==='string')
    ]);
    const body={version:1,
      calendar:cal.ok?cal.response.body:{encoded:''},
      weather:wx.ok?wx.response.body:homeWidgyData(null),
      location:city.ok?city.response.body:{text:'Location unavailable'}};
    if(input.get('native')==='v2') {
      // Clone: a cached handler result must never acquire another device's
      // native row ordering or titles. Do not log this private projection.
      body.calendar={...body.calendar,native:nativeProjection(input,body.calendar.encoded,clock())};
      res.setHeader('X-Widget-Native-Status',body.calendar.native.status);
    }
    const status={calendar:cal.ok?cal.response.statusCode:cal.response.statusCode===200?502:cal.response.statusCode,
      weather:wx.ok?wx.response.statusCode:wx.response.statusCode===200?502:wx.response.statusCode,
      location:city.ok?city.response.statusCode:city.response.statusCode===200?502:city.response.statusCode};
    const ttl=Math.min(maxAge(cal,clock()),maxAge(wx,clock()),maxAge(city,clock()));
    if(ttl>0)res.setHeader('Cache-Control',`private, max-age=${ttl}, must-revalidate`);
    res.setHeader('X-Widget-Context-Parts',Object.entries(status).map(([k,v])=>`${k}=${v}`).join(';'));
    const elapsedMs=Math.round((performance.now()-started)*10)/10;
    res.setHeader('Server-Timing',`context;dur=${elapsedMs}`);
    // Bounded operation data only; never query strings, keys, coordinates,
    // event titles, returned field values or raw provider errors.
    try {log({event:'widget_context_v1',elapsedMs,status,method:req.method,
      ...(body.calendar.native?{nativeStatus:body.calendar.native.status}: {})});} catch {}
    return req.method==='HEAD'?res.status(200).end():res.status(200).json(body);
  };
}

// Lazy loaders keep the existing dots endpoint free of weather/city imports.
export function widgetContext(calendar) {
  return createWidgetContext({calendar:async()=>calendar,
    weather:async()=>(await import('./weather/handler.js')).default,
    location:async()=>(await import('./location/native-label.js')).default});
}

