import {renderHomeMap,resolveLocation} from '../lib/home-map.js';
import {renderHomeMap as renderV113} from '../lib/home-map-v113.js';

export default async function handler(req,res) {
  if(req.method&&req.method!=='GET'&&req.method!=='HEAD') return res.status(405).end();
  const url=new URL(req.url,'https://widgy-maps-world-glass.vercel.app');
  const location=resolveLocation(url,req.headers);
  // Render for server time, regardless of the client cache-busting timestamp.
  const date=new Date();
  try {
    const revision=url.searchParams.get('v')==='113'?'113':'114';
    const png=await (revision==='113'?renderV113:renderHomeMap)({date,location});
    res.setHeader('Content-Type','image/png');
    res.setHeader('Cache-Control','private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control','no-store');
    res.setHeader('X-Map-Revision',revision);
    res.setHeader('X-Map-Location-Source',location?.source||'unavailable');
    res.setHeader('X-Map-Rendered-At',date.toISOString());
    return req.method==='HEAD'?res.status(200).end():res.status(200).send(png);
  } catch {
    return res.status(500).json({error:'Map rendering unavailable'});
  }
}
