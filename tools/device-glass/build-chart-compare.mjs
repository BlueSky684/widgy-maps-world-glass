import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const device=read('tools/Widgy_Device_Glass_4.json');
const reference=read('tools/device-glass/native-circle-reference.json');
const scalar=a=>({b:0,a:[{a:Number(a.toFixed(6)),b:1126,c:0,d:1126}]});
const frame=(n,x,y,w,h)=>{
  for(const [i,k] of ['b','c','d','e'].entries())n[k]=scalar([x,y,w,h][i]*1600/530);
  return n;
};
assert.equal(reference.layer.z,'8');
assert.equal(reference.layer['1'],'1-Segment Info');
assert.equal(reference.layer['2'],'Battery Level');
const originalRing=device['1'].find(n=>n.z==='9');
const circle=frame(structuredClone(reference.layer),74.75,159.75,140.5,140.5);
circle.d0=1;circle.s='Circle Chart · Live battery';circle.f=originalRing['10'];
const ring=frame(structuredClone(originalRing),314.75,159.75,140.5,140.5);
ring.d0=2;ring.s='Ring Chart · Live battery';delete ring['20'];
// Both charts use their native defaults and the same source. Do not guess the
// Circle Chart's hole, angle, label, custom-value or inactive-material fields.
const text=frame({z:'1',d0:3,s:'Battery percentage · Native text',1:'System Medium',f:'uicol_white-100',66:[{5:'System Info',6:'Battery Level'}]},175,360,180,80);
const markers=(x,y)=>[0,1,2,3].map(q=>{
  const a=q*Math.PI/2;
  const at=r=>[x+r*Math.sin(a),y-r*Math.cos(a)].join(' ');
  return `<path d="M${at(77)}L${at(87)}" stroke="#f4f7fa" stroke-width="2"/>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="1060" viewBox="0 0 530 530"><rect width="530" height="530" fill="#09151d"/><g font-family="DejaVu Sans,sans-serif"><text x="265" y="49" text-anchor="middle" fill="#f4f7fa" font-size="23" font-weight="600">DEVICE · CHART COMPARE</text><text x="265" y="77" text-anchor="middle" fill="#aeb7c6" font-size="14">Same live battery source · Native charts</text><text x="145" y="120" text-anchor="middle" fill="#f4f7fa" font-size="18">CIRCLE CHART</text><text x="385" y="120" text-anchor="middle" fill="#f4f7fa" font-size="18">RING CHART</text><circle cx="385" cy="230" r="68" fill="none" stroke="#263b46" stroke-width="4.5"/>${markers(145,230)}${markers(385,230)}<text x="265" y="354" text-anchor="middle" fill="#aeb7c6" font-size="14">WIDGY BATTERY LEVEL</text><text x="265" y="469" text-anchor="middle" fill="#aeb7c6" font-size="13">White marks: quarter turns</text><text x="265" y="494" text-anchor="middle" fill="#aeb7c6" font-size="13">Circle appearance uses exported defaults</text></g></svg>`;
const png=await sharp(Buffer.from(svg)).png({palette:true,colours:128,dither:0,compressionLevel:9}).toBuffer();
const bg=frame({z:'5',d0:4,s:'Chart labels and quarter-turn markers',1:'Web URL',2:'data:image/png;base64,'+png.toString('base64'),3:true},0,0,530,530);
const widget={0:device['0'],1:[text,circle,ring,bg],2:device['2'],3:'Widgy Device Chart Compare 1',4:'Diagnostic only: native Circle Chart versus native Ring Chart, both 1-Segment Info / Battery Level. Same 140.5px square frame size. Circle is the supplied 18:35:32 export with only frame/color/name/id changed; no guessed circle geometry fields. The Ring uses Device Glass thickness. Text is native System Info / Battery Level. Live data freshness remains controlled by Widgy. Native iPhone rendering pending.',5:'Device Glass diagnostics',6:device['6'],20:false,21:false,a2:5};
const raw=JSON.stringify(widget);
assert.equal(widget['1'].length,4);
assert.equal(circle['2'],ring['2']);assert.equal(circle['1'],ring['1']);
assert(!/https?:\/\//.test(raw));
fs.writeFileSync(new URL('tools/Widgy_Device_Chart_Compare_1.json',root),raw);
console.log(JSON.stringify({widget:widget['3'],layers:4,bytes:Buffer.byteLength(raw),nativeValidation:'pending'}));
