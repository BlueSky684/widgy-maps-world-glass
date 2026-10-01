// Three alternatives to F. These are decorative night-water overlays only;
// no source terrain, coast geometry, night lights or bathymetric data changes.
export function exactCoastDistance(width,height,majorLand) {
  // Separable squared Euclidean distance transform. Circular offsets avoid the
  // faint octagonal corners of a chamfer approximation on wide engravings.
  const size=Math.max(width,height),f=new Float64Array(size),d=new Float64Array(size);
  const v=new Int32Array(size),z=new Float64Array(size+1),grid=new Float64Array(width*height);
  const transform=n=>{
    let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
    for(let q=1;q<n;q++){
      let s;
      do{
        const j=v[k];s=((f[q]+q*q)-(f[j]+j*j))/(2*(q-j));
        if(s>z[k])break;
        k--;
      }while(k>=0);
      k++;v[k]=q;z[k]=s;z[k+1]=Infinity;
    }
    k=0;
    for(let q=0;q<n;q++){
      while(z[k+1]<q)k++;
      d[q]=(q-v[k])*(q-v[k])+f[v[k]];
    }
  };
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++)f[x]=majorLand[y*width+x]?0:1e12;
    transform(width);
    for(let x=0;x<width;x++)grid[y*width+x]=d[x];
  }
  const out=new Float32Array(width*height);
  for(let x=0;x<width;x++){
    for(let y=0;y<height;y++)f[y]=grid[y*width+x];
    transform(height);
    for(let y=0;y<height;y++)out[y*width+x]=Math.sqrt(d[y]);
  }
  return out;
}

export function createCoastalChoices({WIDTH,HEIGHT,ocean,coast}) {
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const gauss=x=>Math.exp(-x*x);
  const masked=(rgb,d)=>[...rgb.map(v=>Math.max(0,v)/0.36),0.36*smooth(0,6,d)];
  return [
    {
      name:'World_Map_I_Relief_Engraving',title:'I · Relief engraving',waterOnly:true,
      inspiration:'Directional coast bevels described by John Nelson at Esri; applied to decorative waterlines derived only from the approved coastline.',
      parameters:{coastOffsetsSourcePixels:[9,22,42,72,112],directionalRelief:true,waterOpacity:0.36,edgeDegrees:6,landOverlay:0},
      sample(d,p,x,y){
        if(!ocean[p] || d<=0)return [0,0,0,0];
        const s=coast[p];
        const dx=coast[y*WIDTH+Math.min(WIDTH-1,x+4)]-coast[y*WIDTH+Math.max(0,x-4)];
        const dy=coast[Math.min(HEIGHT-1,y+4)*WIDTH+x]-coast[Math.max(0,y-4)*WIDTH+x];
        const facing=(-0.66*dx-0.75*dy)/Math.max(0.001,Math.hypot(dx,dy));
        const lit=0.30+0.70*clamp((facing+0.2)/1.2);
        let light=0,shadow=0;
        for(const offset of [9,22,42,72,112]){
          const fade=Math.exp(-offset/115);
          light=Math.max(light,gauss((s-offset-1)/1.8)*fade);
          shadow=Math.max(shadow,gauss((s-offset+2)/1.8)*fade);
        }
        const shore=gauss((s-4)/4)*lit;
        return masked([4+32*light*lit+8*shore-3*shadow,
          9+34*light*lit+9*shore-5*shadow,13+36*light*lit+10*shore-7*shadow],d);
      }
    },
    {
      name:'World_Map_J_Bronze_Inlay',title:'J · Bronze inlay',waterOnly:true,
      inspiration:'Own restrained metal-inlay interpretation of classic decorative coastal waterlines; warm engraving complements the original amber lights without altering them.',
      parameters:{coastOffsetsSourcePixels:[14,48,103],pairedLineOffsetSourcePixels:5,waterOpacity:0.36,edgeDegrees:6,landOverlay:0},
      sample(d,p){
        if(!ocean[p] || d<=0)return [0,0,0,0];
        const s=coast[p];let warm=0,cool=0;
        for(const offset of [14,48,103]){
          const fade=Math.exp(-offset/135);
          warm=Math.max(warm,gauss((s-offset)/1.8)*fade);
          cool=Math.max(cool,gauss((s-offset-5)/1.2)*fade);
        }
        return masked([5+39*warm+4*cool,10+25*warm+8*cool,13+9*warm+10*cool],d);
      }
    },
    {
      name:'World_Map_K_Maritime_Etching',title:'K · Maritime etching',waterOnly:true,
      inspiration:'Historical coastal-rake hatching demonstrated by Esri. Fine strokes taper away from the source coastline; decorative, not currents or ocean-depth data.',
      parameters:{hatchPitchSourcePixels:18,maximumReachSourcePixels:115,waterOpacity:0.36,edgeDegrees:6,landOverlay:0},
      sample(d,p,x,y){
        if(!ocean[p] || d<=0)return [0,0,0,0];
        const s=coast[p],reach=1-smooth(15,115,s);
        const phase=(y+0.18*x)/18;
        const lineDistance=Math.abs(phase-Math.round(phase))*18;
        const hatch=gauss(lineDistance/(0.6+1.3*reach))*reach*smooth(1,5,s);
        const shore=4*Math.exp(-s/30);
        return masked([5+shore+20*hatch,10+shore+24*hatch,13+shore+27*hatch],d);
      }
    }
  ];
}
