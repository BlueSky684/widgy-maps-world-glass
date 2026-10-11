import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {C,DIAL,READINGS,nativeBox,ringBox,staticArtwork,layoutProof} from './device-glass/design.mjs';
import {NATIVE_STEPS_RING} from './native-steps-ring.js';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const write=(p,data)=>fs.writeFileSync(new URL(p,root),data);
const original=JSON.parse(read('tools/device-glass/native-source.json'));
assert.equal(original['3'],'iPhone Status');
const widget=structuredClone(original);
const old=id=>{const n=original['1'].find(n=>n.d0===id);assert(n,`Missing source ${id}`);return structuredClone(n);};
const scalar=(a,k=1126)=>({b:0,a:[{a:Math.round(a*1e6)/1e6,b:k,c:0,d:k}]});
const frame=(n,box)=>{for(const [i,k]of ['b','c','d','e'].entries())n[k]=scalar(box[i]*1600/530);return n;};
const colors={};
widget['2']=Object.entries(C).map(([name,hex],i)=>{
  const key='hexcol_DE71CE0100004000A000'+String(i+1).padStart(12,'0');
  colors[name]=key+'-100';return key+'-'+hex.slice(1).toUpperCase()+'FF';
});
const readings=READINGS.map(r=>{
  const n=old(r.id);n.s=r.name;n['1']='Phenomena-'+(r.weight||'Regular');
  n['2']=scalar(r.align||0);n.f=colors[r.color||'white'];
  // Preserve native number/precision settings (field 9) as well as provider 66.
  if(r.id===15003){n['33']='%';n['34']='';} // smaller percent sign in artwork
  if(r.id===15022){delete n['33'];delete n['34'];} // native units, static Free space
  if(r.id===15037){n['33']='h';n['34']=' h';} // IMG_0252: native output was 23.4h
  return frame(n,nativeBox(r));
});
const charging=frame(old(15606),[136,264,14,18]);charging.f=colors.muted;
const tap=frame(old(15602),[450,35,60,60]);
// Schema copied from the phone-exported native ring, not an invented chart.
// Thickness is the first device-trial calibration; the phone is authoritative.
// Chart categories differ from text categories. Battery belongs to the chart
// category 1-Segment Info; System Info is a text source, and drew no arc in D1.
const ring=frame({...structuredClone(NATIVE_STEPS_RING),d0:16001,s:'Battery · Native ring',1:'1-Segment Info',2:'Battery Level',20:100,
  8:scalar(100*DIAL.stroke/(DIAL.r+DIAL.stroke/2),1403),9:scalar(100*DIAL.stroke/(DIAL.r+DIAL.stroke/2),1404),10:colors.lime},ringBox());
fs.mkdirSync(new URL('assets/device-glass/',root),{recursive:true});
const svg=staticArtwork();
// 8-bit palette retains 256 colours and full alpha, avoids a multi-megabyte
// clipboard string. Artwork is flattened once; live values are never baked in.
const png=await sharp(Buffer.from(svg)).png({palette:true,colours:256,dither:0,compressionLevel:9}).toBuffer();
write('assets/device-glass/chrome-d3.svg',svg);
write('assets/device-glass/chrome-d3.png',png);
const background=frame({z:'5',d0:16002,s:'Device · Glass, labels and icons',1:'Web URL',2:'data:image/png;base64,'+png.toString('base64'),3:true},[0,0,530,530]);
widget['1']=[tap,...readings,charging,ring,background];
widget['3']='Widgy Device Glass 3';widget.a2=16003;
widget['4']='Device Glass 3 — lower panel spacing after IMG_0256. The complete lower panel and its six live text layers move up six design pixels. Its bottom corner radius increases from 15 to 36 pixels to keep a clear inset from the outer continuous rim. Same 13 layers, eight native sources, typography, battery ring and original charging/refresh behavior. No remote artwork or custom JavaScript. Revised panel spacing still requires iPhone validation. Estimated battery time is Widgy’s estimate.';
assert.equal(widget['1'].length,13);
write('tools/Widgy_Device_Glass_3.json',JSON.stringify(widget));
fs.mkdirSync(new URL('work/device-glass/',root),{recursive:true});
await sharp(Buffer.from(layoutProof(svg))).png().toFile(new URL('work/device-glass/layout-proof.png',root).pathname);
const report={name:widget['3'],layers:13,originalLayers:107,artworkBytes:png.length,jsonBytes:Buffer.byteLength(JSON.stringify(widget)),artworkSHA256:createHash('sha256').update(png).digest('hex'),nativeProviders:8,customScripts:0,remoteArtworkURLs:0,phoneValidated:false};
write('work/device-glass/build-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
