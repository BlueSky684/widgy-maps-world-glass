import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import sharp from 'sharp';
import handler from '../api/solar-mask.js';
import {MASK_LIVE,maskTimeLabel} from '../lib/map-mask-live.js';
import {solarMask} from '../lib/map-solar-mask.js';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMaskCompare} from './map-mask-compare.js';
import {withMapMaskLive} from './map-mask-live.js';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const epoch=Date.parse('2026-10-06T07:30:00Z');
const url=(part,t=epoch)=>'/api/solar-mask?rev=live-1&part='+part+'&t='+t;
async function request(path,method='GET',headers={}){
  const res={headers:{},code:null,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.code=c;return this;},
    send(body){this.body=body;return this;},json(body){this.body=body;return this;},end(){return this;}};
  await handler({url:path,method,headers},res);return res;
}
const [d,n]=await Promise.all([request(url('day')),request(url('night'))]);
assert.equal(d.code,200);assert.equal(n.code,200);assert.equal(d.headers['x-mask-cache'],'MISS');assert.equal(n.headers['x-mask-cache'],'HIT');
for(const r of [d,n]){
  assert.equal(r.headers['content-type'],'image/png');assert.equal(r.headers['x-mask-time'],new Date(epoch).toISOString());
  assert.match(r.headers['cache-control'],/^public,/);assert.equal(r.headers['cdn-cache-control'],r.headers['cache-control']);
  const meta=await sharp(r.body).metadata();assert.deepEqual([meta.width,meta.height],[522,246]);assert(meta.icc?.length>0);
}
const mask=solarMask(new Date(epoch),522,246),top=MASK_LIVE.height-MASK_LIVE.bandRows;
const raw={day:await sharp(d.body).raw().toBuffer(),night:await sharp(n.body).raw().toBuffer()};
for(const part of ['day','night'])for(let p=0;p<top*522;p++)for(let c=0;c<3;c++)assert.equal(raw[part][p*3+c],mask[part][p]);
for(let y=top;y<246;y++)for(let x=0;x<522;x++){
  const inactive=x<261?'night':'day';assert.equal(raw[inactive][(y*522+x)*3],0,'Other mask cannot supply this stamp');
}
assert.equal(maskTimeLabel(new Date(epoch),'day'),'D 06/10 10:30');
assert.equal(maskTimeLabel(new Date('2026-12-01T07:30:00Z'),'night'),'N 01/12 09:30');
// A visible D's top row is11110, drawn at x52/y230 with2x scaling.
assert.deepEqual([0,1,2,3,4].map(x=>raw.day[(230*522+52+x*2)*3]),[255,255,255,255,0]);
const next=await request(url('night',epoch+300000));assert.equal(next.code,200);assert.notEqual(next.headers.etag,n.headers.etag);
const nextRaw=await sharp(next.body).raw().toBuffer();
assert(!nextRaw.subarray(0,top*522*3).equals(raw.night.subarray(0,top*522*3)),'Solar field really advances');
assert(!nextRaw.subarray(top*522*3).equals(raw.night.subarray(top*522*3)),'Burned-in stamp really advances');
const repeat=await request(url('night'),'GET',{'x-vercel-ip-latitude':'0','x-vercel-ip-longitude':'0'});
assert(repeat.body.equals(n.body),'No IP dependency or request-time stamp');
const notModified=await request(url('night'),'GET',{'if-none-match':'W/'+n.headers.etag});assert.equal(notModified.code,304);assert.equal(notModified.body,null);
assert.equal((await request(url('day'),'HEAD')).body,null);assert.equal((await request(url('day'),'POST')).code,405);
for(const path of [url('day',epoch+1),url('wrong'),url('day')+'&lat=1',url('night')+'&t='+epoch,
  '/api/solar-mask?rev=live-1&part=day&t=NaN','/api/solar-mask?part=day&t='+epoch,url('day').replace('live-1','wrong'),url('day',0)]){
  const bad=await request(path);assert.equal(bad.code,400,path);assert.equal(bad.headers['cache-control'],'no-store');
}

const template=JSON.parse(read('./Widgy_Home_Glass_Calendar_C16.json'));
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic'))));
const before=structuredClone(full),comparison=withMapMaskCompare(full,'https://example.test'),widget=withMapMaskLive(full,'https://example.test');
assert.deepEqual(full,before);assert.equal(widget['36'].length,3);assert.equal(new Set(widget['36'].map(v=>v['0'])).size,3);
const flat=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]),nodes=flat(widget['1']),previous=flat(comparison['1']);
assert.equal(new Set(nodes.map(n=>n.d0)).size,nodes.length);
assert.equal(nodes.filter(n=>n.z==='5').length,4);assert(!nodes.some(n=>n.d0===84030));
for(const n of nodes.filter(n=>n.z==='11'))assert.deepEqual(n,previous.find(p=>p.d0===n.d0));
for(const n of nodes.filter(n=>n.z==='5')){
  assert.equal(n['1'],'Web URL');assert.equal(n['3'],true);
  const old=previous.find(p=>p.d0===n.d0);
  for(const k of ['b','c','d','e','t'])assert.deepEqual(n[k],old[k]);
}
assert(!/\/api\/(?:night-map|calendar-)|token=|map_latitude|map_longitude|"Location"|reference\.png/.test(JSON.stringify(widget)));
const trap=()=>{throw Error('Unexpected network/timer');};
function evaluate(name,now,stamp){
  const code=widget['36'].find(v=>v['1']===name)['3']['66'][0]['10'].replace('"${widgy.mask_epoch}"',JSON.stringify(stamp));
  return vm.runInNewContext(code+'\nmain()',{Date:{now:()=>now},fetch:trap,setTimeout:trap,setInterval:trap,sendToWidgy:trap},{timeout:100});
}
for(const offset of [0,1,299999,300000,600000]){
  const stamp=evaluate('mask_epoch',epoch+offset);
  assert.equal(stamp,String(Math.floor((epoch+offset)/300000)*300000));
  for(const part of ['day','night'])assert.equal(evaluate('mask_'+part+'_request',epoch+offset,stamp),'https://example.test'+url(part,stamp));
}
for(const stamp of ['',null,'NaN','${widgy.mask_epoch}',String(epoch+1),'1e12'])assert.equal(evaluate('mask_day_request',epoch,stamp),'');

const dir=new URL('../assets/diagnostics/map-mask-live-1/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('manifest.json',dir)));
for(const part of ['day','night']){
  const path=part+'.png',bytes=readFileSync(new URL(path,dir)),spec=manifest.files[path];
  assert.equal(bytes.length,spec.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),spec.sha256);
  const [a,b]=await Promise.all([sharp(bytes).raw().toBuffer(),sharp(readFileSync(new URL('../assets/diagnostics/map-mask-compare-1/'+path,import.meta.url))).raw().toBuffer()]);
  assert(a.subarray(0,1444*3306*3).equals(b.subarray(0,1444*3306*3)));
  assert.equal(a[(1500*3306+500)*3],part==='day'?255:0);
  assert.equal(a[(1500*3306+2500)*3],part==='night'?255:0);
}

const html=read('./widgy-map-mask-live.html');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(n,f){this.events[n]=f;},removeAttribute(n){delete this[n];}}]));
const events={},requests=[];let downloaded,copied,fail=false;
class BrowserURL extends URL{static createObjectURL(blob){downloaded=blob;return 'blob:test';}static revokeObjectURL(){}}
const ctx={document:{getElementById:id=>elements[id]},Blob,URL:BrowserURL,personalizedWidget,consolidateWidget,
  compactCalendarDots,thinNativeStepsRing,withMapMaskLive,
  navigator:{clipboard:{async writeText(v){copied=v;}}},window:{location:{href:'https://example.test/tools/widgy-map-mask-live.html'},addEventListener(n,f){events[n]=f;}},
  async fetch(u,o){requests.push([u,o]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(read('./widgy-map-mask-live.js').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);assert.deepEqual(JSON.parse(await downloaded.text()),widget);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),widget);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);assert.equal(elements.download.href,undefined);
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
assert(requests.every(([u,o])=>u==='./Widgy_Home_Glass_Calendar_C16.json'&&o.cache==='no-store'));
console.log(JSON.stringify({result:'PASS',checks:'real route PNG/time/solar advancement/cache/304/HEAD/invalid queries; independent D/N bitmap stamps; static pixels unchanged above strip; native source/frame/navigation isolation; bucket/dependency and copy/recovery flows',bytes:{day:d.body.length,night:n.body.length,total:d.body.length+n.body.length},localServerTiming:d.headers['server-timing']}));
