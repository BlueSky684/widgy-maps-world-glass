import {createMapRenderCache} from './map-render-cache.js';
export const LIVE_MAP_ORIGIN='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
export const LIVE_MAP_VERSION='r6-f50-minute-1';
export const minuteAt=time=>Math.floor(time/60000);
export const liveImageURL=minute=>`${LIVE_MAP_ORIGIN}/api/widgy-live-map?minute=${minute}&v=${LIVE_MAP_VERSION}`;
const noStore=res=>{
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('CDN-Cache-Control','no-store');
 res.setHeader('Vercel-CDN-Cache-Control','no-store');
};
// A separate, location-free public path. Headers/IP/cookies never influence
// its pixels. Existing private map and Calendar routes are not changed.
export function createLiveMapHandler({now=Date.now,render}={}){
 if(typeof render!=='function')throw Error('Map renderer required');
 const cache=createMapRenderCache({now,maxEntries:4,maxBytes:24*1024*1024});
 return async function handler(req,res){
  noStore(res);res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method && !['GET','HEAD'].includes(req.method)){
   res.setHeader('Allow','GET, HEAD');return res.status(405).end();
  }
  const url=new URL(req.url,'https://request.invalid'),p=url.searchParams;
  const bootstrap=p.size===1 && p.get('view')==='image';
  if(p.size===0){
   const minute=minuteAt(now());
   const data={image:liveImageURL(minute),mapTime:new Date(minute*60000).toISOString(),revision:LIVE_MAP_VERSION};
   res.setHeader('Content-Type','application/json; charset=utf-8');
   return req.method==='HEAD'?res.status(200).end():res.status(200).json(data);
  }
  const valid=p.size===2 && /^\d+$/.test(p.get('minute')||'') && p.get('v')===LIVE_MAP_VERSION;
  const minute=bootstrap?minuteAt(now()):Number(p.get('minute'));
  if((!bootstrap&&!valid)||!Number.isSafeInteger(minute)||minute<15778080||minute>=68374080)
   return res.status(400).json({error:'Invalid map revision or minute'});
  const date=new Date(minute*60000),started=performance.now();
  try{
   const result=await cache(`${LIVE_MAP_VERSION}:${minute}`,{
    expiresAt:now()+15*60000,renderedAt:date.toISOString(),
    render:()=>render({date,location:null,width:3306,presentation:'glass',diagnostic:false,atlas:'r6'})
   });
   const {entry}=result;
   if(!bootstrap){
    res.setHeader('Cache-Control','public, max-age=31536000, immutable');
    res.setHeader('CDN-Cache-Control','public, max-age=31536000, immutable');
    res.setHeader('Vercel-CDN-Cache-Control','public, max-age=31536000, immutable');
   }
   res.setHeader('Content-Type','image/png');res.setHeader('ETag',entry.etag);
   res.setHeader('X-Map-Rendered-At',entry.renderedAt);res.setHeader('X-Map-Cache',result.state);
   res.setHeader('X-Map-Revision',LIVE_MAP_VERSION);res.setHeader('X-Map-Location-Source','none');
   res.setHeader('Server-Timing',`map;dur=${(performance.now()-started).toFixed(1)}`);
   const tags=String(req.headers?.['if-none-match']||'').split(',').map(s=>s.trim().replace(/^W\//,''));
   if(tags.includes(entry.etag)||tags.includes('*'))return res.status(304).end();
   return req.method==='HEAD'?res.status(200).end():res.status(200).send(entry.png);
  }catch{
   noStore(res);return res.status(503).json({error:'Map rendering unavailable'});
  }
 };
}
