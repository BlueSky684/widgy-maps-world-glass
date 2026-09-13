import { PNG } from 'pngjs';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function blendPixel(png, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || a <= 0) return;
  const idx = (png.width * y + x) << 2;
  const sa = clamp(a,0,255)/255;
  const da = png.data[idx+3]/255;
  const oa = sa + da*(1-sa);
  if (oa <= 0) return;
  png.data[idx]   = Math.round((r*sa + png.data[idx]*da*(1-sa))/oa);
  png.data[idx+1] = Math.round((g*sa + png.data[idx+1]*da*(1-sa))/oa);
  png.data[idx+2] = Math.round((b*sa + png.data[idx+2]*da*(1-sa))/oa);
  png.data[idx+3] = Math.round(oa*255);
}

function circle(png,cx,cy,r,c,a) {
  const r2=r*r;
  for(let y=Math.floor(cy-r-1);y<=Math.ceil(cy+r+1);y++) {
    for(let x=Math.floor(cx-r-1);x<=Math.ceil(cx+r+1);x++) {
      const dx=x+0.5-cx, dy=y+0.5-cy;
      if(dx*dx+dy*dy<=r2) blendPixel(png,x,y,c[0],c[1],c[2],a);
    }
  }
}

export default async function handler(req,res) {
  try {
    const hLat = Number(req.headers['x-vercel-ip-latitude']);
    const hLon = Number(req.headers['x-vercel-ip-longitude']);

    const qLat = req.query.lat !== undefined ? Number(req.query.lat) : NaN;
    const qLon = req.query.lon !== undefined ? Number(req.query.lon) : NaN;

    const lat = Number.isFinite(qLat) ? qLat : hLat;
    const lon = Number.isFinite(qLon) ? qLon : hLon;

    if(!Number.isFinite(lat)||!Number.isFinite(lon)) {
      res.status(400).json({error:'No usable coordinates'});
      return;
    }

    const width=1536, height=963;
    const left=49, right=1455, top=93, bottom=860;
    const latNorth=83.5, latSouth=-56.0;

    // Longitude is linear across the approved artwork.
    const x = left + ((lon + 180) / 360) * (right-left);

    // Latitude is linear for this illustrative map's vertical layout.
    const y = top + ((latNorth-lat)/(latNorth-latSouth))*(bottom-top);

    const png=new PNG({width,height,colorType:6});
    png.data.fill(0);

    const blue=[10,132,255];
    circle(png,x,y,34,blue,30);
    circle(png,x,y,23,blue,78);
    circle(png,x,y,13,blue,255);
    circle(png,x,y,6,[255,255,255],255);

    console.log('WIDGY_MARKER_GEO',JSON.stringify({
      lat,lon,x:Math.round(x*10)/10,y:Math.round(y*10)/10,
      city:req.headers['x-vercel-ip-city']||null,
      country:req.headers['x-vercel-ip-country']||null
    }));

    const buffer=PNG.sync.write(png);
    res.setHeader('Content-Type','image/png');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.status(200).send(buffer);
  } catch(err) {
    res.status(500).json({error:err?.message||'marker failed'});
  }
}
