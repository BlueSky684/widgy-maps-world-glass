// Separate geographic linework keeps borders legible after widget downsampling.
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const W=2400,H=1188,SS=3;
const source=readFileSync('work/map/countries-10m.geojson');
if(createHash('sha256').update(source).digest('hex')!=='239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255') throw Error('Unexpected geographic source; review before regenerating');
const geo=JSON.parse(source),paths=[];
for(const f of geo.features){
 const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
 for(const polygon of polygons) paths.push(polygon.map(ring=>ring.map(([lon,lat],i)=>`${i?'L':'M'}${((lon+180)/360*W).toFixed(2)},${((85-lat)/150*H).toFixed(2)}`).join('')+'Z').join(''));
}
const svg=attrs=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W*SS}" height="${H*SS}" viewBox="0 0 ${W} ${H}">${paths.map(p=>`<path d="${p}" fill-rule="evenodd" ${attrs}/>`).join('')}</svg>`);
for(const [name,attrs] of [['land','fill="white"'],['borders','fill="none" stroke="white" stroke-width="1.65" stroke-linejoin="round"']]){
 await sharp(svg(attrs)).resize(W,H).flatten({background:'#000'}).greyscale().png().toFile(`assets/earth/${name}-v122.png`);
}
console.log('Prepared 2400 × 1188 land and border masks from 258 Natural Earth features');
