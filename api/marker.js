import { PNG } from 'pngjs';

function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

function mercatorY(lat){
  const safe=clamp(lat,-85,85);
  const rad=safe*Math.PI/180;
  return Math.log(Math.tan(Math.PI/4+rad/2));
}

function blend(p,x,y,r,g,b,a){
  if(x<0||y<0||x>=p.width||y>=p.height||a<=0)return;
  const i=(p.width*y+x)<<2;
  const sa=clamp(a,0,255)/255, da=p.data[i+3]/255;
  const oa=sa+da*(1-sa);
  if(oa<=0)return;
  p.data[i]=Math.round((r*sa+p.data[i]*da*(1-sa))/oa);
  p.data[i+1]=Math.round((g*sa+p.data[i+1]*da*(1-sa))/oa);
  p.data[i+2]=Math.round((b*sa+p.data[i+2]*da*(1-sa))/oa);
  p.data[i+3]=Math.round(oa*255);
}

function circle(p,cx,cy,r,c,a){
  const r2=r*r;
  for(let y=Math.floor(cy-r-1);y<=Math.ceil(cy+r+1);y++)
    for(let x=Math.floor(cx-r-1);x<=Math.ceil(cx+r+1);x++){
      const dx=x+.5-cx,dy=y+.5-cy;
      if(dx*dx+dy*dy<=r2)blend(p,x,y,c[0],c[1],c[2],a);
    }
}

export default async function handler(req,res){
  try{
    const hLat=Number(req.headers['x-vercel-ip-latitude']);
    const hLon=Number(req.headers['x-vercel-ip-longitude']);
    const qLat=req.query.lat!==undefined?Number(req.query.lat):NaN;
    const qLon=req.query.lon!==undefined?Number(req.query.lon):NaN;

    const lat=Number.isFinite(qLat)?qLat:hLat;
    const lon=Number.isFinite(qLon)?qLon:hLon;

    if(!Number.isFinite(lat)||!Number.isFinite(lon)){
      res.status(400).json({error:'No usable coordinates'}); return;
    }

    const width=1536, height=963;
    const padX=34, padTop=40, innerW=1468, innerH=895;

    const xNorm=(lon-(-180.0))/(360.0);

    const topM=mercatorY(85.0);
    const bottomM=mercatorY(-58.0);
    const curM=mercatorY(lat);
    const yNorm=(topM-curM)/(topM-bottomM);

    const x=padX+xNorm*innerW;
    const y=padTop+yNorm*innerH;

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
  }catch(err){
    res.status(500).json({error:err?.message||'marker failed'});
  }
}
