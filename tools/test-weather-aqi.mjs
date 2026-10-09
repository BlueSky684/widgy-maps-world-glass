import test from 'node:test';import assert from 'node:assert/strict';
import {createAQIService,normalizeAQI,airQualityURL,AQI_FRESH_MS,AQI_MAX_AGE_MS} from '../lib/weather/air-quality.js';
import {aqiColor} from '../lib/weather/aqi-scale.js';import {createWeatherHandler} from '../lib/weather/handler.js';import {renderSVG} from '../lib/weather/render.js';
const now=Date.parse('2026-10-09T19:45Z');
const raw=(value,at=now)=>({timezone:'Asia/Jerusalem',current:{time:Math.floor(at/3600000)*3600,us_aqi:value}});
test('AQI scale, missing/zero values and timestamp/zone validity',()=>{
  assert.equal(normalizeAQI(raw(0),now).value,0);assert.equal(normalizeAQI(raw(51.4),now).value,51);
  for(const value of [null,undefined,-1,'75',Infinity])assert.throws(()=>normalizeAQI(raw(value),now));
  assert.throws(()=>normalizeAQI(raw(75,now-3*3600000),now));assert.throws(()=>normalizeAQI(raw(75,now+2*3600000),now));
  const u=airQualityURL(31.67,34.57);assert.equal(u.hostname,'air-quality-api.open-meteo.com');assert.equal(u.searchParams.get('current'),'us_aqi');assert.equal(u.searchParams.get('timeformat'),'unixtime');
  const bands=[[0,50],[51,100],[101,150],[151,200],[201,300],[301,501]];assert.equal(new Set(bands.map(([a])=>aqiColor(a))).size,6);
  for(const [a,b] of bands)assert.equal(aqiColor(a),aqiColor(b));assert.equal(aqiColor(null),'#aeb7c6');
});
test('background AQI fetch is single-flight, cached and bounded by age',async()=>{
  let t=now,calls=0,release,offline=false;const scheduled=[],store=new Map();
  const cache={get:async k=>store.get(k),set:async(k,v)=>store.set(k,v)};
  const get=createAQIService({cache,clock:()=>t,flights:new Map(),schedule:p=>scheduled.push(p),fetcher:async()=>{calls++;if(offline)throw Error('offline');await new Promise(r=>release=r);return new Response(JSON.stringify(raw(75,t)));}});
  const results=await Promise.all(Array.from({length:10},()=>get(31.67,34.57)));assert.equal(calls,1);assert.equal(scheduled.length,1);assert(results.every(r=>r.value===null&&r.state==='loading'));
  release();assert.equal((await results[0].refresh).value,75);assert.equal((await get(31.6701,34.5701)).cache,'HIT');assert.equal(calls,1);
  t+=AQI_FRESH_MS+1;offline=true;const stale=await get(31.67,34.57);assert.equal(stale.value,75);assert.equal(stale.state,'stale');await stale.refresh;
  t=now+AQI_MAX_AGE_MS+1;const expired=await get(31.67,34.57);assert.equal(expired.value,null);await expired.refresh;
  assert.equal((await get(-31.67,34.57)).value,null);
});
function response(){return {headers:{},status(v){this.statusCode=v;return this;},setHeader(k,v){this.headers[k]=v;},send(v){this.body=v;return this;},end(){return this;},json(v){this.body=v;return this;}};}
test('Weather immediately uses cached AQI; zero is available; missing GPS does not request it',async()=>{
  let calls=0;const options=[];
  const h=createWeatherHandler({forecast:async()=>({state:'fresh',cache:'HIT',data:{test:'aqi-r4'}}),airQuality:async()=>{calls++;return {value:53,at:now,zone:'Asia/Jerusalem',state:'stale',refresh:new Promise(()=>{})};},render:async(_d,o)=>{options.push(o);return Buffer.from('aqi-nonblocking-check');}});
  const timeout=setTimeout(()=>{},1000);const r=await Promise.race([h({method:'GET',url:'/api/weather-panel?lat=31&lon=34&v=4',headers:{}},response()),new Promise((_r,reject)=>{setTimeout(()=>reject(Error('AQI blocked Weather')),100).unref();})]);clearTimeout(timeout);
  assert.equal(r.statusCode,200);assert.equal(r.headers['X-AQI-State'],'stale');assert.match(r.headers['Cache-Control'],/max-age=300/);assert.equal(options[0].aqi.value,53);
  await h({method:'GET',url:'/api/weather-panel?lat=&lon=&v=4',headers:{}},response());assert.equal(calls,1);
  const zero=createWeatherHandler({forecast:async()=>({state:'fresh',cache:'HIT',data:{test:'aqi-zero'}}),airQuality:async()=>({value:0,at:now,zone:'Asia/Jerusalem',state:'fresh'}),render:async()=>Buffer.from('aqi-zero')});
  const z=await zero({method:'GET',url:'/api/weather-panel?lat=31&lon=34&v=4',headers:{}},response());assert.equal(z.headers['X-AQI-Value'],'0');assert.match(z.headers['Cache-Control'],/max-age=300/);
});
test('warm forecast with cold AQI includes the delayed number in its FIRST image',async()=>{
  const pending=[],store=new Map();let release,calls=0,painted;
  const airQuality=createAQIService({clock:()=>now,cache:{get:async k=>store.get(k),set:async(k,v)=>store.set(k,v)},flights:new Map(),schedule:p=>pending.push(p),fetcher:async()=>{calls++;await new Promise(r=>release=r);return new Response(JSON.stringify(raw(53)));}});
  const h=createWeatherHandler({forecast:async()=>({state:'fresh',cache:'HIT',data:{test:'first-aqi'}}),airQuality,render:async(_d,o)=>{painted=o;return Buffer.from('first-number');}});
  const first=h({method:'GET',url:'/api/weather-panel?lat=31.66&lon=34.59&v=4',headers:{}},response());
  await new Promise(r=>setImmediate(r));
  assert.equal(painted,undefined,'do not render a dash while the first AQI fetch is still in progress');
  release();const r=await first;assert.equal(r.headers['X-AQI-Value'],'53');assert.equal(painted.aqi.value,53);assert.equal(calls,1);
  await Promise.all(pending);assert.equal((await airQuality(31.66,34.59)).value,53);assert.equal(calls,1);
});
test('cold AQI wait is bounded; failure and timeout preserve forecast and never invent zero',async()=>{
  for(const kind of ['timeout','rejection','unavailable']){
    let painted;const refresh=kind==='timeout'?new Promise(()=>{}):kind==='rejection'?Promise.reject(Error('provider')):Promise.resolve({value:null,state:'unavailable'});
    refresh.catch(()=>{});
    const h=createWeatherHandler({aqiWaitMs:15,forecast:async()=>({state:'fresh',cache:'HIT',data:{test:'aqi-failure-'+kind}}),airQuality:async()=>({value:null,state:'loading',refresh}),render:async(d,o)=>{assert(d);painted=o;return Buffer.from('aqi-failure-'+kind);}});
    const r=await Promise.race([h({method:'GET',url:'/api/weather-panel?lat=31&lon=34&v=5',headers:{}},response()),new Promise((_resolve,reject)=>{setTimeout(()=>reject(Error('cold wait is unbounded')),200).unref();})]);
    assert.equal(r.statusCode,200);assert.equal(painted.revision,5);assert.equal(painted.aqi.value,null);assert.equal(r.headers['X-AQI-Value'],undefined);assert.equal(r.headers['Cache-Control'],'private, no-store');
  }
});
test('AQI is numeric-only and color-coded; wind speed, high and low are retained',()=>{
  const data={zone:'Asia/Jerusalem',at:now,current:{temperature:25,feels:28,humidity:73,wind:8,direction:'NNE',uv:0,icon:'night_cloud',label:'Partly Cloudy'},hours:[],days:[{high:28,low:22}]};
  for(const value of [0,50,51,100,101,150,151,200,201,300,301]){
    const svg=renderSVG(data,{revision:4,aqi:{value,at:now,zone:data.zone,state:'fresh'}});
    assert(svg.includes(`fill="${aqiColor(value)}" aria-label="${value}"`));assert(svg.includes('aria-label="8 km/h"'));assert(svg.includes('aria-label="28° / 22°"'));assert(!svg.includes('NNE'));assert(!svg.includes('Moderate'));assert(!svg.includes('Unhealthy'));
  }
});
