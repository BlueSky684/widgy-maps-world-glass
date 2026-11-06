import test from 'node:test';
import assert from 'node:assert/strict';
import {createForecastService,FRESH_MS,STALE_MS} from '../lib/weather/service.js';
import {normalizeForecast} from '../lib/weather/model.js';

const epoch=Date.parse('2026-11-06T07:59:00Z');
function fixture(t=epoch){
  const start=Math.floor(t/86400000)*86400;
  return {timezone:'UTC',utc_offset_seconds:0,current:{time:t/1000,temperature_2m:23,weather_code:0,is_day:1},hourly:{time:Array.from({length:144},(_,i)=>start+i*3600)},daily:{time:Array.from({length:6},(_,i)=>start+i*86400)}};
}
function setup(){
  const s={time:epoch,gets:0,calls:0,fail:false,remote:new Map(),tasks:[]};
  const options={clock:()=>s.time,flights:new Map(),schedule:p=>s.tasks.push(p),cache:{get:async key=>{s.gets++;return s.remote.get(key);},set:async(key,value)=>s.remote.set(key,value)},fetcher:async()=>{s.calls++;if(s.fail)throw Error('offline');return new Response(JSON.stringify(fixture(s.time)));}};
  s.get=createForecastService(options);s.flush=()=>Promise.all(s.tasks);return s;
}

test('completed forecast skips regional reads after one minute without extending freshness',async()=>{
  const s=setup();const first=await s.get(0,0);await s.flush();assert.equal(s.calls,1);assert.equal(s.gets,1);
  s.time+=60001;const next=await s.get(0,0);
  assert.equal(next.tier,'memory');assert.equal(s.gets,1);assert.equal(s.calls,1);
  assert.deepEqual(next.data,normalizeForecast(fixture(epoch),s.time));
  assert.notEqual(next.data.hours[0].time,first.data.hours[0].time,'Current hour is recomputed across the hour boundary');
  s.time=epoch+FRESH_MS-1;await s.get(0,0);assert.equal(s.gets,1);
  s.time=epoch+FRESH_MS;await s.get(0,0);await s.flush();assert.equal(s.gets,2);assert.equal(s.calls,2,'Hits do not slide the original ten-minute boundary');
});

test('a regional snapshot retains its original age in memory',async()=>{
  let t=epoch,gets=0,calls=0;
  const savedAt=epoch-FRESH_MS+1000;
  const get=createForecastService({clock:()=>t,flights:new Map(),cache:{get:async()=>{gets++;return {savedAt,raw:fixture(epoch)};},set:async()=>{}},schedule:()=>{},fetcher:async()=>{calls++;return new Response(JSON.stringify(fixture(t)));}});
  assert.equal((await get(0,0)).tier,'regional');
  t+=999;assert.equal((await get(0,0)).tier,'memory');assert.equal(gets,1);
  t++;await get(0,0);assert.equal(calls,1);assert.equal(gets,2);
});

test('provider/cache failures preserve only a validated in-age fallback; expiry never becomes fresh',async()=>{
  const s=setup();await s.get(0,0);await s.flush();s.remote.clear();s.fail=true;
  s.time=epoch+FRESH_MS;assert.equal((await s.get(0,0)).state,'stale');
  s.time=epoch+STALE_MS-1;assert.equal((await s.get(0,0)).state,'stale');
  s.time=epoch+STALE_MS;assert.equal((await s.get(0,0)).state,'unavailable');
  assert.equal((await s.get(2,2)).state,'unavailable','No cross-cell fallback');
});

test('cache memory is bounded and location cells stay isolated',async()=>{
  const s=setup();
  for(let i=0;i<65;i++){await s.get(i/10,0);await s.flush();}
  const before=s.gets;
  assert.equal((await s.get(6.4,0)).tier,'memory');assert.equal(s.gets,before);
  assert.equal((await s.get(0,0)).tier,'regional');assert.equal(s.gets,before+1,'Oldest of 65 records is evicted');
});

test('clock rollback and invalid newer regional data do not renew or replace valid observations',async()=>{
  const s=setup();await s.get(0,0);await s.flush();
  s.time=epoch+FRESH_MS;s.fail=true;
  const key=[...s.remote.keys()][0];s.remote.set(key,{savedAt:s.time,raw:{broken:true}});
  assert.equal((await s.get(0,0)).state,'stale','Invalid newer remote cannot replace known-good local data');
  s.time=epoch-1;s.remote.clear();assert.equal((await s.get(0,0)).state,'unavailable','Future-dated local data is rejected');
});
