/**
 * Render geographic day/night materials using the restored Master artwork.
 * The generated layer supplies artistic relief only: published Natural Earth
 * polygons determine all land, coasts and borders; NASA determines city lights.
 * Hand-picked landmarks register the artistic material, NOT the geography.
 */
import sharp from 'sharp';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const W=2400,H=1188,NORTH=85,SOUTH=-65,SS=2;
const out='assets/earth/';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const project=(lon,lat)=>[(lon+180)/360*W,(NORTH-lat)/(NORTH-SOUTH)*H];
const source='assets/earth/master-material-v121.png';
const {data:art,info:ai}=await sharp(source).removeAlpha().raw().toBuffer({resolveWithObject:true});

// Control coordinates were measured on the restored 1774x887 material.
// They align appearance locally. The resulting coast and markers are sourced
// independently below, so generated shapes never define real coordinates.
const controls=[
 [-168,65,108,101],[-152,59,194,149],[-123,49,263,219],
 [-122.4,37.8,280,281],[-110,23,346,361],[-87,21,441,352],
 [-80,9,481,420],[-74,40.7,534,266],[-80.5,25,459,348],
 [-85,58,441,146],[-56,49,580,210],[-44,60,633,142],
 [-45,78,601,28],[-90,80,386,35],[-19,65,741,122],
 [-3,55,831,173],[-8,53,811,180],[-5.5,36,817,274],
 [-9,39,800,262],[10,62,922,123],[28,70,1003,79],
 [12.5,42,910,246],[30,39,1009,267],[35,32,1015,304],
 [18.5,-34,952,665],[-17,15,752,398],[51,12,1096,422],
 [50,-16,1071,562],[44,-25,1055,622],[32,31,991,308],
 [50,26,1109,326],[58,23,1138,370],[77,8,1204,426],
 [80,29,1225,296],[100,3,1325,482],[109,-7,1431,532],
 [133,-4,1535,518],[130,31,1446,290],[141,41,1517,225],
 [123,54,1456,163],[105,75,1294,63],[175,60,1688,132],
 [115,-22,1391,601],[153,-28,1577,635],[146,-43,1536,715],
 [172,-42,1640,737],[-80,0,463,461],[-81,-6,459,498],
 [-71,-33,493,650],[-67,-55,518,767],[-58,-35,550,663],
 [-35,-7,667,514],[-51,4,572,438],[-62,10,526,407]
];
const points=controls.map(([lon,lat,x,y])=>({u:(lon+180)/360,v:(NORTH-lat)/150,x:x/1774,y:y/887}));
// Thin-plate spline material registration, with affine terms and small smoothing.
function solve(A,b){
 const n=b.length,M=A.map((row,i)=>[...row,b[i]]);
 for(let c=0;c<n;c++){
  let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;
  if(Math.abs(M[p][c])<1e-12)throw Error('Singular registration');
  [M[p],M[c]]=[M[c],M[p]];const d=M[c][c];for(let j=c;j<=n;j++)M[c][j]/=d;
  for(let r=0;r<n;r++)if(r!==c){const s=M[r][c];for(let j=c;j<=n;j++)M[r][j]-=s*M[c][j];}
 }return M.map(row=>row[n]);
}
const radial=r2=>r2<1e-16?0:r2*Math.log(r2);
const n=points.length,A=Array.from({length:n+3},()=>Array(n+3).fill(0));
for(let i=0;i<n;i++){
 for(let j=0;j<n;j++)A[i][j]=radial((points[i].u-points[j].u)**2+(points[i].v-points[j].v)**2)+(i===j?1e-7:0);
 A[i][n]=A[n][i]=1;A[i][n+1]=A[n+1][i]=points[i].u;A[i][n+2]=A[n+2][i]=points[i].v;
}
const cx=solve(A,[...points.map(p=>p.x),0,0,0]),cy=solve(A,[...points.map(p=>p.y),0,0,0]);
function warp(u,v){
 let x=cx[n]+cx[n+1]*u+cx[n+2]*v,y=cy[n]+cy[n+1]*u+cy[n+2]*v;
 for(let i=0;i<n;i++){const r=radial((u-points[i].u)**2+(v-points[i].v)**2);x+=cx[i]*r;y+=cy[i]*r;}
 return [clamp(x)* (ai.width-1),clamp(y)*(ai.height-1)];
}
const geo=JSON.parse(readFileSync('work/map/countries-10m.geojson','utf8'));
const paths=[];
for(const f of geo.features){
 const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 for(const polygon of polys){
  paths.push(polygon.map(ring=>ring.map(([lon,lat],i)=>{
   const [x,y]=project(lon,lat);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join('')+'Z').join(''));
 }
}
const svg=attrs=>Buffer.from(`<svg width="${W*SS}" height="${H*SS}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${paths.map(p=>`<path d="${p}" fill-rule="evenodd" ${attrs}/>`).join('')}</svg>`);
async function raster(buf){return sharp(buf).resize(W,H).flatten({background:'#000'}).greyscale().raw().toBuffer();}
const land=await raster(svg('fill="white"'));
const borders=await raster(svg('fill="none" stroke="white" stroke-width="0.75" stroke-linejoin="round"'));
const blurred=await sharp(land,{raw:{width:W,height:H,channels:1}}).blur(7).greyscale().raw().toBuffer();
async function earth(path){
 const meta=await sharp(path).metadata(),top=Math.round((90-NORTH)/180*meta.height),bottom=Math.round((90-SOUTH)/180*meta.height);
 // Preserve all longitudes when changing the latitude/longitude display ratio.
 return sharp(path).extract({left:0,top,width:meta.width,height:bottom-top}).resize(W,H,{fit:'fill'}).removeAlpha().raw().toBuffer();
}
const nasa=await earth('work/map/blue-marble-september.jpg');
const night=await earth('work/map/black-marble-2016-3km.jpg');
const dayRGB=Buffer.alloc(W*H*3),nightRGB=Buffer.alloc(W*H*3),lightRGB=Buffer.alloc(W*H*3);
const intensity=Buffer.alloc(W*H);
for(let i=0;i<W*H;i++){
 const k=i*3;
 const signal=clamp((night[k]-.60*night[k+2]-.10*night[k+1]-1.6)/115);
 intensity[i]=Math.round(255*Math.pow(signal,.52));
}
const near=await sharp(intensity,{raw:{width:W,height:H,channels:1}}).blur(.75).greyscale().raw().toBuffer();
const bloom=await sharp(intensity,{raw:{width:W,height:H,channels:1}}).blur(2.3).greyscale().raw().toBuffer();
for(const b of [land,borders,blurred,intensity,near,bloom])if(b.length!==W*H)throw Error('Invalid single-channel geographic layer');
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const i=y*W+x,k=i*3,l=land[i]/255,e=borders[i]/255;
 let texture=.45;
 if(l>0){
  const [sx,sy]=warp((x+.5)/W,(y+.5)/H),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  let lum=0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
   const p=(Math.min(ai.height-1,iy+dy)*ai.width+Math.min(ai.width-1,ix+dx))*3;
   lum+=(art[p]*.26+art[p+1]*.55+art[p+2]*.19)*(dx?fx:1-fx)*(dy?fy:1-fy)/255;
  }
  const real=(nasa[k]*.26+nasa[k+1]*.55+nasa[k+2]*.19)/255;
  // Guard residual material coast mismatches with true-geographic terrain.
  texture=lum>.07?.84*lum+.16*real:.26+.28*real;
 }
 const relief=clamp(texture,.16,.83),shore=clamp((1-blurred[i]/255)*l);
 for(let c=0;c<3;c++){
  const d=[3,7,11][c]*(1-l)+([8,15,24][c]+relief*[106,114,123][c])*l+shore*[26,29,34][c];
  const nb=[1,3,5][c]*(1-l)+([5,9,15][c]+relief*[56,62,74][c])*l+shore*[12,15,20][c];
  dayRGB[k+c]=Math.round(d*(1-e*.30)+[135,145,156][c]*e*.30);
  nightRGB[k+c]=Math.round(nb*(1-e*.18)+[78,88,102][c]*e*.18);
  lightRGB[k+c]=Math.round(clamp((intensity[i]*[1.27,1.08,.78][c]+near[i]*[.22,.16,.08][c]+bloom[i]*[.09,.06,.025][c])/255)*255);
 }
}
for(const [name,data] of [['day',dayRGB],['night',nightRGB],['lights',lightRGB]]){
 await sharp(data,{raw:{width:W,height:H,channels:3}}).png().toFile(`${out}${name}-v121.png`);
}
const residuals=points.map(p=>{const [x,y]=warp(p.u,p.v);return Math.hypot(x-p.x*(ai.width-1),y-p.y*(ai.height-1));});
writeFileSync('work/map/master-material-registration-v121.json',JSON.stringify({
 sourceSha256:createHash('sha256').update(readFileSync(source)).digest('hex'),
 sourceSize:[ai.width,ai.height],outputSize:[W,H],controls,
 maxMaterialControlResidualPixels:Math.max(...residuals),
 meaning:'Artistic material registration only. Coastlines and borders use Natural Earth 1:10m; lights use NASA Black Marble 2016. Relief is illustrative, not elevation data.'
},null,2));
console.log(JSON.stringify({textures:'day/night/lights-v121.png',geometryFeatures:geo.features.length,maxMaterialControlResidualPixels:Math.max(...residuals)}));
