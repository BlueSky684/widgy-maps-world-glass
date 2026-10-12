import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root=new URL('../../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const write=(p,b)=>fs.writeFileSync(new URL(p,root),b);
const original=JSON.parse(read('tools/Widgy_Device_Glass_8.json'));
const widget=structuredClone(original);
const home=read('assets/home-glass/Home_Glass_Chrome_R4.svg').toString();
let svg=read('assets/device-glass/chrome-d8.svg').toString();
const gradient=(source,id)=>{
  const match=source.match(new RegExp(`<linearGradient id="${id}"[^>]*>[\\s\\S]*?<\\/linearGradient>`));
  assert(match,`Missing gradient ${id}`);return match[0];
};
// Copy the existing Home glass/rim palette and gradient direction exactly.
svg=svg.replace(gradient(svg,'base'),gradient(home,'glass').replace('id="glass"','id="base"'));
svg=svg.replace(gradient(svg,'rim'),gradient(home,'rim'));
assert(home.includes('fill="#091116" stroke="#35434e"'));
svg=svg.replace(gradient(svg,'well'),'<linearGradient id="well"><stop stop-color="#091116"/><stop offset="1" stop-color="#091116"/></linearGradient>');
svg=svg.replace(gradient(svg,'edge'),'<linearGradient id="edge"><stop stop-color="#35434e"/><stop offset="1" stop-color="#35434e"/></linearGradient>');
// Home has no diagonal cyan reflection; remove its color cast from Device.
svg=svg.replace(gradient(svg,'reflection'),'<linearGradient id="reflection"><stop stop-color="#d8efff" stop-opacity="0"/><stop offset="1" stop-color="#d8efff" stop-opacity="0"/></linearGradient>');
write('assets/device-glass/chrome-d9.svg',svg);
const render=s=>sharp(Buffer.from(s)).ensureAlpha().raw().toBuffer();
const blue='#2d9cff',group='<g transform="translate(0 -16)">';
const dot='<circle cx="79" cy="389" r="1.25" fill="#aeb7c6" stroke="none"/>';
assert.equal(svg.split(group).length,2);assert.equal(svg.split(dot).length,2);
const active=svg.replace(group,group.slice(0,-1)+` stroke="${blue}">`).replace(dot,dot.replace('#aeb7c6',blue));
const [normalPixels,bluePixels]=await Promise.all([render(svg),render(active)]);
const background=await sharp(normalPixels,{raw:{width:1060,height:1060,channels:4}}).withIccProfile('srgb').png({compressionLevel:9}).toBuffer();
write('assets/device-glass/chrome-d9.png',background);
widget['1'].find(n=>n.d0===16002)['2']='data:image/png;base64,'+background.toString('base64');
for(const spec of [{slug:'wifi',id:16003,box:[62,348,34,32]},{slug:'bluetooth',id:16004,box:[303,347,26,36]}]){
  const [x,y,w,h]=spec.box.map(n=>n*2),tile=Buffer.alloc(w*h*4);
  for(let row=0;row<h;row++)for(let col=0;col<w;col++){
    const from=((y+row)*1060+x+col)*4,to=(row*w+col)*4;
    bluePixels.copy(tile,to,from,from+4);
    if(row===0||col===0||row===h-1||col===w-1)assert.deepEqual(tile.subarray(to,to+4),normalPixels.subarray(from,from+4));
  }
  const png=await sharp(tile,{raw:{width:w,height:h,channels:4}}).withIccProfile('srgb').png({compressionLevel:9}).toBuffer();
  write(`assets/device-glass/${spec.slug}-on-d9.png`,png);
  widget['1'].find(n=>n.d0===spec.id)['2']='data:image/png;base64,'+png.toString('base64');
}
widget['3']='Widgy Device Glass 9';
widget['4']='Device Glass 9 — background palette matched to Home Glass: identical glass/rim gradients, #091116 panels and #35434E panel edges. The former diagonal cyan reflection is removed. Both embedded vivid-blue connectivity tiles use the new background. D8 layout, Bluetooth spacing, native status conditions, text, battery Circle Chart and all data providers are retained. 15 layers; no remote images or JavaScript. Native color matching still requires a side-by-side phone check.';
assert.deepEqual(widget['36'],original['36']);assert.equal(widget['1'].length,15);
for(const layer of widget['1']){
  const before=original['1'].find(n=>n.d0===layer.d0),after=structuredClone(layer);
  if([16002,16003,16004].includes(layer.d0))after['2']=before['2'];
  assert.deepEqual(after,before);
}
const raw=JSON.stringify(widget);assert(!/https?:\/\//.test(raw));
write('tools/Widgy_Device_Glass_9.json',raw);
console.log(JSON.stringify({widget:widget['3'],layers:15,backgroundBytes:background.length,jsonBytes:Buffer.byteLength(raw)}));
