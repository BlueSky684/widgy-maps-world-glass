import {createHash} from 'node:crypto';
import {getCache} from '@vercel/functions';
import {normalizeForecast,providerURL} from './model.js';
const regional=getCache({namespace:'widgy-world-glass-weather-r2',keyHashFunction:key=>key});
const pending=new Map();
export const FRESH_MS=600000,STALE_MS=3600000;
// The map keeps exact GPS. Weather alone uses a ~1 km cell for request reuse.
export function weatherCell(lat,lon){return [Number(lat.toFixed(2)),Number(lon.toFixed(2))];}
export function createForecastService({cache=regional,fetcher=fetch,clock=Date.now,flights=pending}={}){
  return async function getForecast(lat,lon){
    const cell=weatherCell(lat,lon),key=createHash('sha256').update(cell.join(',')).digest('hex'),now=clock();
    if(flights.has(key))return flights.get(key);
    const job=(async()=>{
      let previous;
      try{previous=await cache.get(key);}catch{} // Cache failure must not hide live data.
      const age=previous?now-previous.savedAt:Infinity;
      if(age>=0&&age<FRESH_MS){
        try{return {data:normalizeForecast(previous.raw,now),state:'fresh',cache:'HIT'};}catch{}
      }
      try{
        const response=await fetcher(providerURL(...cell),{signal:AbortSignal.timeout(4500),headers:{Accept:'application/json'}});
        if(!response.ok)throw Error('weather_provider');
        if(Number(response.headers.get('content-length'))>200000)throw Error('weather_size');
        const source=await response.text();if(source.length>200000)throw Error('weather_size');
        const raw=JSON.parse(source),data=normalizeForecast(raw,now);
        try{await cache.set(key,{savedAt:now,raw},{ttl:STALE_MS/1000,name:'forecast',tags:['weather-r2']});}catch{}
        return {data,state:'fresh',cache:'MISS'};
      }catch{
        if(age>=0&&age<STALE_MS){
          try{return {data:normalizeForecast(previous.raw,now),state:'stale',cache:'STALE'};}catch{}
        }
        return {data:null,state:'unavailable',cache:'UNAVAILABLE'};
      }
    })();
    // Single-flight only. Durable reuse belongs to regional Runtime Cache.
    if(flights.size<64)flights.set(key,job);
    try{return await job;}finally{if(flights.get(key)===job)flights.delete(key);}
  };
}
export const getForecast=createForecastService();
