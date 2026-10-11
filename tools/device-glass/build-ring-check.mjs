import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root=new URL('../../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const reference=read('tools/device-glass/native-ring-reference.json');
const device=read('tools/Widgy_Device_Glass_4.json');
const deviceRing=device['1'].find(n=>n.z==='9');
assert.equal(reference.constant['2'],'Custom Value');
assert.equal(reference.constant['21'],100);
assert.equal(reference.constant.z,'9');
const scalar=a=>({b:0,a:[{a:Number(a.toFixed(6)),b:1126,c:0,d:1126}]});
const frame=(n,x,y,w,h)=>{
  for(const [i,k] of ['b','c','d','e'].entries())n[k]=scalar([x,y,w,h][i]*1600/530);
  return n;
};
const cases=[{p:25,x:145,y:180},{p:50,x:385,y:180},{p:75,x:145,y:390},{p:100,x:385,y:390}];
const rings=cases.map(({p,x,y},i)=>{
  const n=structuredClone(reference.constant);
  n.d0=i+1;n.s=`Fixed ${p}% · Ring Chart`;
  n['21']=p; // Observed native Custom Value field, not exclusive maximum (20).
  delete n.h; // Reference's full-circle backdrop was only 5% opaque.
  n['10']=deviceRing['10'];
  n['8']=structuredClone(deviceRing['8']);
  n['9']=structuredClone(deviceRing['9']);
  return frame(n,x-70.25,y-70.25,140.5,140.5);
});
const point=(x,y,r,angle)=>[x+r*Math.sin(angle),y-r*Math.cos(angle)];
const line=(a,b,color,width=1.5)=>`<path d="M${a.join(' ')}L${b.join(' ')}" stroke="${color}" stroke-width="${width}"/>`;
const panels=cases.map(({p,x,y})=>{
  const angle=p/100*Math.PI*2;
  const ticks=[0,1,2,3].map(q=>line(point(x,y,76,q*Math.PI/2),point(x,y,81,q*Math.PI/2),'#607787')).join('');
  const end=line(point(x,y,74,angle),point(x,y,87,angle),'#ffffff',2.5)+line(point(x,y,51,angle),point(x,y,60,angle),'#ffffff',2.5);
  return `<circle cx="${x}" cy="${y}" r="68" fill="none" stroke="#263b46" stroke-width="4.5"/>${ticks}${end}<text x="${x}" y="${y+8}" text-anchor="middle" font-size="34" font-weight="600" fill="#f4f7fa">${p}%</text><text x="${x}" y="${y+31}" text-anchor="middle" font-size="13" fill="#aeb7c6">FIXED VALUE</text>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="1060" viewBox="0 0 530 530"><rect width="530" height="530" fill="#09151d"/><g font-family="DejaVu Sans,sans-serif"><text x="265" y="47" text-anchor="middle" fill="#f4f7fa" font-size="24" font-weight="600">DEVICE · RING CHECK</text><text x="265" y="73" text-anchor="middle" fill="#aeb7c6" font-size="14">White marks = expected arc endpoint</text>${panels}<text x="265" y="506" text-anchor="middle" fill="#aeb7c6" font-size="13">Constant values · Independent of battery</text></g></svg>`;
const png=await sharp(Buffer.from(svg)).png({palette:true,colours:128,dither:0,compressionLevel:9}).toBuffer();
const bg=frame({z:'5',d0:5,s:'Reference ticks and fixed-value labels',1:'Web URL',2:'data:image/png;base64,'+png.toString('base64'),3:true},0,0,530,530);
const widget={0:device['0'],1:[...rings,bg],2:device['2'],3:'Widgy Device Ring Check 1',4:'Diagnostic only. Native Ring Chart / Custom Value = 25, 50, 75, 100. Constant field 21 is copied from the supplied Battery Info export by Bo Nyi. All four rings use the Device Glass frame size and thickness. White marks indicate mathematically expected endpoints. Static labels state test inputs, not live battery readings. Native iPhone rendering remains unverified.',5:'Device Glass diagnostics',6:device['6'],20:false,21:false,a2:6};
assert.deepEqual(rings.map(n=>n['21']),[25,50,75,100]);
assert.equal(widget['1'].length,5);
const out=JSON.stringify(widget);
assert(!out.includes('Battery Level'));assert(!out.includes('JavaScript'));assert(!/https?:\/\//.test(out));
fs.writeFileSync(new URL('tools/Widgy_Device_Ring_Check_1.json',root),out);
fs.mkdirSync(new URL('work/device-glass',root),{recursive:true});
fs.writeFileSync(new URL('work/device-glass/ring-check-reference.png',root),png);
console.log(JSON.stringify({widget:widget['3'],layers:5,values:rings.map(n=>n['21']),bytes:Buffer.byteLength(out),nativeValidation:'pending'}));
