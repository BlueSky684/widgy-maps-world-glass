// Approved F +50% engraving, derived only from the approved terrain raster.
// This field is fixed to coasts; the live solar gate is applied separately.
export const ENGRAVING = Object.freeze({gains:[1.5,1.5,1.16,1.08],scales:[2,2,1.6,1.6],offsets:[10,27,51,84],opacity:.34});
// R6 opt-in: slightly stronger, wider atlas lines for the small widget canvas.
// R10: +5% line intensity over R6 (1.20 -> 1.26); same width, coast geometry,
// ocean shade and live night gate. Daytime terrain and land lights are untouched.
export const ENGRAVING_R6 = Object.freeze({...ENGRAVING,
  gains:ENGRAVING.gains.map(v=>v*1.26),scales:ENGRAVING.scales.map(v=>v*1.15)});
export function buildEngraving(terrain, WIDTH, HEIGHT, project, style = ENGRAVING) {
  const n=WIDTH*HEIGHT,ocean=new Uint8Array(n),queue=new Uint32Array(n);
  let head=0,tail=0;
  const visit=p=>{const i=p*4;if(!ocean[p]&&terrain[i]===0&&terrain[i+1]===0&&terrain[i+2]===0){ocean[p]=1;queue[tail++]=p;}};
  for(let x=0;x<WIDTH;x++){visit(x);visit((HEIGHT-1)*WIDTH+x);}
  for(let y=0;y<HEIGHT;y++){visit(y*WIDTH);visit(y*WIDTH+WIDTH-1);}
  for(const [lat,lon] of [[35,20],[43,35],[20,38],[27,51],[42,51],[56,19]]){
    const q=project(lat,lon);visit(Math.floor(q.y)*WIDTH+Math.floor(q.x));
  }
  while(head<tail){const p=queue[head++],x=p%WIDTH;
    if(x>0)visit(p-1);if(x<WIDTH-1)visit(p+1);
    if(p>=WIDTH)visit(p-WIDTH);if(p<n-WIDTH)visit(p+WIDTH);
  }
  const seen=new Uint8Array(n),majorLand=new Uint8Array(n),coast=new Float32Array(n);
  for(let start=0;start<n;start++){
    if(ocean[start]||seen[start])continue;
    head=0;tail=1;queue[0]=start;seen[start]=1;
    const land=p=>{if(!ocean[p]&&!seen[p]){seen[p]=1;queue[tail++]=p;}};
    while(head<tail){const p=queue[head++],x=p%WIDTH;
      if(x>0)land(p-1);if(x<WIDTH-1)land(p+1);
      if(p>=WIDTH)land(p-WIDTH);if(p<n-WIDTH)land(p+WIDTH);
    }
    if(tail>=3000)for(let k=0;k<tail;k++)majorLand[queue[k]]=1;
  }
  for(let p=0;p<n;p++)coast[p]=majorLand[p]?0:1e6;
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
  const rgb=Buffer.alloc(n*3);
  for(let p=0;p<n;p++)if(ocean[p]){
    const s=coast[p];let line=0;
    for(let k=0;k<4;k++){
      const offset=style.offsets[k],v=(s-offset)/style.scales[k];
      line=Math.max(line,Math.exp(-v*v)*Math.exp(-offset/110)*style.gains[k]);
    }
    const shade=5*Math.exp(-s/40);
    const values=[5+shade+18*line,10+shade+23*line,13+shade+26*line];
    for(let c=0;c<3;c++)rgb[p*3+c]=Math.round(values[c]/style.opacity);
  }
  return {ocean,rgb};
}
