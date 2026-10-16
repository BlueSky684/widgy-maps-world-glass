import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {renderSVG,renderPNG} from '../lib/weather/render.js';
import {plainZeroPaths} from '../lib/weather/plain-zero.js';
import {createWeatherHandler} from '../lib/weather/handler.js';

const at=Date.parse('2026-10-16T20:00:00Z');
const data={at,zone:'Asia/Jerusalem',current:{temperature:20,feels:20,wind:10,humidity:90,uv:0,icon:'night_cloud',label:'Partly Cloudy'},
  hours:Array.from({length:6},(_,i)=>({time:at/1000+i*3600,label:String(i).padStart(2,'0')+':00',temperature:20,rain:0,icon:'moon'})),
  days:Array.from({length:5},(_,i)=>({date:'2026-10-'+(16+i),label:i?'SAT':'TODAY',high:30,low:20,rain:0,icon:'cloud',condition:'Cloudy'}))};
const aqi={value:50,at,zone:data.zone,state:'fresh'};
const options={revision:15,aqi,solarEvent:{label:'Sunrise',time:'06:00',at:at+36000000},showFooter:false};
const fonts=JSON.parse(readFileSync(new URL('../assets/weather-premium/glyphs.json',import.meta.url)));
test('clean zeros retain all live labels, transforms, colors and dimensions',async()=>{
  const original=renderSVG(data,options),clean=renderSVG(data,{...options,plainZero:true});
  const tags=s=>s.match(/aria-label="[^"]*"|transform="[^"]*"|fill="[^"]*"/g);
  assert.deepEqual(tags(clean),tags(original));
  assert.notEqual(clean,original);
  for(const [weight,path] of Object.entries(plainZeroPaths)){
    const old=fonts[weight].glyphs['0'].path;
    assert(original.includes(`d="${old}"`));assert(!clean.includes(`d="${old}"`));assert(clean.includes(`d="${path}"`));
  }
  const png=await renderPNG(data,{...options,plainZero:true}),m=await sharp(png).metadata();
  assert.deepEqual([m.width,m.height],[2270,1608]);
  if(process.env.ZERO_REVIEW_PATH){
    await sharp(png).flatten({background:'#0b151d'}).resize(1135,804).png().toFile(process.env.ZERO_REVIEW_PATH);
  }
});
function response(){return {code:200,headers:{},status(v){this.code=v;return this;},setHeader(k,v){this.headers[k]=v;},end(){return this;},send(v){this.body=v;return this;},json(v){this.body=v;return this;}};}
test('plain and original requests cannot reuse each other’s cached image or ETag',async()=>{
  let renders=0;
  const handler=createWeatherHandler({clock:()=>at,forecast:async()=>({data,state:'fresh',cache:'HIT'}),airQuality:async()=>aqi,
    render:async(d,o)=>{renders++;return Buffer.from(renderSVG(d,o));}});
  const req={method:'GET',url:'/api/weather-panel?lat=31&lon=34&v=15&footer=0',headers:{}};
  const old=await handler(req,response());
  const clean=await handler({...req,url:req.url+'&zero=plain',headers:{'if-none-match':old.headers.ETag}},response());
  assert.equal(old.code,200);assert.equal(clean.code,200);assert.equal(renders,2);assert.notEqual(old.headers.ETag,clean.headers.ETag);
  const warm=await handler({...req,url:req.url+'&zero=plain',headers:{'if-none-match':clean.headers.ETag}},response());
  assert.equal(warm.code,304);assert.equal(renders,2);
  const restored=await handler(req,response());assert(restored.body.equals(old.body));assert.equal(renders,2);
  const oldJSON=await handler({...req,url:req.url+'&format=json'},response());
  const cleanJSON=await handler({...req,url:req.url+'&format=json&zero=plain'},response());
  assert.deepEqual(cleanJSON.body,oldJSON.body);
});
