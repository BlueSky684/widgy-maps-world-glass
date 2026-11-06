import test from 'node:test';
import assert from 'node:assert/strict';
import {createForecastService} from '../lib/weather/service.js';
import {createAQIService} from '../lib/weather/air-quality.js';
import {createWeatherHandler} from '../lib/weather/handler.js';
import {persistWeatherCache} from '../lib/weather/cache-write.js';

const now=Date.parse('2026-11-06T07:00:00Z');
function forecastFixture(){
  const start=Date.parse('2026-11-06T00:00:00Z')/1000;
  return {timezone:'UTC',utc_offset_seconds:0,
    current:{time:now/1000,temperature_2m:23,weather_code:0,is_day:1},
    hourly:{time:Array.from({length:144},(_,i)=>start+i*3600)},
    daily:{time:Array.from({length:6},(_,i)=>start+i*86400)}};
}
const airFixture={timezone:'UTC',current:{time:now/1000,us_aqi:53}};
function gate(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
async function settledWithin(promise,ms=80){
  let timer;
  try{return await Promise.race([promise.then(()=>true),new Promise(r=>timer=setTimeout(()=>r(false),ms))]);}
  finally{clearTimeout(timer);}
}
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;},end(){return this;}};}

for(const kind of ['forecast','aqi'])test(`${kind}: validated live data returns while cache write is pending`,async()=>{
  const blocked=gate(),started=gate(),tasks=[],writes=[];
  const raw=kind==='forecast'?forecastFixture():airFixture;
  const cache={get:async()=>undefined,set:async(key,value,options)=>{writes.push({value,options});started.resolve();await blocked.promise;}};
  const options={cache,clock:()=>now,flights:new Map(),schedule:p=>tasks.push(p),fetcher:async()=>new Response(JSON.stringify(raw))};
  const run=kind==='forecast'?createForecastService(options)(0,0):createAQIService(options)(0,0).then(x=>x.refresh);
  await started.promise;
  try {
    assert.equal(await settledWithin(run),true,'A cache write must not hold validated data');
    const result=await run;
    assert.equal(result.state,'fresh');
    assert.equal(kind==='forecast'?result.data.current.temperature:result.value,kind==='forecast'?23:53);
    assert.deepEqual(writes[0].value.raw,raw,'The complete original provider payload is still persisted');
    assert.equal(writes[0].options.ttl,kind==='forecast'?3600:5400);
  }finally{blocked.resolve();await run;await Promise.all(tasks);}
});

test('first Weather JSON retains AQI despite a blocked cache write',async()=>{
  const blocked=gate(),tasks=[];
  const airQuality=createAQIService({cache:{get:async()=>undefined,set:()=>blocked.promise},clock:()=>now,flights:new Map(),schedule:p=>tasks.push(p),fetcher:async()=>new Response(JSON.stringify(airFixture))});
  const forecast=createForecastService({cache:{get:async()=>undefined,set:async()=>{}},clock:()=>now,flights:new Map(),schedule:p=>tasks.push(p),fetcher:async()=>new Response(JSON.stringify(forecastFixture()))});
  const handler=createWeatherHandler({forecast,airQuality,clock:()=>now,aqiWaitMs:30});
  try{
    const result=await handler({method:'GET',url:'/api/weather-panel?lat=0&lon=0&format=json'},response());
    assert.equal(result.statusCode,200);assert.equal(result.body.aqi,53);assert.equal(result.headers['X-AQI-State'],'fresh');
    assert.equal(result.body.temperature,'23°C');
  }finally{blocked.resolve();await Promise.all(tasks);}
});

for(const kind of ['forecast','aqi'])for(const failure of ['sync','async'])test(`${kind}: ${failure} cache failure cannot reject live data`,async()=>{
  const tasks=[];
  const options={cache:{get:async()=>undefined,set:()=>{if(failure==='sync')throw Error('cache offline');return Promise.reject(Error('cache offline'));}},clock:()=>now,flights:new Map(),schedule:p=>tasks.push(p),fetcher:async()=>new Response(JSON.stringify(kind==='forecast'?forecastFixture():airFixture))};
  const result=kind==='forecast'?await createForecastService(options)(0,0):await (await createAQIService(options)(0,0)).refresh;
  assert.equal(result.state,'fresh');assert.equal(kind==='forecast'?result.data.current.temperature:result.value,kind==='forecast'?23:53);
  await Promise.all(tasks);
});

for(const kind of ['forecast','aqi'])test(`${kind}: adjacent reads reuse verified data during pending persistence`,async()=>{
  const blocked=gate(),tasks=[],flights=new Map();let calls=0;
  const options={cache:{get:async()=>undefined,set:()=>blocked.promise},clock:()=>now,flights,schedule:p=>tasks.push(p),fetcher:async()=>{calls++;return new Response(JSON.stringify(kind==='forecast'?forecastFixture():airFixture));}};
  const service=kind==='forecast'?createForecastService(options):createAQIService(options);
  const read=()=>kind==='forecast'?service(0,0):service(0,0).then(x=>x.refresh);
  try{
    const first=await read();const more=await Promise.all(Array.from({length:12},read));
    assert.equal(calls,1);assert(more.every(x=>x===first));assert.equal(flights.size,1);
  }finally{blocked.resolve();await Promise.all(tasks);}
  assert.equal(flights.size,0);
});

test('an unresponsive cache cannot retain background work indefinitely',async()=>{
  const tasks=[];const write=persistWeatherCache(()=>new Promise(()=>{}),p=>tasks.push(p),10);
  assert.equal(await settledWithin(write,100),true);await Promise.all(tasks);
});
