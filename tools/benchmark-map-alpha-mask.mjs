// Offline representation comparison to the current fast Appeared Off1 inputs.
// It is not a native Widgy colour-space, memory, latency or visibility test.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {renderMaskPair} from '../lib/map-mask-live.js';
import {renderAlphaMaskPair} from '../lib/map-mask-alpha.js';

const widths=[367,1101],parts=['day','night'];
const maps={};
for(const width of widths){
  maps[width]={};
  for(const part of parts)maps[width][part]=await sharp(readFileSync(new URL(
    '../assets/diagnostics/map-mask-live-1/'+part+'.png',import.meta.url)))
    .resize({width,kernel:'lanczos3'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
}
// Exhaust all scalar byte values; this identity is independent of map content.
for(let c=0;c<256;c++)for(let w=0;w<256;w++)
  assert.equal(Math.round(c*w/255),Math.round(c*(1-(255-w)/255)));
const rows=[];
for(const at of ['2026-10-06T09:35:00Z','2026-06-21T00:00:00Z','2026-12-21T12:00:00Z']){
  const epoch=Date.parse(at),old=await renderMaskPair(epoch),alpha=await renderAlphaMaskPair(epoch);
  const raw={};
  for(const part of parts){
    const a=await sharp(alpha[part]).raw().toBuffer({resolveWithObject:true});
    const b=await sharp(old[part]).raw().toBuffer();
    assert.equal(a.info.channels,4);
    for(let p=0;p<b.length/3;p++){
      assert.equal(a.data[p*4],0);assert.equal(a.data[p*4+1],0);assert.equal(a.data[p*4+2],0);
      assert.equal(a.data[p*4+3],255-b[p*3]);
    }
    raw[part]={old:old[part].length,alpha:alpha[part].length};
  }
  const resized={};
  for(const width of widths){
    const weights={};
    for(const part of parts){
      const {height}=maps[width][part].info;
      weights[part]={old:await sharp(old[part]).resize(width,height,{kernel:'lanczos3'}).raw().toBuffer(),
        alpha:await sharp(alpha[part]).resize(width,height,{kernel:'lanczos3'}).raw().toBuffer()};
    }
    const pixels=maps[width].day.data.length/3;
    let changedPixels=0,maxChannelDifference=0,sum=0;
    for(let p=0;p<pixels;p++){
      let changed=false;
      for(let c=0;c<3;c++){
        let oldSum=0,newSum=0;
        for(const part of parts){
          const colour=maps[width][part].data[p*3+c],w=weights[part];
          oldSum+=Math.round(colour*w.old[p*3]/255);
          newSum+=Math.round(colour*(255-w.alpha[p*4+3])/255);
        }
        const d=Math.abs(Math.min(255,oldSum)-Math.min(255,newSum));
        changed ||= d>0;sum+=d;maxChannelDifference=Math.max(maxChannelDifference,d);
      }
      if(changed)changedPixels++;
    }
    resized[width]={changedPixels,maxChannelDifference,meanAbsoluteChannelDifference:sum/(pixels*3)};
  }
  rows.push({at,bytes:raw,totalOldBytes:parts.reduce((s,p)=>s+raw[p].old,0),
    totalAlphaBytes:parts.reduce((s,p)=>s+raw[p].alpha,0),independentSharpSampling:resized});
}
console.log(JSON.stringify({kind:'black-alpha-vs-current-grayscale-mask',dimensions:[522,246],
  versions:{node:process.version,sharp:sharp.versions.sharp,vips:sharp.versions.vips},
  scalarCases:65536,losslessInverseAlpha:true,rows,limits:[
    'Reference is the current Appeared Off1 composition, which itself is not exact approved-renderer parity.',
    'This models byte-space RGB operations and independent Sharp lanczos3 resampling, not native Widgy colour management.',
    'All PNG RGB bytes are black; preventing a white mask plane does not guarantee a complete map, paired refresh or fast navigation.',
    'Static assets, source geometry, transition settings and approved masters are untouched.',
    'No native claim or automatic refresh schedule follows from these results.'
  ]},null,2));
