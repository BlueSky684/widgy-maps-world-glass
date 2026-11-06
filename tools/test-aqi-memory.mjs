import test from 'node:test';
import assert from 'node:assert/strict';
import {createAQIService,AQI_FRESH_MS,AQI_MAX_AGE_MS} from '../lib/weather/air-quality.js';

const fixture=(time,value=53)=>({timezone:'UTC',current:{time:time/1000,us_aqi:value}});
test('fresh repeated Weather reads avoid remote cache I/O without renewing AQI age',async()=>{
  let time=Date.parse('2026-11-06T08:00Z'),gets=0,fetches=0;
  const savedAt=time;
  const read=createAQIService({clock:()=>time,cache:{get:async()=>{gets++;return {raw:fixture(savedAt),savedAt};},set:async()=>{}},
    flights:new Map(),schedule:()=>{},fetcher:async()=>{fetches++;return Response.json(fixture(time,61));}});
  assert.equal((await read(1,1)).value,53);
  for(let i=0;i<20;i++)assert.equal((await read(1,1)).value,53);
  assert.equal(gets,1);assert.equal(fetches,0);
  time+=AQI_FRESH_MS;const expired=await read(1,1);
  assert.equal(expired.state,'stale');assert.equal((await expired.refresh).value,61);
  assert.equal(gets,2);assert.equal(fetches,1);assert.equal((await read(1,1)).value,61);
});

test('newer remote observations, movement, invalid data and rollback cannot be hidden by memory',async()=>{
  let time=Date.parse('2026-11-06T08:00Z'),remote={raw:fixture(time),savedAt:time},gets=0;
  const read=createAQIService({clock:()=>time,cache:{get:async()=>{gets++;return remote;},set:async()=>{}},flights:new Map(),schedule:()=>{},fetcher:async()=>{throw Error('offline');}});
  await read(1,1);await read(2,2);assert.equal(gets,2);
  time+=AQI_FRESH_MS;remote={raw:fixture(time,72),savedAt:time};assert.equal((await read(1,1)).value,72);
  time++;remote={raw:{},savedAt:time};const local=await read(1,1);assert.equal(local.value,72);
  time-=1000;remote=null;const rollback=await read(1,1);assert.equal(rollback.value,null);await rollback.refresh;
  time+=AQI_MAX_AGE_MS+1000;const unavailable=await read(1,1);assert.equal(unavailable.value,null);await unavailable.refresh;
});

test('64-entry bound and failed refresh preserve usable values only',async()=>{
  const time=Date.parse('2026-11-06T08:00Z');let gets=0,failed=false;
  const read=createAQIService({clock:()=>time,cache:{get:async()=>{gets++;return failed?null:{raw:fixture(time),savedAt:time};},set:async()=>{}},flights:new Map(),schedule:()=>{},fetcher:async()=>{throw Error('offline');}});
  for(let i=0;i<65;i++)await read(i,0);
  await read(64,0);assert.equal(gets,65);
  await read(0,0);assert.equal(gets,66);
  failed=true;const next=await read(70,0);assert.equal((await next.refresh).value,null);
});
