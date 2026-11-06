import test from 'node:test';
import assert from 'node:assert/strict';
import {homeClientMaxAge} from '../lib/weather/home-cache.js';
import {createWeatherHandler} from '../lib/weather/handler.js';
import {createForecastService,FRESH_MS} from '../lib/weather/service.js';

const now=Date.parse('2026-11-06T08:00:05Z');
const data={zone:'Asia/Jerusalem',at:now,current:{temperature:20,label:'Rain',icon:'light_rain'},
  hours:[],days:[{date:'2026-11-06',high:23,low:18,sunrise:'06:01',sunset:'16:48'}]};
const result={data,state:'fresh',cache:'HIT',freshUntil:now+FRESH_MS};
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;},end(){return this;}});

test('cache reuse stops at original freshness, minute, solar event and model age boundaries',()=>{
  assert.equal(homeClientMaxAge(result,now),30);
  assert.equal(homeClientMaxAge({...result,freshUntil:now+8200},now),8);
  assert.equal(homeClientMaxAge(result,now+50000),5);
  assert.equal(homeClientMaxAge({...result,data:{...data,days:[{sunsetAt:now+3200}]}},now),3);
  assert.equal(homeClientMaxAge({...result,data:{...data,at:now-3*3600000+2500}},now),2);
  for(const bad of [{...result,state:'stale'},{...result,state:'unavailable'},
    {...result,freshUntil:now},{...result,freshUntil:undefined},{...result,data:{...data,zone:'bad'}}])assert.equal(homeClientMaxAge(bad,now),0);
  for(const zone of ['Asia/Jerusalem','America/New_York','Asia/Kathmandu','Pacific/Kiritimati']){
    const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,dateStyle:'short'});
    for(let minute=0;minute<1440;minute++){
      const t=Date.parse('2026-11-06T00:00:00Z')+minute*60000+59000;
      const age=homeClientMaxAge({...result,freshUntil:t+FRESH_MS,data:{...data,zone,at:t}},t);
      assert(age<=1);if(age>0)assert.equal(formatter.format(t),formatter.format(t+age*1000-1));
    }
  }
});

test('only opted-in Home can cache: exact payload, no AQI, private only, errors stay no-store',async()=>{
  const h=createWeatherHandler({clock:()=>now,forecast:async()=>result,airQuality:()=>{throw Error('unexpected AQI');},log:()=>{}});
  const request=(suffix,method='GET')=>h({method,url:'/api/weather-panel?lat=0&lon=0&format=json&view=home-v1'+suffix},response());
  const original=await request(''),candidate=await request('&reuse=home-30s-v1');
  assert.deepEqual(candidate.body,original.body);
  assert.equal(original.headers['Cache-Control'],'private, no-store');
  assert.equal(candidate.headers['Cache-Control'],'private, max-age=30, must-revalidate');
  assert.equal(candidate.headers['CDN-Cache-Control'],'no-store');
  assert.equal(candidate.headers['Vercel-CDN-Cache-Control'],'no-store');
  const head=await request('&reuse=home-30s-v1','HEAD');assert.equal(head.body,undefined);assert.equal(head.headers['Cache-Control'],candidate.headers['Cache-Control']);
  for(const state of ['stale','unavailable']){
    const bad=createWeatherHandler({clock:()=>now,forecast:async()=>({...result,state}),log:()=>{}});
    const r=await bad({method:'GET',url:'/api/weather-panel?lat=0&lon=0&format=json&view=home-v1&reuse=home-30s-v1'},response());
    assert.equal(r.headers['Cache-Control'],'private, no-store');
  }
});

test('forecast freshUntil is anchored to the existing observation, never renewed by memory hits',async()=>{
  let time=Date.parse('2026-11-06T08:00Z'),calls=0;
  const start=Date.parse('2026-11-06T00:00Z')/1000;
  const raw={timezone:'UTC',current:{time:time/1000},hourly:{time:Array.from({length:144},(_,i)=>start+i*3600)},daily:{time:Array.from({length:6},(_,i)=>start+i*86400)}};
  const read=createForecastService({clock:()=>time,cache:{get:async()=>null,set:async()=>{}},flights:new Map(),schedule:()=>{},fetcher:async()=>{calls++;return Response.json(raw);}});
  const first=await read(0,0);time+=70000;const second=await read(0,0);
  assert.equal(first.freshUntil,second.freshUntil);assert.equal(calls,1);assert.equal(second.freshUntil,time-70000+FRESH_MS);
});
