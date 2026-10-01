// Material-inspired NIGHT MASKS. All source terrain and city-light pixels are
// supplied by the locked renderer. Patterns below are decorative, not new
// bathymetry, weather, settlements or measured terrain data.
import {createCoastalChoices,exactCoastDistance} from './coastal-mask-styles.mjs';
export function createCreativeChoices({WIDTH,HEIGHT,elevation,ocean,pixelCoordinates,sun},{coastalOnly=false,fStronger=false,fStronger35=false,fStronger50=false,fStronger60=false}={}) {
  fStronger ||= fStronger35 || fStronger50 || fStronger60;
  const fGains=fStronger60?[1.60,1.60,1.16,1.08]:fStronger50?[1.50,1.50,1.16,1.08]:fStronger35?[1.35,1.35,1.16,1.08]:fStronger?[1.28,1.28,1.16,1.08]:[1,1,1,1];
  const fWide=fStronger50 || fStronger60;
  const fGaussianScales=fWide?[2,2,1.6,1.6]:[1.6,1.6,1.6,1.6];
  const n=WIDTH*HEIGHT,rad=Math.PI/180;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const gaussian=x=>Math.exp(-x*x);
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  const gx=new Float32Array(n),gy=new Float32Array(n),slope=new Float32Array(n);
  const coast=new Float32Array(n),bearing=new Float32Array(n);
  const seen=new Uint8Array(n),queue=new Uint32Array(n),majorLand=new Uint8Array(n);
  // Small islands stay in the approved map, but do not emit decorative rings.
  // This avoids dozens of tiny bullseyes competing with the approved lights.
  for(let start=0;start<n;start++){
    if(ocean[start] || seen[start])continue;
    let head=0,tail=1;queue[0]=start;seen[start]=1;
    const visit=p=>{if(!ocean[p] && !seen[p]){seen[p]=1;queue[tail++]=p;}};
    while(head<tail){
      const p=queue[head++],x=p%WIDTH;
      if(x>0)visit(p-1);if(x<WIDTH-1)visit(p+1);
      if(p>=WIDTH)visit(p-WIDTH);if(p<n-WIDTH)visit(p+WIDTH);
    }
    if(tail>=3000)for(let k=0;k<tail;k++)majorLand[queue[k]]=1;
  }
  const antiLat=-sun.latitude*rad,antiLon=(sun.longitude+180)*rad;
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    const p=y*WIDTH+x;
    gx[p]=(elevation[y*WIDTH+Math.min(WIDTH-1,x+1)]-elevation[y*WIDTH+Math.max(0,x-1)])/2;
    gy[p]=(elevation[Math.min(HEIGHT-1,y+1)*WIDTH+x]-elevation[Math.max(0,y-1)*WIDTH+x])/2;
    slope[p]=Math.max(0.0001,Math.hypot(gx[p],gy[p]));
    coast[p]=majorLand[p]?0:1e6;
    const pos=pixelCoordinates(x,y),lat=pos.latitude*rad,dl=pos.longitude*rad-antiLon;
    bearing[p]=Math.atan2(Math.sin(dl)*Math.cos(lat),Math.cos(antiLat)*Math.sin(lat)-Math.sin(antiLat)*Math.cos(lat)*Math.cos(dl));
  }
  // Chamfer distance from this approved artwork's own land-water edge.
  // It is used only as an engraving-spacing field, never as geographic depth.
  const q=Math.SQRT2;
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    const p=y*WIDTH+x;
    if(x>0)coast[p]=Math.min(coast[p],coast[p-1]+1);
    if(y>0){coast[p]=Math.min(coast[p],coast[p-WIDTH]+1);
      if(x>0)coast[p]=Math.min(coast[p],coast[p-WIDTH-1]+q);
      if(x<WIDTH-1)coast[p]=Math.min(coast[p],coast[p-WIDTH+1]+q);}
  }
  for(let y=HEIGHT-1;y>=0;y--)for(let x=WIDTH-1;x>=0;x--){
    const p=y*WIDTH+x;
    if(x<WIDTH-1)coast[p]=Math.min(coast[p],coast[p+1]+1);
    if(y<HEIGHT-1){coast[p]=Math.min(coast[p],coast[p+WIDTH]+1);
      if(x>0)coast[p]=Math.min(coast[p],coast[p+WIDTH-1]+q);
      if(x<WIDTH-1)coast[p]=Math.min(coast[p],coast[p+WIDTH+1]+q);}
  }
  if(coastalOnly){
    coast.set(exactCoastDistance(WIDTH,HEIGHT,majorLand));
    return createCoastalChoices({WIDTH,HEIGHT,ocean,coast});
  }
  const combine=layers=>{
    let a=0,rgb=[0,0,0];
    for(const [color,alpha] of layers){
      for(let c=0;c<3;c++)rgb[c]=color[c]*alpha+rgb[c]*(1-alpha);
      a=alpha+a*(1-alpha);
    }
    return a?[...rgb.map(v=>v/a),a]:[0,0,0,0];
  };
  return [
    {
      name:'World_Map_E_Smoked_Sapphire',title:'E · Smoked sapphire',
      inspiration:'Transparent sapphire overlays in world-time watches; own night-only material design with directional edge reflectance.',
      parameters:{baseOpacity:0.30,sheenOpacity:0.18,edgeMaximumOpacity:0.28,terrainBlur:false,refraction:false},
      sample(d,p,x,y){
        if(d<=0)return [0,0,0,0];
        const t=smooth(0,5,d),u=x/WIDTH,v=y/HEIGHT;
        const sheen=gaussian((u+0.20*v-0.65)/0.105)*(0.78+0.22*Math.cos(v*Math.PI));
        const dist=d/slope[p];
        const facing=clamp((-0.65*gx[p]-0.76*gy[p])/slope[p]);
        const bevel=gaussian((dist-2.5)/1.4)*facing*smooth(0,1,dist);
        return combine([[[35,49,61],0.30*t],[[85,105,122],0.18*t*sheen],[[84,103,115],0.28*bevel]]);
      }
    },
    {
      name:fStronger60?'World_Map_F_Engraved_Coasts_60_Percent':fStronger50?'World_Map_F_Engraved_Coasts_50_Percent':fStronger35?'World_Map_F_Engraved_Coasts_35_Percent':fStronger?'World_Map_F_Engraved_Coasts_Stronger':'World_Map_F_Engraved_Coasts',
      title:fStronger60?'F · Engraved coasts, inner lines +60%, width +25%':fStronger50?'F · Engraved coasts, inner lines +50%, width +25%':fStronger35?'F · Engraved coasts, inner lines +35%':fStronger?'F · Engraved coasts, stronger lines':'F · Engraved coasts',waterOnly:true,
      inspiration:'Coastally-radiating waterlines and shoreline vignettes described by Esri cartographers. Decorative offsets, not bathymetric contours.',
      parameters:{coastOffsetsSourcePixels:[10,27,51,84],
        lineWidthsSourcePixels:fGaussianScales.map(s=>2*Math.sqrt(Math.log(2))*s),
        lineWidthDefinition:'Gaussian full width at half maximum',
        gaussianWidthScalesSourcePixels:fGaussianScales,
        engravingWidthGains:fWide?[1.25,1.25,1,1]:[1,1,1,1],
        engravingSignalGains:fGains,
        minimumContourLandComponentPixels:3000,waterOpacity:0.34,edgeDegrees:6,landOverlay:0},
      sample(d,p){
        if(!ocean[p] || d<=0)return [0,0,0,0];
        const s=coast[p];let line=0;
        const offsets=[10,27,51,84],gains=fGains;
        for(let k=0;k<offsets.length;k++){
          const offset=offsets[k];
          line=Math.max(line,gaussian((s-offset)/fGaussianScales[k])*Math.exp(-offset/110)*gains[k]);
        }
        const coastShade=5*Math.exp(-s/40);
        const rgb=[5+coastShade+18*line,10+coastShade+23*line,13+coastShade+26*line];
        return [...rgb.map(v=>v/0.34),0.34*smooth(0,6,d)];
      }
    },
    {
      name:'World_Map_G_Guilloche_Enamel',title:'G · Guilloche enamel',waterOnly:true,
      inspiration:'Fine curved engraving beneath translucent enamel, as described by Patek Philippe and Breguet; adapted to a restrained ocean-only night texture.',
      parameters:{wavePitchSourcePixels:27,lineWidthSourcePixels:2.4,waterOpacity:0.36,edgeDegrees:5,landOverlay:0},
      sample(d,p,x,y){
        if(!ocean[p] || d<=0)return [0,0,0,0];
        const phase=(y+12*Math.sin(x/47)+3*Math.sin(x/13))/27;
        const distance=Math.abs(phase-Math.round(phase))*27;
        const line=gaussian(distance/1.5);
        const shade=0.6+0.4*gaussian((x/WIDTH-0.56)/0.26);
        const coastFade=smooth(2,12,coast[p]);
        const rgb=[7+12*line*shade*coastFade,14+18*line*shade*coastFade,19+20*line*shade*coastFade];
        return [...rgb.map(v=>v/0.36),0.36*smooth(0,5,d)];
      }
    },
    {
      name:'World_Map_H_Celestial_Atlas',title:'H · Celestial atlas',waterOnly:true,
      inspiration:'Fine meridian/parallel engraving in Breguet Marine Hora Mundi; here a decorative solar-centered graticule marks the night area without covering land.',
      parameters:{radialIntervalsSolarDegrees:12,bearingIntervalsDegrees:30,waterOpacity:0.32,edgeDegrees:5,landOverlay:0},
      sample(d,p){
        if(!ocean[p] || d<=0)return [0,0,0,0];
        const radialDistance=Math.abs(d/12-Math.round(d/12))*12/slope[p];
        const radial=gaussian(radialDistance/1.65)*smooth(5,9,d);
        const a=bearing[p]/(Math.PI/6);
        const angularDistance=Math.abs(a-Math.round(a))*(Math.PI/6);
        // Approximate raster-space spacing for a decorative solar graticule.
        const circumferenceScale=Math.sin((90-d)*rad)*WIDTH/(2*Math.PI);
        const rays=gaussian(angularDistance*circumferenceScale/1.3);
        const fine=Math.max(radial,0.6*rays)*(1-smooth(80,89,d));
        const rgb=[6+12*fine,12+19*fine,16+23*fine];
        return [...rgb.map(v=>v/0.32),0.32*smooth(0,5,d)];
      }
    }
  ];
}
