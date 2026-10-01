import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {WIDTH,HEIGHT,renderPixels,getEngraving,renderHomeMap} from '../lib/home-map-day-night.js';
import handler from '../api/night-map.js';

const read=n=>JSON.parse(readFileSync(new URL(n,import.meta.url)));
const r5=read('./Widgy_Home_Glass_JS_City_R5.json'),r6=read('./Widgy_Home_Glass_JS_City_R6.json');
const home=w=>w['1'].find(n=>n.d0===245)['1'];
const variable=(w,name)=>w['36'].find(v=>v['1']===name)['3']['66'][0];
const restored=structuredClone(r6),day=home(r6).find(n=>n.d0===6105);
const weights=home(r6).filter(n=>n.s==='Header Day · Weight');
for(const [i,offset]of [-2.75,2.75].entries())
  assert(Math.abs((weights[i].b.a[0].a-day.b.a[0].a)*1135/1600-offset)<1e-6);
for(const n of home(restored).filter(n=>n.s==='Header Day · Weight'))
  n.b=structuredClone(home(r5).find(v=>v.d0===n.d0).b);
variable(restored,'map_request')['10']=variable(restored,'map_request')['10'].replace('&atlas=r6','');
restored['3']=r5['3'];restored['4']=r5['4'];
assert.deepEqual(restored,r5,'Only date weight, atlas selection and release metadata may change');
assert.equal(variable(r6,'steps_goal')['25'],'10000');
for(const [steps,result]of [['0',0],['6595',65],['9,999',99],['10000',100],['17500',100]]){
  const code=variable(r6,'steps_progress')['10'].replaceAll('${widgy.steps_today}',steps).replaceAll('${widgy.steps_goal}','10000');
  assert.equal(vm.runInNewContext(code+'\nmain()'),result);
}
const script=variable(r6,'map_request')['10'].replaceAll('${widgy.map_latitude_max5}','31.66879')
 .replaceAll('${widgy.map_longitude_max5}','34.57425');
const result=await new Promise(resolve=>vm.runInNewContext(script,{
  sendToWidgy:resolve,fetch:async()=>({ok:true,json:async()=>({latitude:31.66879,longitude:34.57425,lookupSource:'coordinates',city:'Ashkelon'})})
}));
const url=new URL(result);
assert.equal(url.searchParams.get('atlas'),'r6');assert.equal(url.searchParams.get('city'),'Ashkelon');
assert.equal(url.searchParams.get('width'),'3306');assert(!url.searchParams.has('at'));

const date=new Date('2026-10-01T18:23:00Z');
const before=renderPixels(date).data,after=renderPixels(date,'r6').data,ocean=getEngraving().ocean;
assert.deepEqual(getEngraving('r6').ocean,ocean);
let changed=0;
for(let p=0;p<WIDTH*HEIGHT;p++)for(let c=0;c<3;c++){
  const i=p*3+c;
  if(!ocean[p])assert.equal(after[i],before[i],'Land, terrain and city lights must remain exact');
  if(after[i]!==before[i]){assert(ocean[p]);assert(after[i]>before[i]);changed++;}
}
assert(changed>0);
mkdirSync('work/r6',{recursive:true});
const options={date,location:{latitude:31.66879,longitude:34.57425,city:'Ashkelon'},presentation:'glass'};
const original=await renderHomeMap(options),updated=await renderHomeMap({...options,atlas:'r6'});
assert(updated.length<4_500_000,'Keep below function response limit');
const metadata=await sharp(updated).metadata();assert.equal(metadata.width,3306);assert.equal(metadata.height,1558);
writeFileSync('work/r6/map-native.png',updated);
const thumbs=await Promise.all([original,updated].map(png=>sharp(png).resize({width:390}).png().toBuffer()));
await sharp({create:{width:800,height:184,channels:4,background:'#111820'}})
 .composite(thumbs.map((input,i)=>({input,left:i*410,top:0}))).png().toFile('work/r6/atlas-comparison.png');
const captured={headers:{}};
const res={setHeader:(k,v)=>captured.headers[k]=v,status:n=>{captured.status=n;return res;},send:b=>captured.body=b,json:o=>captured.body=o,end:()=>{}};
await handler({method:'GET',url:'/api/night-map?atlas=r6&width=3306&at=2026-10-01T18:23:00Z',headers:{}},res);
assert.equal(captured.status,200);assert.equal(captured.headers['X-Map-Atlas'],'r6');
assert(captured.headers['Cache-Control'].includes('no-store'));
console.log(JSON.stringify({passed:true,exactR5FontsAndLiveRing:true,goal:10000,onlyAtlasOceanPixelsChanged:true,
  dimensions:[metadata.width,metadata.height],bytes:updated.length,deviceTested:false},null,2));
