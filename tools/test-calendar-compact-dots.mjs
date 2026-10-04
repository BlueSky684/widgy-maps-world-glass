import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {renderDots,monthWindow} from '../lib/calendar-bridge/dots.js';
import {DOT_FRAME as f} from '../lib/calendar-bridge/dots-frame.js';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';

const flat=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const template=JSON.parse(fs.readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const control=consolidateWidget(normal),saved=structuredClone(control),candidate=compactCalendarDots(control);
assert.deepEqual(control,saved);
assert.deepEqual(candidate['1'][0],control['1'][0],'Entire Home is unchanged');
assert.equal(candidate['36'].length,81);
assert.equal(flat(candidate['1']).length,1613);
const originals=new Map(flat(control['1']).map(n=>[n.d0,n]));
const restored=structuredClone(candidate);
let images=0;
for(const image of flat(restored['1']).filter(n=>n.s==='Calendar · Browser Event Dots')){
  const old=originals.get(image.d0);
  const native=flat(candidate['1']).find(n=>n.d0===image.d0);
  // Physical design pixels must map 1:1 to the same 2x source-pixel positions.
  const actual={left:native.b.a[0].a/1600*f.canvasWidth,top:native.c.a[0].a/1600*f.canvasHeight,
    width:native.d.a[0].a/1600*f.canvasWidth,height:native.e.a[0].a/1600*f.canvasHeight};
  for(const k of ['left','top','width','height'])assert(Math.abs(actual[k]-f[k])<1e-10);
  for(const k of ['b','c','d','e'])image[k]=structuredClone(old[k]);images++;
}
assert.equal(images,25);
const time=Date.parse('2026-10-04T23:59:59.999Z');
for(const v of restored['36'].filter(v=>/^calendar_dots_url_/.test(v['1']))){
  const old=control['36'].find(o=>o['0']===v['0']);
  for(const now of [time,time+1]){
    const evaluate=code=>vm.runInNewContext(code+';main();',{Date:{now:()=>now}},{timeout:1000});
    const originalURL=new URL(evaluate(old['3']['66'][0]['10']));
    const compactURL=new URL(evaluate(v['3']['66'][0]['10']));
    assert.equal(compactURL.searchParams.get('bounds'),'grid');compactURL.searchParams.delete('bounds');
    assert.equal(compactURL.href,originalURL.href,'Only the image bounds query changes');
  }
  v['3']['66'][0]['10']=old['3']['66'][0]['10'];
}
restored['3']=control['3'];restored['4']=control['4'];
assert.deepEqual(restored,control,'No other property, provider, action or drawing changed');

const pixelCases=[];
for(const [date,weeks] of [['2026-02-10',4],['2026-10-04',5],['2026-08-15',6]]){
  const window=monthWindow({now:new Date(date+'T12:00:00Z')});assert.equal(window.weeks,weeks);
  for(const filled of [false,true]){
    const events=filled?Array.from({length:weeks*7},(_,i)=>{
      const day=window.start.plus({days:i});
      return Array.from({length:4},(_,j)=>({uid:`cell-${i}-${j}`,source:`synthetic-${j}`,provider:'google',
        color:j,title:`Example ${j}`,allDay:true,start:day.toISODate(),end:day.plus({days:1}).toISODate()}));
    }).flat():[];
    const full=await renderDots(events,window),compact=await renderDots(events,window,{bounds:'grid'});
    const original=await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const crop=await sharp(compact).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(original.info.width,2270);assert.equal(original.info.height,2368);
    assert.equal(crop.info.width,1108);assert.equal(crop.info.height,1120);
    // Paste RGBA bytes without blending/re-encoding. Exact equality proves
    // no visible or anti-aliased pixel was cut off, moved or recolored.
    const rebuilt=Buffer.alloc(original.data.length),rowBytes=crop.info.width*4;
    for(let y=0;y<crop.info.height;y++)crop.data.copy(rebuilt,
      ((y+f.top*f.scale)*original.info.width+f.left*f.scale)*4,y*rowBytes,(y+1)*rowBytes);
    assert.deepEqual(rebuilt,original.data,`${weeks} weeks, filled=${filled}`);
    pixelCases.push({weeks,filled,pngBytes:{full:full.length,compact:compact.length}});
  }
}
await assert.rejects(renderDots([],monthWindow(),{bounds:'invalid'}),/invalid_bounds/);
for(const mutate of [
  w=>{flat(w['1']).find(n=>n.s==='Calendar · Browser Event Dots').d.a[0].a=1599;},
  w=>{flat(w['1']).find(n=>n.s==='Calendar · Browser Event Dots')['1']='Javascript';},
  w=>{w['36'].find(v=>v['1']==='calendar_dots_url_p0')['3']['66'][0]['10']+=';throw Error("extra");';},
  w=>{const p=w['1'][1]['1'].filter(n=>/^Calendar · Month Offset /.test(n.s));p[1].s=p[0].s;}
]){const bad=structuredClone(control);mutate(bad);assert.throws(()=>compactCalendarDots(bad),/unexpected_template/);}

// Exercise the delivered page controller using synthetic export data only.
const elements=new Map(),events={};let downloaded,copied,error;
const element=id=>{
  if(!elements.has(id))elements.set(id,{events:{},classList:{toggle(){}},
    addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}});
  return elements.get(id);
};
const context={document:{getElementById:element},Blob,consolidateWidget,compactCalendarDots,
  URL:{createObjectURL(blob){downloaded=blob;return 'blob:synthetic';},revokeObjectURL(){}},
  navigator:{clipboard:{async writeText(value){copied=value;}}},window:{addEventListener(name,fn){events[name]=fn;}},
  async prepareWidget(){if(error)throw Error(error);return {payload:JSON.stringify(normal)};}};
vm.runInNewContext(fs.readFileSync(new URL('./widgy-compact-dots.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),context);
await new Promise(setImmediate);assert.equal(element('copy').disabled,false);
assert.deepEqual(JSON.parse(await downloaded.text()),candidate);
await element('copy').events.click();assert.deepEqual(JSON.parse(copied),candidate);
error='unauthorized';await element('retry').events.click();assert.equal(element('copy').disabled,true);
assert.equal(element('download').href,undefined);assert.equal(element('download').hidden,true);
error=null;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(element('copy').disabled,false);
context.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await element('copy').events.click();assert.equal(element('download').hidden,false);
const fullRGBA=2270*2368*4,compactRGBA=1108*1120*4;
const report={name:candidate['3'],layers:1613,variables:81,images:25,
  perImage:{fullPixels:[2270,2368],compactPixels:[1108,1120],fullRGBA,compactRGBA,
    removedPercent:100*(1-compactRGBA/fullRGBA)},pixelCases,
  proof:'RGBA reconstruction exactly matches full-size output for filled/empty 4/5/6-week layouts. All document properties except dot URL bounds, image frames and candidate metadata are identical.',
  limits:'No native Widgy timing, image resampling or memory profiler. Source RGBA bytes are not measured widget memory. Native image placement remains a phone check.'};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('./performance/compact-dots-1-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
