import assert from 'node:assert/strict';
import {createWidgetContext} from '../lib/widget-context.js';
import {createWeatherHandler} from '../lib/weather/handler.js';
import {createNativeLocationHandler} from '../lib/location/native-label.js';
import {homeWidgyData} from '../lib/weather/widgy-data.js';
const fixtures={calendar:{encoded:'PRIVATE_EVENT_DATA'},weather:{icon_status:'Clear',temperature:'23°C'},location:{text:'PRIVATE_CITY'}};
const keys=Object.keys(fixtures),logs=[],seen=[];
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.statusCode=c;return this;},json(b){this.body=b;return this;},end(){return this;}};}
function loaders(overrides={}){return Object.fromEntries(keys.map(key=>[key,async()=>overrides[key]||((req,res)=>{seen.push({key,req});res.setHeader('Cache-Control','private, max-age=30, must-revalidate');res.json(fixtures[key]);})]));}
const url='/api/calendar-widget?context=home-v1&token=PRIVATE_TOKEN&flights=W10&lat=1&lon=2&location_key=PRIVATE_KEY&day_zone=Asia%2FKolkata&refresh=20&url=https://evil.invalid&cookie=PRIVATE_COOKIE';
async function call(options={},request={}){const res=response();await createWidgetContext({...loaders(),clock:()=>1000,log:x=>logs.push(x),...options})({method:'GET',url,...request},res);return res;}
const good=await call();
assert.deepEqual(good.body,{version:1,...fixtures});
assert.equal(good.headers['cache-control'],'private, max-age=30, must-revalidate');
assert.equal(good.headers['cdn-cache-control'],'no-store');
assert.equal(good.headers['vercel-cdn-cache-control'],'no-store');
assert.equal(new URL(seen[0].req.url,'https://test.invalid').pathname,'/api/calendar-widget');
assert.equal(new URL(seen[1].req.url,'https://test.invalid').pathname,'/api/weather-panel');
assert.equal(new URL(seen[2].req.url,'https://test.invalid').pathname,'/api/fetch-probe');
for(const {key,req} of seen){const q=new URL(req.url,'https://test.invalid').searchParams;assert.equal(q.has('context'),false);assert.equal(q.has('url'),false);assert.equal(q.has('cookie'),false);assert.deepEqual(req.headers,{});if(key!=='calendar')assert.equal(q.has('token'),false);if(key!=='location')assert.equal(q.has('location_key'),false);}
// A barrier proves concurrency without timing-sensitive performance assertions.
let release;const barrier=new Promise(r=>release=r),started=[];
const parallel=Object.fromEntries(keys.map(key=>[key,async()=>async(req,res)=>{started.push(key);if(started.length===3)release();await barrier;res.json(fixtures[key]);}]));
const pending=call(parallel);await new Promise(r=>setImmediate(r));assert.equal(started.length,3);await pending;
for(const key of keys){for(const failure of ['throw','status','malformed','import']){
  const handler=async(req,res)=>{if(failure==='throw')throw Error('PRIVATE_ERROR');if(failure==='status')res.status(401);res.json({wrong:true});};
  const r=await call({...loaders({[key]:handler}),...(failure==='import'?{[key]:async()=>{throw Error('PRIVATE_IMPORT');}}:{})});
  assert.equal(r.statusCode,200);assert.match(r.headers['cache-control'],/^private, no-store(?:, max-age=0)?$/);
  for(const other of keys.filter(x=>x!==key))assert.deepEqual(r.body[other],fixtures[other]);
  assert.deepEqual(r.body[key],key==='calendar'?{encoded:''}:key==='location'?{text:'Location unavailable'}:homeWidgyData(null));
}}
let time=0;
const timed=await call({clock:()=>time,...Object.fromEntries(keys.map((key,i)=>[key,async()=>async(req,res)=>{if(i===2){await new Promise(r=>setImmediate(r));time=7000;}res.setHeader('Cache-Control',`private, max-age=${i===0?10:30}`);res.json(fixtures[key]);}]))});
assert.equal(timed.headers['cache-control'],'private, max-age=3, must-revalidate','Do not extend the first component expiry while waiting for another');
const head=await call({}, {method:'HEAD'});assert.equal(head.body,undefined);assert.equal(head.headers['x-widget-context-parts'],good.headers['x-widget-context-parts']);
for(const [method,query,status] of [['POST',url,405],['GET',url+'&token=other',400],['GET','/?context=unknown',400]]){
 let touched=false;const rejected=await call(Object.fromEntries(keys.map(k=>[k,async()=>{touched=true;throw Error();}])),{method,url:query});assert.equal(rejected.statusCode,status);assert.equal(touched,false);
}
assert(!JSON.stringify(logs).includes('PRIVATE_'),'No secrets or event/location values in context logs');
let lateRelease,deferred;
const late=new Promise(r=>lateRelease=r);
const bounded=await call({budgetMs:1,defer:p=>{deferred=p;},calendar:async()=>async(req,res)=>{await late;res.json(fixtures.calendar);}});
assert.deepEqual(bounded.body.calendar,{encoded:''});
assert.deepEqual(bounded.body.weather,fixtures.weather);
assert.match(bounded.headers['x-widget-context-parts'],/calendar=504/);
assert.match(bounded.headers['cache-control'],/no-store/);
lateRelease();await deferred;
assert.deepEqual(bounded.body.calendar,{encoded:''},'A late component cannot mutate a sent response');
// Actual existing handlers retain their validators and native projections.
let forecastCalls=0,cityCalls=0,authCalls=0;
const actualWx=createWeatherHandler({forecast:async()=>{forecastCalls++;return {data:null,state:'fresh',cache:'HIT'};},airQuality:async()=>{throw Error('Home must not call AQI');},render:async()=>{throw Error('Home must not render PNG');},log:()=>{}});
const actualCity=createNativeLocationHandler({authorize:u=>{authCalls++;assert.equal(u.searchParams.get('location_key'),'PRIVATE_KEY');return {latitude:1,longitude:2};},resolve:async()=>{cityCalls++;return {entry:{latitude:1,longitude:2,city:'Test',countryName:'Country'}};}});
const actual=await call({weather:async()=>actualWx,location:async()=>actualCity});
assert.equal(actual.body.weather.icon_status,'—');assert.equal(actual.body.location.text,'Test, Country');assert.deepEqual([forecastCalls,cityCalls,authCalls],[1,1,1]);
console.log('PASS: shared context projection, concurrent handlers, routing and credential isolation, 12 partial failure cases, bounded expiry, HEAD, validation, privacy and actual weather/location handler contracts.');
