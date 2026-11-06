import test from 'node:test';
import assert from 'node:assert/strict';
import {createWeatherHandler} from '../lib/weather/handler.js';
import {widgyData,homeWidgyData,HOME_WEATHER_FIELDS} from '../lib/weather/widgy-data.js';

const now=Date.parse('2026-11-06T08:00:00Z');
const data={zone:'Asia/Jerusalem',at:now,current:{temperature:24,label:'Partly Cloudy',icon:'partly',wind:11},hours:[],days:[{high:27,low:19,sunrise:'06:02',sunset:'16:47'}]};
const air={value:53,at:now,zone:data.zone,state:'fresh'};
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){this.ended=true;return this;}};}
function request(handler,query,method='GET'){return handler({method,url:'/api/weather-panel?lat=0&lon=0&v=13'+query,headers:{}},response());}

test('Home completes while default JSON still waits for the first AQI number',async()=>{
  let release,airCalls=0,fullDone=false;
  const pending=new Promise(resolve=>release=resolve);
  const h=createWeatherHandler({clock:()=>now,forecast:async()=>({data,state:'fresh',cache:'HIT'}),airQuality:async()=>{airCalls++;return {value:null,state:'loading',refresh:pending};}});
  const full=request(h,'&format=json').then(x=>{fullDone=true;return x;});
  try{
    const home=await request(h,'&format=json&view=home-v1');
    assert.equal(fullDone,false);assert.equal(airCalls,1,'Home must not start another AQI operation');
    assert.equal(home.statusCode,200);assert.equal(home.headers['X-AQI-State'],'not-requested');assert.match(home.headers['Server-Timing'],/^weather;dur=/);
    assert.equal(home.headers['Cache-Control'],'private, no-store');
    release(air);const original=await full;
    assert.equal(original.body.aqi,53);
    for(const key of HOME_WEATHER_FIELDS)assert.equal(home.body[key],original.body[key],key);
    assert(!('aqi' in home.body),'The opt-in projection does not pretend missing AQI is a provider error');
  }finally{release(air);await full;}
});

test('only the explicit JSON Home view skips AQI; image and default contract stay intact',async()=>{
  let calls=0,rendered=[];
  const h=createWeatherHandler({forecast:async()=>({data,state:'fresh',cache:'HIT'}),airQuality:async()=>{calls++;return air;},render:async(_,o)=>{rendered.push(o);return Buffer.from('home-view-contract');}});
  for(const query of ['&format=json','&format=json&view=unknown','&view=home-v1']){
    const before=calls,r=await request(h,query);assert.equal(calls,before+1);
    if(query.includes('format=json'))assert.equal(r.body.aqi,53);
    else {assert.equal(r.headers['X-AQI-Value'],'53');assert.equal(rendered.at(-1).aqi.value,53);}
  }
  const before=calls,head=await request(h,'&format=json&view=home-v1','HEAD');
  assert.equal(calls,before);assert(head.ended);assert.equal(head.body,undefined);
});

test('every displayed Home field remains exact across missing values, all artwork states and stale data',()=>{
  for(const icon of ['sun','moon','partly','night_cloud','cloud','light_rain','heavy_rain','snow','storm','fog','wind',null])for(const temperature of [null,0,-8,24]){
    const value={...data,current:{...data.current,icon,temperature}};
    for(const state of ['fresh','stale','unavailable']){
      const full=widgyData(value,{aqi:air,state}),home=homeWidgyData(value,{state});
      for(const key of Object.keys(home))assert.deepEqual(home[key],full[key],key);
    }
  }
  for(const key of HOME_WEATHER_FIELDS)assert.equal(homeWidgyData(null)[key],widgyData(null)[key]);
});

test('unavailable location never starts providers and retains original Home placeholders',async()=>{
  const h=createWeatherHandler({forecast:async()=>{throw Error('must not fetch');},airQuality:async()=>{throw Error('must not fetch');}});
  const r=await h({method:'GET',url:'/api/weather-panel?lat=&lon=&format=json&view=home-v1'},response());
  assert.equal(r.statusCode,200);assert.equal(r.body.state,'location');
  assert.equal(r.body.temperature,'—');assert.equal(r.body.sunrise,'—');assert.equal(r.body.icon_status,'—');
});
