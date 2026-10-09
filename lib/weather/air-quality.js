import {createHash} from 'node:crypto';
import {getCache,waitUntil} from '@vercel/functions';
import {weatherCell} from './service.js';
const regional=getCache({namespace:'widgy-weather-air-quality-r1',keyHashFunction:key=>key});
const pending=new Map();
export const AQI_FRESH_MS=15*60000,AQI_MAX_AGE_MS=90*60000;
export function airQualityURL(lat,lon){
  const url=new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  for(const [key,value] of Object.entries({latitude:lat,longitude:lon,current:'us_aqi',timezone:'auto',timeformat:'unixtime',forecast_days:1}))url.searchParams.set(key,String(value));
  return url;
}
export function normalizeAQI(raw,now=Date.now()){
  const value=raw?.current?.us_aqi,time=raw?.current?.time;
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||typeof time!=='number'||!Number.isFinite(time))throw Error('aqi_schema');
  const at=time*1000;if(at>now+300000||now-at>AQI_MAX_AGE_MS)throw Error('aqi_age');
  if(typeof raw.timezone!=='string')throw Error('aqi_zone');
  new Intl.DateTimeFormat('en-GB',{timeZone:raw.timezone}).format(new Date(at));
  return {value:Math.round(value),at,zone:raw.timezone};
}
const absent=()=>({value:null,at:null,zone:null,state:'unavailable',cache:'MISS'});
export function createAQIService({cache=regional,fetcher=fetch,clock=Date.now,schedule=waitUntil,flights=pending}={}){
  return async function readAQI(lat,lon){
    const cell=weatherCell(lat,lon),key=createHash('sha256').update(cell.join(',')).digest('hex');
    let prior,data;
    try{prior=await cache.get(key);if(prior)data=normalizeAQI(prior.raw,clock());}catch{}
    const age=prior?clock()-prior.savedAt:Infinity;
    if(data&&age>=0&&age<AQI_FRESH_MS)return {...data,state:'fresh',cache:'HIT'};
    const fallback=data&&age>=0&&age<AQI_MAX_AGE_MS?{...data,state:'stale',cache:'STALE'}:absent();
    let refresh=flights.get(key);
    if(!refresh&&flights.size<64){
      refresh=(async()=>{
        try{
          const response=await fetcher(airQualityURL(...cell),{signal:AbortSignal.timeout(4000),headers:{Accept:'application/json'}});
          if(!response.ok)throw Error('aqi_provider');
          const body=await response.text();if(body.length>20000)throw Error('aqi_size');
          const raw=JSON.parse(body),fresh=normalizeAQI(raw,clock());
          try{await cache.set(key,{raw,savedAt:clock()},{ttl:AQI_MAX_AGE_MS/1000,name:'air-quality',tags:['weather-aqi-r1']});}catch{}
          return {...fresh,state:'fresh',cache:'MISS'};
        }catch{return fallback;}
        finally{flights.delete(key);}
      })();
      flights.set(key,refresh);
      // Keep the refresh alive after the PNG response; never block Weather on it.
      schedule(refresh);
    }
    return {...fallback,state:fallback.value===null&&refresh?'loading':fallback.state,refresh};
  };
}
export const getAQI=createAQIService();
