import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {PNG} from 'pngjs';

// Presentation-only crops, with no color/contrast adjustment or resizing.
const root='/workspace/scratch/3fac4a755ada';
const names=['World_Map_F_Engraved_Coasts','World_Map_F_Engraved_Coasts_Stronger'];
const layers=names.map(name=>PNG.sync.read(readFileSync(`work/day-night/${name}-layer.png`)));
let alphaMismatches=0;
for(let i=3;i<layers[0].data.length;i+=4)if(layers[0].data[i]!==layers[1].data[i])alphaMismatches++;
if(alphaMismatches)throw Error('Strengthening changed mask coverage');
const crop={left:1280,top:420,width:650,height:420};
const margin=18,labelHeight=46,gap=14,width=crop.width+margin*2;
const height=margin*2+(crop.height+labelHeight)*2+gap;
const label=(text)=>Buffer.from(`<svg width="${crop.width}" height="${labelHeight}"><text x="0" y="29" fill="#cbd1d7" font-family="DejaVu Sans,sans-serif" font-size="19">${text}</text></svg>`);
const inputs=[];
for(let k=0;k<names.length;k++){
  const top=margin+k*(crop.height+labelHeight+gap);
  inputs.push({input:label(k?'F / STRONGER ENGRAVING':'F / ORIGINAL ENGRAVING'),left:margin,top});
  inputs.push({input:await sharp(`${root}/deliverables/${names[k]}.png`).extract(crop).toBuffer(),left:margin,top:top+labelHeight});
}
const output=`${root}/deliverables/World_Map_F_Engraving_Comparison.png`;
await sharp({create:{width,height,channels:3,background:'#0d1014'}}).composite(inputs).withIccProfile('srgb').png({compressionLevel:9}).toFile(output);
const paths=[`${root}/deliverables/${names[1]}.png`,output];
const verification=paths.map(path=>{
  const png=PNG.sync.read(readFileSync(path));
  return {path,width:png.width,height:png.height,decodedPixelSha256:createHash('sha256').update(png.data).digest('hex')};
});
const report={maskAlphaMismatches:alphaMismatches,crop,engravingSignalGains:[1.28,1.28,1.16,1.08],files:verification};
writeFileSync('work/day-night/f-strengthening-verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
