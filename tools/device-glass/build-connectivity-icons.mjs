import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root=new URL('../../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root));
const write=(p,b)=>fs.writeFileSync(new URL(p,root),b);
const original=JSON.parse(read('tools/Widgy_Device_Glass_6.json'));
const visibility=JSON.parse(read('tools/widgy-native-visibility-source.json'));
const widget=structuredClone(original);
assert(!widget['36']);
const svg=read('assets/device-glass/chrome-d4.svg').toString();
const group='<g transform="translate(0 -16)">';
const dot='<circle cx="79" cy="389" r="1.25" fill="#aeb7c6" stroke="none"/>';
assert.equal(svg.split(group).length,2);assert.equal(svg.split(dot).length,2);
const blue='#79bfff';
const active=svg.replace(group,group.slice(0,-1)+` stroke="${blue}">`).replace(dot,dot.replace('#aeb7c6',blue));
// Tiles contain exact original pixels outside the icon footprint. This avoids
// seams from independently quantizing a small background crop and fully covers
// the original grey antialiased strokes when the blue state is displayed.
const render=s=>sharp(Buffer.from(s)).ensureAlpha().raw().toBuffer();
const [normalPixels,bluePixels,backPixels]=await Promise.all([
  render(svg),render(active),sharp(read('assets/device-glass/chrome-d4.png')).ensureAlpha().raw().toBuffer()
]);
assert.equal(normalPixels.length,1060*1060*4);
const specs=[
  {name:'Wi-Fi',slug:'wifi',box:[62,348,34,32],source:15013,uuid:'DE71CE07-0000-4000-8000-000000000001'},
  {name:'Bluetooth',slug:'bluetooth',box:[300,347,26,36],source:15030,uuid:'DE71CE07-0000-4000-8000-000000000002'}
];
const scalar=a=>({b:0,a:[{a:Number(a.toFixed(6)),b:1126,c:0,d:1126}]});
const layers=[],variables=[];
for(const [index,spec] of specs.entries()){
  const [x,y,w,h]=spec.box.map(n=>n*2);
  const tile=Buffer.alloc(w*h*4);let blueCount=0;
  for(let row=0;row<h;row++)for(let col=0;col<w;col++){
    const from=((y+row)*1060+x+col)*4,to=(row*w+col)*4;
    const icon=[0,1,2].some(c=>normalPixels[from+c]!==bluePixels[from+c]);
    const pixels=icon?bluePixels:backPixels;
    pixels.copy(tile,to,from,from+4);
    if(icon){blueCount++;assert(row>1&&row<h-2&&col>1&&col<w-2,'Tile needs clear edge padding');}
  }
  assert(blueCount>100);
  const png=await sharp(tile,{raw:{width:w,height:h,channels:4}}).png({compressionLevel:9}).toBuffer();
  write(`assets/device-glass/${spec.slug}-on-d7.png`,png);
  const v=structuredClone(visibility.variable);
  v['0']=spec.uuid;v['1']=`device_${spec.slug}_status`;v['3'].s=`Variable: ${v['1']}`;
  const status=original['1'].find(n=>n.d0===spec.source);
  assert(status);v['3']['66']=structuredClone(status['66']);
  variables.push(v);
  const layer={z:'5',d0:16003+index,s:`${spec.name} · Blue when On`,1:'Web URL',2:'data:image/png;base64,'+png.toString('base64'),3:true,
    o1:{...structuredClone(visibility.condition),0:spec.uuid,2:'On'}};
  for(const [i,k] of ['b','c','d','e'].entries())layer[k]=scalar(spec.box[i]*1600/530);
  layers.push(layer);
}
widget['1']=[...layers,...widget['1']];
widget['36']=variables;widget.a2=16005;
widget['3']='Widgy Device Glass 7';
widget['4']='Device Glass 7 — independent ice-blue connectivity icons (#79BFFF). Each icon uses one small embedded tile, visible only when its own native WiFi Status or Bluetooth Status equals On. Otherwise the original grey artwork shows. Original ON/OFF text remains lime/grey, and the complete D6 battery Circle Chart and other 12 original layers are retained. 15 layers total, two native text variables, no JavaScript or remote artwork. Native status refresh timing remains controlled by Widgy/iOS; phone validation of all four combinations is pending.';
assert.deepEqual(widget['1'].slice(2),original['1']);
assert.equal(widget['1'].length,15);
assert.equal(new Set(widget['1'].map(n=>n.d0)).size,15);
const raw=JSON.stringify(widget);assert(!/https?:\/\//.test(raw));
write('tools/Widgy_Device_Glass_7.json',raw);
console.log(JSON.stringify({widget:widget['3'],layers:15,originalLayersPreserved:13,nativeVariables:2,bytes:Buffer.byteLength(raw)}));
