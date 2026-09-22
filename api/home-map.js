import {renderHomeMap,resolveLocation} from '../lib/home-map.js';
import {renderHomeMap as renderV113} from '../lib/home-map-v113.js';
import {renderHomeMap as renderV114} from '../lib/home-map-v114.js';
import {renderHomeMap as renderV115} from '../lib/home-map-v115.js';
import {renderHomeMap as renderV116} from '../lib/home-map-v116.js';
import {renderHomeMap as renderV119} from '../lib/home-map-v119.js';

export default async function handler(req,res) {
  if(req.method&&req.method!=='GET'&&req.method!=='HEAD') return res.status(405).end();
  const url=new URL(req.url,'https://widgy-maps-world-glass.vercel.app');
  const location=resolveLocation(url,req.headers);
  // Render for server time, regardless of the client cache-busting timestamp.
  const date=new Date();
  try {
    // Older exported widgets retain their renderer, including the old default.
    const requested=url.searchParams.get('v');
    const revision=['113','115','116','119','120'].includes(requested)?requested:'114';
    const renderer=revision==='120'?renderHomeMap:revision==='119'?renderV119:revision==='116'?renderV116:revision==='115'?renderV115:revision==='113'?renderV113:renderV114;
    const png=await renderer({date,location});
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
