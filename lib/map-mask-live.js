import sharp from 'sharp';
import {solarMask} from './map-solar-mask.js';

export const MASK_LIVE=Object.freeze({revision:'live-1',width:522,height:246,bandRows:18,bucketMS:300000});
const glyphs={
  '0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],
  '2':[14,17,1,2,4,8,31],'3':[30,1,1,14,1,1,30],
  '4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],
  '6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],
  '8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,1,14],
  'D':[30,17,17,17,17,17,30],'N':[17,25,25,21,19,19,17],
  '/':[1,2,2,4,8,8,16],':':[0,4,4,0,4,4,0],' ':[0,0,0,0,0,0,0]
};
const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jerusalem',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function maskTimeLabel(date,part){
  if(!['day','night'].includes(part)||!Number.isFinite(date.getTime()))throw Error('invalid_mask_stamp');
  const p=Object.fromEntries(formatter.formatToParts(date).map(x=>[x.type,x.value]));
  return (part==='day'?'D':'N')+' '+p.day+'/'+p.month+' '+p.hour+':'+p.minute;
}
export function stampMask(data,date,part){
  const {width,height,bandRows}=MASK_LIVE;
  if(data.length!==width*height)throw Error('invalid_mask_size');
  const out=Buffer.from(data),label=maskTimeLabel(date,part),half=width/2,scale=2;
  out.fill(0,width*(height-bandRows));
  const left=(part==='day'?0:half)+Math.floor((half-label.length*6*scale)/2);
  const top=height-bandRows+2;
  for(let i=0;i<label.length;i++)for(let y=0;y<7;y++)for(let x=0;x<5;x++){
    if(!(glyphs[label[i]][y]&(1<<(4-x))))continue;
    for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++)out[(top+y*scale+dy)*width+left+i*6*scale+x*scale+dx]=255;
  }
  return out;
}
export async function renderMaskPair(epoch){
  const date=new Date(epoch),mask=solarMask(date,MASK_LIVE.width,MASK_LIVE.height);
  const entries=await Promise.all(['day','night'].map(async part=>{
    const pixels=stampMask(mask[part],date,part);
    const png=await sharp(pixels,{raw:{width:mask.width,height:mask.height,channels:1}})
      .withIccProfile('srgb').png({compressionLevel:6}).toBuffer();
    return [part,png];
  }));
  return Object.fromEntries(entries);
}
