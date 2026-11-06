import {createHash} from 'node:crypto';
import {getCache,waitUntil} from '@vercel/functions';
import {weatherCell} from './service.js';
import {persistWeatherCache} from './cache-write.js';
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
  const memory=new Map();
  const remember=(key,record)=>{
    memory.delete(key);memory.set(key,record);
    while(memory.size>64)memory.delete(memory.keys().next().value);
  };
  const valid=(record)=>{
    const age=record?clock()-record.savedAt:Infinity;
    if(!Number.isFinite(age)||age<0||age>=AQI_MAX_AGE_MS)return null;
    try{return {record,age,data:normalizeAQI(record.raw,clock())};}catch{return null;}
  };
  return async function readAQI(lat,lon){
    const cell=weatherCell(lat,lon),key=createHash('sha256').update(cell.join(',')).digest('hex');
    for(const [id,record] of memory)if(record.savedAt>clock()||clock()-record.savedAt>=AQI_MAX_AGE_MS)memory.delete(id);
    const local=valid(memory.get(key));
    if(local&&local.age<AQI_FRESH_MS)return {...local.data,state:'fresh',cache:'HIT',
      ...(flights.has(key)?{refresh:flights.get(key)}:{})};
    let remote;
    try{remote=valid(await cache.get(key));}catch{}
    // A cross-instance refresh may be newer than the retained local fallback.
    const prior=[local,remote].filter(Boolean).sort((a,b)=>b.record.savedAt-a.record.savedAt)[0];
    if(prior&&prior.age<AQI_FRESH_MS){remember(key,prior.record);return {...prior.data,state:'fresh',cache:'HIT'};}
    const fallback=prior?{...prior.data,state:'stale',cache:'STALE'}:absent();
    let refresh=flights.get(key);
    if(!refresh&&flights.size<64){
      let write;
      refresh=(async()=>{
        try{
          const response=await fetcher(airQualityURL(...cell),{signal:AbortSignal.timeout(4000),headers:{Accept:'application/json'}});
          if(!response.ok)throw Error('aqi_provider');
          const body=await response.text();if(body.length>20000)throw Error('aqi_size');
          const raw=JSON.parse(body),fresh=normalizeAQI(raw,clock());
          // The first image can use this verified number before cache storage
          // completes; otherwise a slow write can consume its provider budget.
          const savedAt=clock();
          remember(key,{raw,savedAt});
          write=persistWeatherCache(()=>cache.set(key,{raw,savedAt},{ttl:AQI_MAX_AGE_MS/1000,name:'air-quality',tags:['weather-aqi-r1']}),schedule);
          return {...fresh,state:'fresh',cache:'MISS'};
        }catch{return fallback;}
        finally{
          const release=()=>{if(flights.get(key)===refresh)flights.delete(key);};
          if(write)write.then(release);else release();
        }
      })();
      flights.set(key,refresh);
      // Preserve background refreshes for cached values and after the bounded
      // first-load wait. The handler joins this promise only without usable AQI.
      schedule(refresh);
    }
    return {...fallback,state:fallback.value===null&&refresh?'loading':fallback.state,refresh};
  };
}
export const getAQI=createAQIService();
