import sharp from 'sharp';
import {solarMask} from './map-solar-mask.js';
import {MASK_LIVE,stampMask} from './map-mask-live.js';

export const MASK_ALPHA=Object.freeze({...MASK_LIVE,revision:'alpha-1'});

// In byte-space arithmetic, Normal black at alpha=(255-weight) over an
// opaque colour C gives C*weight/255, like the original grayscale Multiply.
// All colour channels stay zero: the PNG cannot itself display a white plane.
// This does not ensure that Widgy presents the complete group atomically.
export async function renderAlphaMaskPair(epoch){
  const date=new Date(epoch),mask=solarMask(date,MASK_ALPHA.width,MASK_ALPHA.height);
  const entries=await Promise.all(['day','night'].map(async part=>{
    const weights=stampMask(mask[part],date,part),rgba=Buffer.alloc(weights.length*4);
    for(let p=0;p<weights.length;p++)rgba[p*4+3]=255-weights[p];
    const png=await sharp(rgba,{raw:{width:mask.width,height:mask.height,channels:4}})
      .withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
    return [part,png];
  }));
  return Object.fromEntries(entries);
}
