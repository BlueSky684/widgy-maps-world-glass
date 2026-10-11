import {createHash, timingSafeEqual} from 'node:crypto';
import {getCache} from '@vercel/functions';
import {reserveBudget} from './budget.js';

const FRESH_MS = 3600000, RETAIN_MS = 21600000;
const clean = (s, n) => typeof s === 'string' ? Array.from(s.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0,n).join('') : '';
export function coordinates(lat, lon) {
  const number = (v, limit) => typeof v === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v) && Math.abs(Number(v)) <= limit ? Number(v) : null;
  const latitude=number(lat,90), longitude=number(lon,180);
  if(latitude === null || longitude === null) throw Error('invalid_coordinates');
  return {latitude,longitude};
}
export function authorizeLocation(url, env=process.env) {
  const expected=env.WIDGY_LOCATION_ACCESS_TOKEN || '', actual=url.searchParams.get('location_key') || '';
  if(expected.length<32 || !env.BIGDATACLOUD_API_KEY) throw Error('not_configured');
  if(url.searchParams.getAll('location_key').length!==1 || Buffer.byteLength(actual)!==Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual),Buffer.from(expected))) throw Error('unauthorized');
  if(url.searchParams.getAll('lat').length!==1 || url.searchParams.getAll('lon').length!==1) throw Error('invalid_coordinates');
  return coordinates(url.searchParams.get('lat'),url.searchParams.get('lon'));
}
const bounded = (promise, ms) => {
  let timer;
  return Promise.race([promise, new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),ms);})]).finally(()=>clearTimeout(timer));
};

// Regional cache is shared across function instances; memory and single-flight
// are optimizations only. Simultaneous cold misses on DIFFERENT instances may
// still make two provider calls: Runtime Cache offers no atomic distributed lock.
export function createSharedLocation({cache=()=>getCache({namespace:'widgy-location-v1'}), fetcher=fetch, now=Date.now, env=()=>process.env, reserve=reserveBudget}={}) {
  const memory=new Map(), pending=new Map();
  function valid(entry, point, maxAge) {
    const age=entry ? now()-entry.observedAt : -1;
    return entry && entry.latitude===point.latitude && entry.longitude===point.longitude && age>=0 && age<maxAge && clean(entry.city,80)===entry.city && !!entry.city && clean(entry.countryName,100)===entry.countryName && !!entry.countryName;
  }
  function remember(key,entry) {
    memory.delete(key); memory.set(key,entry);
    while(memory.size>256)memory.delete(memory.keys().next().value);
  }
  return async function resolve(point) {
    const config=env();
    if(!config.BIGDATACLOUD_API_KEY || !config.WIDGY_LOCATION_ACCESS_TOKEN) throw Error('not_configured');
    const key=createHash('sha256').update(JSON.stringify([config.WIDGY_LOCATION_ACCESS_TOKEN,config.BIGDATACLOUD_API_KEY,point.latitude,point.longitude,'en'])).digest('hex');
    const previous=memory.get(key);
    if(valid(previous,point,FRESH_MS))return {entry:previous,state:'MEMORY'};
    if(pending.has(key))return pending.get(key);
    if(pending.size>=32)throw Error('busy');
    const work=(async()=>{
      let remote, store;
      try {store=cache(); remote=await bounded(Promise.resolve(store.get(key)),400);}catch{}
      if(valid(remote,point,FRESH_MS)){remember(key,remote);return {entry:remote,state:'SHARED'};}
      const stale=[previous,remote].filter(e=>valid(e,point,RETAIN_MS)).sort((a,b)=>b.observedAt-a.observedAt)[0];
      try {
        const url=new URL('https://api-bdc.net/data/reverse-geocode');
        url.search=new URLSearchParams({latitude:String(point.latitude),longitude:String(point.longitude),localityLanguage:'en',key:config.BIGDATACLOUD_API_KEY});
        // Count attempts before sending; timeouts/errors are not refunded.
        await reserve();
        const response=await fetcher(url,{signal:AbortSignal.timeout(3500),redirect:'error'});
        if(!response.ok)throw Error('provider_unavailable');
        const data=await response.json();
        if(typeof data.latitude!=='number'||typeof data.longitude!=='number'||Math.abs(data.latitude-point.latitude)>0.000011||Math.abs(data.longitude-point.longitude)>0.000011)throw Error('provider_mismatch');
        let city=clean(data.city,80)||clean(data.locality,80); const countryName=clean(data.countryName,100);
        if(!city||!countryName)throw Error('provider_incomplete');
        if(/^Ashqelon$/i.test(city))city='Ashkelon';
        const entry={...point,city,countryName,observedAt:now()};
        remember(key,entry);
        try { if(store)await bounded(Promise.resolve(store.set(key,entry,{ttl:RETAIN_MS/1000,name:'widget-location'})),400); }catch{}
        return {entry,state:'LOOKUP'};
      } catch {
        if(stale){remember(key,stale);return {entry:stale,state:'STALE'};}
        throw Error('location_unavailable');
      }
    })();
    pending.set(key,work);
    try{return await work;}finally{pending.delete(key);}
  };
}
export const sharedLocation=createSharedLocation();
export function locationErrorStatus(error) {
  return ({not_configured:503,unauthorized:403,invalid_coordinates:400,busy:503})[error.message]||502;
}
export async function locationHandler(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('Vercel-CDN-Cache-Control','no-store');
  if(req.method && req.method!=='GET')return res.status(405).end();
  try {
    const url=new URL(req.url,'https://location.invalid');
    const point=authorizeLocation(url), result=await sharedLocation(point);
    res.setHeader('X-Location-Cache',result.state);
    return res.status(200).json(result);
  }catch(error){return res.status(locationErrorStatus(error)).json({error:'Location unavailable'});}
}
