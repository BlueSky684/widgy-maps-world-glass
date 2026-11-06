import test from 'node:test';import assert from 'node:assert/strict';
import {createWeatherHandler} from '../lib/weather/handler.js';
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){this.ended=true;return this;}};}
const forecast={data:{zone:'UTC',at:1,current:{temperature:23,label:'PRIVATE_WEATHER_SENTINEL',icon:'sun'},days:[{high:25,low:18,sunrise:'06:00',sunset:'17:00'}],hours:[]},state:'fresh',cache:'HIT',tier:'memory'};
test('timing rows cover JSON/image/cache/HEAD/rejection without personal data',async()=>{
  const rows=[];
  const h=createWeatherHandler({forecast:async()=>forecast,airQuality:async()=>({value:53,state:'fresh'}),render:async()=>Buffer.from('timing-fixture-unique'),log:r=>rows.push(r)});
  for(const [method,query] of [['GET','&format=json&view=home-v1'],['GET','&format=json'],['GET',''],['HEAD',''],['POST','']]){
    await h({method,url:'/api/weather-panel?lat=12.34567&lon=65.43210&v=13&private=PRIVATE_QUERY_SENTINEL'+query,headers:{authorization:'PRIVATE_HEADER_SENTINEL'}},response());
  }
  assert.equal(rows.length,5);assert.equal(rows[0].view,'home-v1');assert.equal(rows[0].aqiState,'not-requested');assert.equal(rows[0].forecastTier,'memory');
  assert.equal(rows[1].aqiState,'fresh');assert.equal(rows[2].renderCache,'MISS');assert.equal(rows[3].renderCache,'HIT');assert.equal(rows[3].bodyBytes,0);assert.equal(rows[4].status,405);
  const text=JSON.stringify(rows);for(const secret of ['PRIVATE_','12.34567','65.43210','temperature','timezone','authorization','/api/'])assert(!text.includes(secret),secret);
  const allowed=new Set(['event','phase','status','elapsedMs','method','view','airReadMs','forecastMs','forecastCache','forecastTier','airWaitMs','aqiState','bodyBytes','renderCache','renderMs']);
  for(const row of rows){for(const key of Object.keys(row))assert(allowed.has(key),key);for(const [key,value] of Object.entries(row))if(key.endsWith('Ms'))assert(Number.isFinite(value)&&value>=0,key);}
});
test('a failing diagnostic sink cannot hide valid Home data',async()=>{
  const h=createWeatherHandler({forecast:async()=>forecast,log:()=>{throw Error('logger unavailable');}});
  const r=await h({method:'GET',url:'/api/weather-panel?lat=0&lon=0&format=json&view=home-v1'},response());assert.equal(r.statusCode,200);assert.equal(r.body.temperature,'23°C');
});
