// Experimental solar-only raster. It carries no terrain, lights or location.
// The projection and twilight interval match the approved map renderer.
import {solarPosition} from './map-astronomy-location.js';

export function solarMask(date,width=1024,height=Math.round(width*1558/3306)){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>3306||height>1558)
    throw new RangeError('Invalid mask dimensions');
  const sun=solarPosition(date),rad=Math.PI/180;
  const sinD=Math.sin(sun.latitude*rad),cosD=Math.cos(sun.latitude*rad);
  const cosH=Float64Array.from({length:width},(_,x)=>Math.cos((-180+(x+.5)/width*360-sun.longitude)*rad));
  const night=new Uint8Array(width*height),day=new Uint8Array(width*height);
  for(let y=0;y<height;y++){
    const lat=(85-(y+.5)/height*146)*rad,a=Math.sin(lat)*sinD,b=Math.cos(lat)*cosD;
    for(let x=0;x<width;x++){
      const p=y*width+x,elevation=Math.asin(Math.max(-1,Math.min(1,a+b*cosH[x])))/rad;
      const t=Math.max(0,Math.min(1,-elevation/6));
      night[p]=Math.round(t*t*(3-2*t)*255);day[p]=255-night[p];
    }
  }
  return {width,height,night,day};
}
