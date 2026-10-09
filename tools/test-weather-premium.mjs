import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
import {coordinate,condition,uvLevel,normalizeForecast,providerURL} from '../lib/weather/model.js';
import {createForecastService,FRESH_MS,STALE_MS} from '../lib/weather/service.js';
import {renderSVG,renderPNG} from '../lib/weather/render.js';
import {createWeatherHandler} from '../api/weather-panel.js';
import {withWeatherPremium} from './weather-premium-widget.js';

function fixture(epoch=Date.parse('2026-10-09T10:30Z'),zone='Asia/Jerusalem',offset=10800){
  const start=Math.floor((epoch/1000+offset)/86400)*86400-offset;
  const hours=Array.from({length:144},(_,i)=>start+i*3600),days=Array.from({length:6},(_,i)=>start+i*86400);
  return {timezone:zone,utc_offset_seconds:offset,current:{time:Math.floor(epoch/900000)*900,temperature_2m:29,apparent_temperature:31,relative_humidity_2m:64,wind_speed_10m:18,wind_direction_10m:315,weather_code:2,is_day:1,uv_index:7},hourly:{time:hours,temperature_2m:hours.map(()=>29),precipitation_probability:hours.map(()=>0),weather_code:hours.map(()=>0),is_day:hours.map(()=>1),wind_speed_10m:hours.map(()=>10)},daily:{time:days,temperature_2m_min:[25,24,24,23,24,22],temperature_2m_max:[32,31,30,29,30,28],weather_code:[2,0,1,3,2,0],precipitation_probability_max:[10,0,0,20,10,0]}};
}
const now=Date.parse('2026-10-09T10:30Z');
test('no missing GPS coercion and no provider URL injection',()=>{
  for(const x of ['',null,undefined,'${widgy.map_latitude_max5}','NaN','91','1&evil=1'])assert.equal(coordinate(x,90),null);
  assert.equal(coordinate('−31,67',90),-31.67);assert.equal(coordinate('0',90),0);
  const u=new URL(providerURL(0,0));assert.equal(u.hostname,'api.open-meteo.com');assert.equal(u.searchParams.get('timezone'),'auto');
});
test('all documented codes, unknown codes, night and weather priority',()=>{
  for(const code of [0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,97,99])assert(condition(code).icon);
  assert.equal(condition(null).icon,null);assert.equal(condition(999).icon,null);assert.equal(condition(0,0).icon,'moon');assert.equal(condition(2,0).icon,'night_cloud');
  assert.equal(condition(0,1,40).icon,'wind');assert.equal(condition(95,1,90).icon,'storm');
  assert.deepEqual([0,3,6,8,11].map(uvLevel),['Low','Moderate','High','Very High','Extreme']);
});
test('local date, midnight, offsets and DST hours are chronological',()=>{
  for(const [time,zone,offset] of [['2026-10-09T10:30Z','Asia/Jerusalem',10800],['2026-10-09T21:10Z','Asia/Jerusalem',10800],['2026-10-09T23:40Z','Asia/Kathmandu',20700],['2026-11-01T05:30Z','America/New_York',-14400]]){
    const t=Date.parse(time),r=normalizeForecast(fixture(t,zone,offset),t);
    assert.equal(r.days[0].label,'TODAY');assert.equal(r.hours.length,6);assert.equal(r.days.length,5);
    for(let i=1;i<6;i++)assert.equal(r.hours[i].time-r.hours[i-1].time,3600);
    if(zone==='America/New_York')assert.deepEqual(r.hours.slice(0,2).map(h=>h.label),['01:00','01:00']);
  }
});
test('nulls and invalid values never become zero/sunny or fake coverage',()=>{
  const raw=fixture();raw.current.temperature_2m=null;raw.current.weather_code=null;raw.current.relative_humidity_2m=200;raw.hourly.precipitation_probability.fill(null);raw.daily.temperature_2m_min[0]=99;
  const r=normalizeForecast(raw,now);assert.equal(r.current.temperature,null);assert.equal(r.current.icon,null);assert.equal(r.current.humidity,null);assert.equal(r.hours[0].rain,null);assert.equal(r.days[0].low,null);
  const broken=fixture();broken.hourly.time=broken.hourly.time.slice(0,3);assert.throws(()=>normalizeForecast(broken,now));
  assert.throws(()=>normalizeForecast(fixture(),now+4*3600000));
});
test('one provider fetch for simultaneous requests; cache reuse, failure and expiry',async()=>{
  const values=new Map(),cache={get:async k=>values.get(k),set:async(k,v)=>values.set(k,v)};let calls=0,t=now,fail=false;
  const get=createForecastService({cache,clock:()=>t,flights:new Map(),fetcher:async()=>{calls++;if(fail)throw Error('offline');return new Response(JSON.stringify(fixture(t)));}});
  const results=await Promise.all(Array.from({length:12},()=>get(31.67,34.57)));assert.equal(calls,1);assert(results.every(r=>r.data));
  assert.equal((await get(31.6701,34.5701)).cache,'HIT');assert.equal(calls,1);
  fail=true;t+=FRESH_MS+1;assert.equal((await get(31.67,34.57)).state,'stale');
  t=now+STALE_MS+1;assert.equal((await get(31.67,34.57)).state,'unavailable');
  assert.equal((await get(-31.67,34.57)).state,'unavailable');
});
test('render approved dimensions, live strings, null/error states and extreme text',async()=>{
  const model=normalizeForecast(fixture(),now),png=await renderPNG(model),meta=await sharp(png).metadata();
  assert.equal(meta.width,2270);assert.equal(meta.height,1608);assert(png.length<600000);
  const svg=renderSVG(model);assert(svg.includes('aria-label="TODAY"'));assert(svg.includes('aria-label="13:00"'));assert(svg.includes('aria-label="Partly Cloudy"'));assert(!svg.includes('NaN'));assert(!svg.includes('undefined'));
  for(const value of [null,-53,0,49]){model.current.temperature=value;model.current.uv=12;model.current.wind=198;model.current.direction='NNW';assert(!renderSVG(model).includes('NaN'));}
  assert(renderSVG(null,{message:'Waiting for location'}).includes('Waiting for location'));
  writeFileSync('work/weather-fixture-panel.png',png);
});
function response(){return {code:200,headers:{},status(v){this.code=v;return this;},setHeader(k,v){this.headers[k]=v;},end(){return this;},send(v){this.body=v;return this;},json(v){this.body=v;return this;}};}
test('handler never fetches without GPS; private cache, ETag, HEAD and method handling',async()=>{
  let count=0;const data=normalizeForecast(fixture(),now),h=createWeatherHandler({forecast:async()=>{count++;return{data,state:'fresh',cache:'HIT'};}});
  const missing=await h({method:'GET',url:'/api/weather-panel?lat=&lon=',headers:{}},response());assert.equal(count,0);assert.equal(missing.headers['X-Weather-State'],'location');assert(Buffer.isBuffer(missing.body));
  const r=await h({method:'GET',url:'/api/weather-panel?lat=31&lon=34',headers:{}},response());assert.equal(r.code,200);assert.equal(r.headers['CDN-Cache-Control'],'no-store');assert.match(r.headers['Cache-Control'],/^private/);
  const same=await h({method:'GET',url:'/api/weather-panel?lat=31&lon=34',headers:{'if-none-match':r.headers.ETag}},response());assert.equal(same.code,304);assert.equal(same.body,undefined);
  const head=await h({method:'HEAD',url:'/api/weather-panel?lat=31&lon=34',headers:{}},response());assert.equal(head.code,200);assert.equal(head.body,undefined);
  assert.equal((await h({method:'POST',url:'/'},response())).code,405);
});
test('latest full widget changes only Weather and metadata; all references resolve',()=>{
  const path=process.env.WIDGY_BASELINE;if(!path)return;
  const original=JSON.parse(readFileSync(path)),widget=withWeatherPremium(original);
  for(const k of Object.keys(original))if(!['1','3','4','a2'].includes(k))assert.deepEqual(widget[k],original[k],k);
  for(const n of original['1'])if(n.d0!==246)assert.deepEqual(widget['1'].find(v=>v.d0===n.d0),n,n.s);
  const oldTaps=original['1'].find(n=>n.d0===246)['1'].filter(n=>n.z==='11');assert.deepEqual(widget['1'].find(n=>n.d0===246)['1'].filter(n=>n.z==='11'),oldTaps);
  function* walk(nodes){for(const n of nodes){yield n;if(Array.isArray(n['1']))yield*walk(n['1']);}}
  const nodes=[...walk(widget['1'])],ids=nodes.map(n=>n.d0),variables=new Set(widget['36'].map(v=>v['0'])),names=new Set(widget['36'].map(v=>v['1']));
  assert.equal(new Set(ids).size,ids.length);
  for(const n of nodes){if(n.o1)assert(variables.has(n.o1['0']));if(n['1a']?.startsWith('button_'))for(const v of n['1a'].slice(7).split(/[-,]/))assert(ids.includes(Number(v)),n.s);}
  for(const [,name] of JSON.stringify(widget).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(name),name);
  assert.equal(widget['36'].length,original['36'].length);
  assert.equal(nodes.filter(n=>n.s?.startsWith('Weather · Live')).length,1);
});
