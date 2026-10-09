import {createHash} from 'node:crypto';
import {coordinate} from './model.js';
import {getForecast} from './service.js';
import {getAQI} from './air-quality.js';
import {renderPNG} from './render.js';

// One dynamic picture with all current/hourly/daily values, composed atomically.
// It is not a frozen mockup; weather requests refresh the underlying forecast.
const rendered=new Map();
async function resolveAir(air,remainingMs){
  if(!air?.refresh)return air;
  const hasValue=Number.isFinite(air.value);
  const fallback={...air,state:hasValue?air.state:'unavailable'};
  const refresh=Promise.resolve(air.refresh).catch(()=>fallback);
  // A cached value needs no provider wait. A first image has no automatic way
  // to repaint when waitUntil completes, so join the first fetch before PNG.
  if(hasValue)return Promise.race([refresh,Promise.resolve(air)]);
  let timer;
  try{return await Promise.race([refresh,new Promise(resolve=>{timer=setTimeout(()=>resolve(fallback),Math.max(0,remainingMs));})]);}
  finally{clearTimeout(timer);}
}
export function createWeatherHandler({forecast=getForecast,airQuality=getAQI,render=renderPNG,clock=Date.now,aqiWaitMs=4250}={}){
  return async function handler(req,res){
    const started=performance.now();
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('CDN-Cache-Control','no-store');
    res.setHeader('Vercel-CDN-Cache-Control','no-store');
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
    try{
      const url=new URL(req.url,'https://weather.invalid');
      const lat=coordinate(url.searchParams.get('lat'),90),lon=coordinate(url.searchParams.get('lon'),180);
      const revision=['2','3','4','5','6','7','8','9'].includes(url.searchParams.get('v'))?Number(url.searchParams.get('v')):1;
      const located=lat!==null&&lon!==null;
      const airPending=located&&revision>=4?airQuality(lat,lon).catch(()=>null):Promise.resolve(null);
      const result=located?await forecast(lat,lon):{data:null,state:'location',cache:'NO_LOCATION'};
      const air=await resolveAir(await airPending,aqiWaitMs-(performance.now()-started));
      const aqi=air?{value:air.value,at:air.at,zone:air.zone,state:air.state}:null;
      const options={revision,aqi,state:result.state,message:result.state==='location'?'Waiting for location':'Weather unavailable'};
      const key=createHash('sha256').update(JSON.stringify([result.data,options])).digest('hex');
      let entry=rendered.get(key);
      if(!entry){
        const image=await render(result.data,options);
        entry={image,etag:'"wx-r1-'+createHash('sha256').update(image).digest('hex')+'"',until:clock()+300000};
        for(const [id,v] of rendered)if(v.until<clock())rendered.delete(id);
        if(rendered.size>=24)rendered.delete(rendered.keys().next().value);
        rendered.set(key,entry);
      }
      // Private device reuse, never CDN-cache a precise location URL.
      if(result.state==='fresh'&&(revision<4||Number.isFinite(aqi?.value)))res.setHeader('Cache-Control','private, max-age=300, must-revalidate');
      res.setHeader('Content-Type','image/png');res.setHeader('ETag',entry.etag);
      if(revision>=4){res.setHeader('X-AQI-State',aqi?.state||'unavailable');if(Number.isFinite(aqi?.value))res.setHeader('X-AQI-Value',String(aqi.value));}
      res.setHeader('X-Weather-State',result.state);res.setHeader('X-Weather-Cache',result.cache);
      res.setHeader('Server-Timing',`weather;dur=${(performance.now()-started).toFixed(1)}`);
      if(req.headers?.['if-none-match']===entry.etag)return res.status(304).end();
      return req.method==='HEAD'?res.status(200).end():res.status(200).send(entry.image);
    }catch{
      // Never log coordinates, complete URLs, or provider response bodies.
      console.error('weather_panel_failed');return res.status(502).json({error:'weather_unavailable'});
    }
  };
}
export default createWeatherHandler();
