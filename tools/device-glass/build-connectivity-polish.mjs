import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root=new URL('../../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const write=(p,b)=>fs.writeFileSync(new URL(p,root),b);
const source=JSON.parse(read('tools/Widgy_Device_Glass_7.json'));
const widget=structuredClone(source);
const originalSvg=read('assets/device-glass/chrome-d4.svg').toString();
const btPath='<path d="M306 373L319 386L312 394V367L319 374L306 387"/>';
assert.equal(originalSvg.split(btPath).length,2);
// Visible glyph bounds measured at 8x, alpha >= 128, in the 530px design:
// Wi-Fi: icon right 91.875, label left 114.25 => gap 22.375.
// Bluetooth: icon right 319.875, label left 345.25 => gap 25.375.
const shift=3;
const movedSvg=originalSvg.replace(btPath,btPath.replace('/>',` transform="translate(${shift} 0)"/>`));
write('assets/device-glass/chrome-d8.svg',movedSvg);
const blue='#2d9cff';
const group='<g transform="translate(0 -16)">';
const dot='<circle cx="79" cy="389" r="1.25" fill="#aeb7c6" stroke="none"/>';
assert.equal(movedSvg.split(group).length,2);assert.equal(movedSvg.split(dot).length,2);
const activeSvg=movedSvg.replace(group,group.slice(0,-1)+` stroke="${blue}">`).replace(dot,dot.replace('#aeb7c6',blue));
const render=s=>sharp(Buffer.from(s)).ensureAlpha().raw().toBuffer();
const [oldPixels,movedPixels,bluePixels,backPixels]=await Promise.all([
  render(originalSvg),render(movedSvg),render(activeSvg),
  sharp(read('assets/device-glass/chrome-d4.png')).ensureAlpha().raw().toBuffer()
]);
const size=1060;assert.equal(backPixels.length,size*size*4);
const background=Buffer.from(backPixels);let changed=0;
for(let i=0;i<background.length;i+=4){
  if([0,1,2,3].some(c=>oldPixels[i+c]!==movedPixels[i+c])){
    const x=(i/4)%size,y=Math.floor(i/4/size);
    assert(x>=600&&x<658&&y>=694&&y<766,'Only the Bluetooth icon can change');
    movedPixels.copy(background,i,i,i+4);changed++;
  }
}
assert(changed>100);
// Keep the original pixels everywhere except the old/new Bluetooth strokes.
// Lossless RGBA avoids re-quantizing the rest of the original indexed artwork.
const backgroundPng=await sharp(background,{raw:{width:size,height:size,channels:4}}).png({compressionLevel:9}).toBuffer();
write('assets/device-glass/chrome-d8.png',backgroundPng);
const backgroundLayer=widget['1'].find(n=>n.d0===16002);
assert.equal(backgroundLayer['2'],'data:image/png;base64,'+read('assets/device-glass/chrome-d4.png').toString('base64'));
backgroundLayer['2']='data:image/png;base64,'+backgroundPng.toString('base64');
const specs=[
  {slug:'wifi',id:16003,box:[62,348,34,32]},
  {slug:'bluetooth',id:16004,box:[303,347,26,36]}
];
for(const spec of specs){
  const [x,y,w,h]=spec.box.map(n=>n*2),tile=Buffer.alloc(w*h*4);
  let count=0;
  for(let row=0;row<h;row++)for(let col=0;col<w;col++){
    const from=((y+row)*size+x+col)*4,to=(row*w+col)*4;
    const icon=[0,1,2].some(c=>movedPixels[from+c]!==bluePixels[from+c]);
    (icon?bluePixels:background).copy(tile,to,from,from+4);
    if(icon){count++;assert(row>1&&row<h-2&&col>1&&col<w-2);}
  }
  assert(count>100);
  const png=await sharp(tile,{raw:{width:w,height:h,channels:4}}).png({compressionLevel:9}).toBuffer();
  write(`assets/device-glass/${spec.slug}-on-d8.png`,png);
  const layer=widget['1'].find(n=>n.d0===spec.id);
  layer['2']='data:image/png;base64,'+png.toString('base64');
  if(spec.slug==='bluetooth')layer.b.a[0].a=Number((spec.box[0]*1600/530).toFixed(6));
}
widget['3']='Widgy Device Glass 8';
widget['4']='Device Glass 8 — selected vivid blue #2D9CFF for each independently active connectivity icon. Bluetooth moves 3 design pixels right in both On and Off states to match the Wi-Fi icon-to-label gap. Original lime ON/grey OFF text, battery Circle Chart, data providers, variables and visibility conditions are retained from D7. 15 layers total; all artwork is embedded. Both blue icons were observed on the phone in D7; independent Off transitions still require phone validation.';
assert.equal(widget['1'].length,15);
assert.deepEqual(widget['36'],source['36']);
for(const layer of widget['1']){
  const before=source['1'].find(n=>n.d0===layer.d0),after=structuredClone(layer);
  if([16002,16003,16004].includes(layer.d0))after['2']=before['2'];
  if(layer.d0===16004)after.b=before.b;
  assert.deepEqual(after,before);
}
const raw=JSON.stringify(widget);assert(!/https?:\/\//.test(raw));
write('tools/Widgy_Device_Glass_8.json',raw);
console.log(JSON.stringify({widget:widget['3'],layers:15,color:blue,bluetoothShift:shift,changedBackgroundPixels:changed,backgroundBytes:backgroundPng.length,bytes:Buffer.byteLength(raw)}));
