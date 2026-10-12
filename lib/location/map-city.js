import {waitUntil} from '@vercel/functions';
import {sharedLocation} from './shared.js';

export const MAP_CITY_DEADLINE_MS = 1500;

// City names enrich an already authenticated coordinate; they must not gate
// delivery of the map. Keep shared lookup/cache work alive after a deadline,
// without making the image wait for the provider or budget service.
export async function resolveMapCity(point, {
  lookup=sharedLocation, deadlineMs=MAP_CITY_DEADLINE_MS, defer=waitUntil
}={}) {
  const work=Promise.resolve().then(()=>lookup(point)).then(result=>{
    const e=result?.entry;
    if (!e || e.latitude!==point.latitude || e.longitude!==point.longitude ||
        typeof e.city!=='string' || !e.city.trim() ||
        /[\u0000-\u001f\u007f]/.test(e.city) || e.city.length>160 ||
        !['MEMORY','SHARED','LOOKUP','STALE'].includes(result.state))
      throw Error('invalid_city_result');
    return {city:e.city,state:result.state};
  }).catch(()=>({city:null,state:'UNAVAILABLE'}));
  // Local runners may not have a Vercel request context. Failure to register
  // background completion must never turn into an image failure.
  try {defer(work);} catch {}
  let timer;
  try {
    return await Promise.race([work,new Promise(resolve=>{
      timer=setTimeout(()=>resolve({city:null,state:'TIMEOUT'}),deadlineMs);
    })]);
  } finally {clearTimeout(timer);}
}
