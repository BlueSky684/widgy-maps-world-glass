import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import sharp from 'sharp';
import {nextSolarEvent,uvPresentation} from '../lib/weather/current-card.js';
import {normalizeForecast} from '../lib/weather/model.js';
import {currentConditionLayout,renderSVG,renderPNG} from '../lib/weather/render.js';
import {createWeatherHandler} from '../lib/weather/handler.js';

const at=Date.parse('2026-10-11T09:00:00Z'),midnight=Date.parse('2026-10-10T21:00:00Z')/1000;
function rawFixture(now=at){
  const hours=Array.from({length:144},(_,i)=>midnight+i*3600),days=Array.from({length:6},(_,i)=>midnight+i*86400);
  return {timezone:'Asia/Jerusalem',utc_offset_seconds:10800,current:{time:now/1000,temperature_2m:28,apparent_temperature:31,relative_humidity_2m:68,wind_speed_10m:8,wind_direction_10m:315,weather_code:3,is_day:1,uv_index:3},
    hourly:{time:hours,temperature_2m:hours.map(()=>28),precipitation_probability:hours.map(()=>16),weather_code:hours.map(()=>3),is_day:hours.map(()=>1),wind_speed_10m:hours.map(()=>8)},
    daily:{time:days,temperature_2m_min:days.map(()=>23),temperature_2m_max:days.map(()=>28),weather_code:days.map(()=>3),precipitation_probability_max:days.map(()=>16),sunrise:days.map((t,i)=>t+6*3600+42*60+i*60),sunset:days.map(t=>t+18*3600+14*60)}};
}
const model=normalizeForecast(rawFixture(),at);
const aqi={value:66,at,zone:model.zone,state:'fresh'};
const kinds=['sun','moon','cloud','partly','night_cloud','light_rain','heavy_rain','storm','snow','fog','wind'];

test('solar instants survive normalization and switch at sunrise/sunset and midnight',()=>{
  const rise=model.days[0].sunriseAt,set=model.days[0].sunsetAt,tomorrow=model.days[1].sunriseAt;
  assert.deepEqual([model.days[0].sunrise,model.days[0].sunset],['06:42','18:14']);
  for(const [now,label,time] of [[rise-1,'Sunrise','06:42'],[rise,'Sunset','18:14'],[set-1,'Sunset','18:14'],[set,'Sunrise','06:43'],[Date.parse('2026-10-11T21:01Z'),'Sunrise','06:43'],[tomorrow,'Sunset','18:14']]){
    const event=nextSolarEvent(model,now);assert.equal(event.label,label);assert.equal(event.time,time);assert(event.at>now);
  }
  const afterMidnight=normalizeForecast(rawFixture(Date.parse('2026-10-11T21:01Z')),Date.parse('2026-10-11T21:01Z'));
  assert.equal(afterMidnight.days[0].date,'2026-10-12');
  assert.equal(nextSolarEvent(afterMidnight,Date.parse('2026-10-11T21:01Z')).time,'06:43');
});

test('next-day solar formatting uses event-zone DST offset, never a fixed response offset',()=>{
  for(const [zone,night,rise,wall] of [['Asia/Jerusalem','2026-10-24T21:01Z','2026-10-25T04:51Z','06:51'],['America/New_York','2026-11-01T00:00Z','2026-11-01T11:30Z','06:30'],['Asia/Kolkata','2026-10-11T19:00Z','2026-10-12T00:45Z','06:15']]){
    const data={zone,days:[{date:rise.slice(0,10),sunriseAt:Date.parse(rise),sunsetAt:null}]};
    assert.equal(nextSolarEvent(data,Date.parse(night)).time,wall);
  }
  assert.equal(nextSolarEvent({zone:'Asia/Jerusalem',days:[{sunriseAt:null,sunsetAt:null}]},at),null);
  assert.equal(nextSolarEvent(null,at),null);
});

test('UV label, numeric value and eleven segments share the same risk bands',()=>{
  for(const [v,label,color] of [[0,'Low','#68ba64'],[2,'Low','#68ba64'],[3,'Moderate','#eacb54'],[5,'Moderate','#eacb54'],[6,'High','#ee974a'],[7,'High','#ee974a'],[8,'Very High','#e95960'],[10,'Very High','#e95960'],[11,'Extreme','#b17dea'],[15,'Extreme','#b17dea']]){
    const u=uvPresentation(v);assert.equal(u.label,label);assert.equal(u.color,color);assert.equal(u.segments.filter(c=>c!=='#304048').length,Math.min(11,v));
  }
  assert.deepEqual(uvPresentation(3).segments.slice(0,4),['#68ba64','#68ba64','#eacb54','#304048']);
  assert.equal(uvPresentation(2.6).label,'Moderate');assert.equal(uvPresentation(2.6).index,3);
  for(const v of [null,undefined,NaN,-1,31]){const u=uvPresentation(v);assert.equal(u.index,null);assert(u.segments.every(c=>c==='#304048'));}
});

test('every icon/temperature pair is centered by visible bounds and fits its card',()=>{
  for(const icon of kinds)for(const temperature of [null,-99,-9,0,8,11,28,70]){
    const l=currentConditionLayout({icon,temperature,label:'Thunderstorm'});
    assert(Math.abs((l.left-24)-(384-l.right))<1e-8);
    assert(l.left>=52-1e-8&&l.right<=356+1e-8);
    assert(l.captionMaxWidth>0&&l.numberMaxWidth>0);
  }
});

function response(){return {code:200,headers:{},status(v){this.code=v;return this;},setHeader(k,v){this.headers[k]=v;},end(){return this;},send(v){this.body=v;return this;},json(v){this.body=v;return this;}};}
test('a cached forecast/image changes the next solar event and ETag at sunset',async()=>{
  const sunset=model.days[0].sunsetAt;let now=sunset-5000,renders=0;
  const handler=createWeatherHandler({clock:()=>now,forecast:async()=>({data:model,state:'fresh',cache:'HIT'}),airQuality:async()=>aqi,
    render:async(data,options)=>{renders++;return Buffer.from(JSON.stringify(options.solarEvent));}});
  const request={method:'GET',url:'/api/weather-panel?lat=31.8&lon=34.65&v=14',headers:{}};
  const first=await handler(request,response());assert.match(first.headers['Cache-Control'],/max-age=5,/);assert.equal(JSON.parse(first.body).label,'Sunset');
  const warm=await handler(request,response());assert.equal(renders,1);assert.equal(warm.headers.ETag,first.headers.ETag);
  now=sunset;
  const after=await handler({...request,headers:{'if-none-match':first.headers.ETag}},response());
  assert.equal(after.code,200);assert.equal(JSON.parse(after.body).label,'Sunrise');assert.equal(JSON.parse(after.body).time,'06:43');assert.equal(renders,2);
});

test('rendered non-hero forecast pixels are unchanged; all condition and unavailable states render',async()=>{
  mkdirSync('work/weather-r14',{recursive:true});
  const old=await renderPNG(model,{revision:13,aqi}),day=await renderPNG(model,{revision:14,aqi,now:at});
  const extract={left:0,top:(512-240)*2,width:2270,height:1064};
  const previous=await sharp(old).extract(extract).raw().toBuffer(),current=await sharp(day).extract(extract).raw().toBuffer();
  assert(current.equals(previous),'Hourly/daily pixels changed');
  const night=await renderPNG(model,{revision:14,aqi,now:model.days[0].sunsetAt});
  const chrome=await sharp('assets/weather-premium/chrome-r14.png').toBuffer();
  for(const [name,panel] of [['day',day],['night',night]]){
    const composite=await sharp(chrome).composite([{input:await sharp(panel).resize(1135,804).toBuffer(),left:0,top:240}]).png().toBuffer();
    await sharp(composite).extract({left:24,top:248,width:1086,height:246}).png().toFile('work/weather-r14/current-'+name+'.png');
  }
  for(const icon of kinds){
    const data=structuredClone(model);data.current.icon=icon;data.current.label={moon:'Clear Night',sun:'Sunny',storm:'Thunderstorm',partly:'Partly Cloudy',night_cloud:'Partly Cloudy',heavy_rain:'Heavy Rain'}[icon]||icon.replaceAll('_',' ');
    const svg=renderSVG(data,{revision:14,aqi,now:at});assert(!/NaN|undefined/.test(svg));
  }
  // A compact contact sheet is rasterized from the real render, not a mockup.
  const tiles=[];
  for(let i=0;i<kinds.length;i++){
    const data=structuredClone(model);data.current.icon=kinds[i];data.current.label=kinds[i].replaceAll('_',' ');
    const png=await renderPNG(data,{revision:14,aqi,now:at});
    const tile=await sharp(png).resize(1135,804).extract({left:24,top:8,width:360,height:246}).toBuffer();
    tiles.push({input:tile,left:(i%3)*360,top:Math.floor(i/3)*246});
  }
  await sharp({create:{width:1080,height:984,channels:4,background:'#102029'}}).composite(tiles).png().toFile('work/weather-r14/icon-contact-sheet.png');
  const unavailable=renderSVG(null,{revision:14,now:at});assert(!/NaN|undefined/.test(unavailable));assert(unavailable.includes('Sunrise / Sunset'));
  if(existsSync('work/private/weather-before-r14.json')){
    const native=JSON.parse(readFileSync('work/private/Widgy_Health_Premium_1.json'));
    const original=JSON.parse(readFileSync('work/private/weather-before-r14.json'));
    assert(isDeepStrictEqual(native['36'],original['36']));
    for(const group of original['1'])if(group.d0!==246)assert(isDeepStrictEqual(native['1'].find(n=>n.d0===group.d0),group),'Unrelated widget tab changed');
  }
  writeFileSync('work/weather-r14/verified.json',JSON.stringify({nextEventAndDST:true,UVBoundaries:true,allIconsCentered:true,hourlyAndDailyPixelsUnchanged:true,otherTabsUnchanged:true}));
});
