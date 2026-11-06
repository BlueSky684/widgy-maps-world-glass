import {createHash} from 'node:crypto';
import {getCache,waitUntil} from '@vercel/functions';
import {normalizeForecast,providerURL} from './model.js';
import {persistWeatherCache} from './cache-write.js';
const regional=getCache({namespace:'widgy-world-glass-weather-r2',keyHashFunction:key=>key});
const pending=new Map();
export const FRESH_MS=600000,STALE_MS=3600000;
// The map keeps exact GPS. Weather alone uses a ~1 km cell for request reuse.
export function weatherCell(lat,lon){return [Number(lat.toFixed(2)),Number(lon.toFixed(2))];}
export function createForecastService({cache=regional,fetcher=fetch,clock=Date.now,flights=pending,schedule=waitUntil}={}){
  // Reuse a verified raw forecast inside this function instance. A hit keeps
  // the original savedAt and re-normalizes for the current hour/local date.
  // The regional cache remains the shared source across instances.
  const memory=new Map();
  function normalizeRecord(record,instant){
    const age=record?instant-record.savedAt:Infinity;
    if(!Number.isFinite(age)||age<0||age>=STALE_MS)return null;
    try{return {record,age,data:normalizeForecast(record.raw,instant)};}catch{return null;}
  }
  function remember(key,record){
    memory.delete(key);memory.set(key,record);
    while(memory.size>64)memory.delete(memory.keys().next().value);
  }
  return async function getForecast(lat,lon){
    const cell=weatherCell(lat,lon),key=createHash('sha256').update(cell.join(',')).digest('hex'),now=clock();
    if(flights.has(key))return flights.get(key);
    for(const [id,record] of memory)if(record.savedAt>now||now-record.savedAt>=STALE_MS)memory.delete(id);
    const local=normalizeRecord(memory.get(key),now);
    if(local&&local.age<FRESH_MS)return {data:local.data,state:'fresh',cache:'HIT',tier:'memory',freshUntil:local.record.savedAt+FRESH_MS};
    let write;
    const job=(async()=>{
      let remote;
      try{remote=normalizeRecord(await cache.get(key),now);}catch{} // Cache failure must not hide live data.
      const previous=[local,remote].filter(Boolean).sort((a,b)=>b.record.savedAt-a.record.savedAt)[0];
      if(previous&&previous.age<FRESH_MS){
        remember(key,previous.record);
        return {data:previous.data,state:'fresh',cache:'HIT',tier:'regional',freshUntil:previous.record.savedAt+FRESH_MS};
      }
      try{
        const response=await fetcher(providerURL(...cell),{signal:AbortSignal.timeout(4500),headers:{Accept:'application/json'}});
        if(!response.ok)throw Error('weather_provider');
        if(Number(response.headers.get('content-length'))>200000)throw Error('weather_size');
        const source=await response.text();if(source.length>200000)throw Error('weather_size');
        const raw=JSON.parse(source),data=normalizeForecast(raw,now);
        remember(key,{savedAt:now,raw});
        // Persist the validated payload without holding the response open.
        // The original observation time and cache lifetime are unchanged.
        write=persistWeatherCache(()=>cache.set(key,{savedAt:now,raw},{ttl:STALE_MS/1000,name:'forecast',tags:['weather-r2']}),schedule);
        return {data,state:'fresh',cache:'MISS',freshUntil:now+FRESH_MS};
      }catch{
        if(previous)return {data:previous.data,state:'stale',cache:'STALE'};
        return {data:null,state:'unavailable',cache:'UNAVAILABLE'};
      }
    })();
    // Bound concurrent provider work separately from the completed raw cache.
    if(flights.size<64)flights.set(key,job);
    try{return await job;}finally{
      const release=()=>{if(flights.get(key)===job)flights.delete(key);};
      if(write)write.then(release);else release();
    }
  };
}
export const getForecast=createForecastService();
