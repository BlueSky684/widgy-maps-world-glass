import {waitUntil} from '@vercel/functions';
import {authorizeLocation,sharedLocation,locationClientMaxAge} from './shared.js';

// The same exact-coordinate resolver used by the existing async JS source.
// Projection only: no new geocoder, location rounding, cache lifetime or quota.
export function locationLabel(result,point) {
  const e=result?.entry;
  if(!e || e.latitude!==point.latitude || e.longitude!==point.longitude ||
    typeof e.city!=='string' || !e.city || typeof e.countryName!=='string' || !e.countryName)
    throw Error('location_unavailable');
  return e.city+', '+e.countryName;
}

export function createNativeLocationHandler({resolve=sharedLocation,authorize=authorizeLocation,
  now=Date.now,schedule=waitUntil,deadlineMs=4000}={}) {
  return async function nativeLocation(req,res) {
    const started=performance.now();
    const reply=(text,status=200)=>{
      res.setHeader('Server-Timing',`city;dur=${(performance.now()-started).toFixed(1)}`);
      return res.status(status).json({text});
    };
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('CDN-Cache-Control','no-store');
    res.setHeader('Vercel-CDN-Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(req.method && req.method!=='GET') {
      res.setHeader('Allow','GET');return reply('Location unavailable',405);
    }
    let timer;
    try {
      const url=new URL(req.url,'https://location.invalid');
      // Match the existing widget script's decimal-comma and whitespace handling.
      // Never collapse duplicates into a single authorized parameter.
      for(const key of ['lat','lon']) {
        if(url.searchParams.getAll(key).length!==1)throw Error('invalid_coordinates');
        url.searchParams.set(key,url.searchParams.get(key).trim().replace(',','.'));
      }
      const point=authorize(url);
      const work=Promise.resolve().then(()=>resolve(point));
      const deadline=new Promise((_,reject)=>{
        timer=setTimeout(()=>{
          // Finish an already-started shared refresh; never initiate a duplicate.
          try {schedule(work.catch(()=>{}));}catch{}
          reject(Error('location_unavailable'));
        },deadlineMs);
      });
      const result=await Promise.race([work,deadline]);
      const text=locationLabel(result,point),maxAge=locationClientMaxAge(result,now());
      if(maxAge>0)res.setHeader('Cache-Control',`private, max-age=${maxAge}, must-revalidate`);
      if(['MEMORY','SHARED','LOOKUP','STALE'].includes(result.state))res.setHeader('X-Location-Cache',result.state);
      return reply(text);
    }catch {
      // A native JSON source can display this same established fallback text.
      // No private request, coordinates, keys or provider error is logged/returned.
      return reply('Location unavailable');
    }finally {clearTimeout(timer);}
  };
}
export default createNativeLocationHandler();
