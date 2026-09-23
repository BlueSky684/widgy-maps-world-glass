import {renderHomeMap,resolveLocation} from '../lib/home-map.js';
import {renderHomeMap as renderV113} from '../lib/home-map-v113.js';
import {renderHomeMap as renderV114} from '../lib/home-map-v114.js';
import {renderHomeMap as renderV115} from '../lib/home-map-v115.js';
import {renderHomeMap as renderV116} from '../lib/home-map-v116.js';
import {renderHomeMap as renderV119} from '../lib/home-map-v119.js';
import {renderHomeMap as renderV120} from '../lib/home-map-v120.js';
import {renderHomeMap as renderV122} from '../lib/home-map-v122.js';
import {renderHomeMap as renderV124} from '../lib/home-map-v124.js';
import {renderHomeMap as renderV125} from '../lib/home-map-v125.js';
import {renderHomeMap as renderV127} from '../lib/home-map-v127.js';
import {renderHomeMap as renderV128} from '../lib/home-map-v128.js';
import {renderHomeMap as renderV129} from '../lib/home-map-v129.js';
import {renderHomeMap as renderV130} from '../lib/home-map-v130.js';
import {renderHomeMap as renderV131} from '../lib/home-map-v131.js';
import {renderHomeMap as renderV132} from '../lib/home-map-v132.js';
import {renderHomeMap as renderV133} from '../lib/home-map-v133.js';

export default async function handler(req,res) {
  if(req.method&&req.method!=='GET'&&req.method!=='HEAD') return res.status(405).end();
  const url=new URL(req.url,'https://widgy-maps-world-glass.vercel.app');
  const location=resolveLocation(url,req.headers);
  // Render for server time, regardless of the client cache-busting timestamp.
  const date=new Date();
  try {
    // Older exported widgets retain their renderer, including the old default.
    const requested=url.searchParams.get('v');
    const revision=['113','115','116','119','120','121','122','124','125','127','128','129','130','131','132','133'].includes(requested)?requested:'114';
    const renderer=revision==='133'?renderV133:revision==='132'?renderV132:revision==='131'?renderV131:revision==='130'?renderV130:revision==='129'?renderV129:revision==='128'?renderV128:revision==='127'?renderV127:revision==='125'?renderV125:revision==='124'?renderV124:revision==='122'?renderV122:revision==='121'?renderHomeMap:revision==='120'?renderV120:revision==='119'?renderV119:revision==='116'?renderV116:revision==='115'?renderV115:revision==='113'?renderV113:renderV114;
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
