import assert from 'node:assert/strict';
import {measureCityLookup,cityReport} from './widgy-city-timing.js';
let clock=0,requests=0;
const fixture={
  now:()=>clock,
  geolocate:(ok,fail,options)=>{assert.equal(options.maximumAge,0);clock+=350;ok({coords:{latitude:0,longitude:0}});},
  fetcher:async(url,options)=>{
    requests++;assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
    const u=new URL(url);assert.equal(u.hostname,'api.bigdatacloud.net');assert.equal(u.searchParams.get('latitude'),'0');assert.equal(u.searchParams.get('longitude'),'0');
    clock+=120;return {ok:true,status:200,json:async()=>{clock+=30;return {latitude:0,longitude:0,lookupSource:'coordinates',city:'PRIVATE_CITY_SENTINEL'};}};
  }
};
const result=await measureCityLookup(fixture);
assert.equal(result.ok,true);assert.equal(result.locationMs,350);assert.equal(result.lookupHeadersMs,120);assert.equal(result.lookupMs,150);assert.equal(result.totalMs,500);assert.equal(result.cityAvailable,true);
assert(!JSON.stringify(result).includes('PRIVATE_CITY_SENTINEL'));
const report=cityReport({...result,latitude:0,longitude:0,city:'PRIVATE_CITY_SENTINEL',url:'https://secret.test',response:{secret:true}});
assert(!/latitude|longitude|PRIVATE_CITY_SENTINEL|secret\.test/.test(report));
const before=requests;
const denied=await measureCityLookup({...fixture,geolocate:(_,fail)=>fail({code:1})});
assert.equal(denied.error,'location_denied');assert.equal(requests,before);
const aborted=new AbortController();aborted.abort();
const cancelled=await measureCityLookup({...fixture,signal:aborted.signal});assert.equal(cancelled.error,'cancelled');assert.equal(requests,before);
let late;
const pendingController=new AbortController();
const pending=measureCityLookup({...fixture,signal:pendingController.signal,geolocate:ok=>{late=ok;}});
pendingController.abort();await pending;late({coords:{latitude:0,longitude:0}});await Promise.resolve();assert.equal(requests,before);
const http=await measureCityLookup({...fixture,fetcher:async()=>({ok:false,status:402})});assert.equal(http.error,'lookup_http_402');
const network=await measureCityLookup({...fixture,fetcher:async()=>{throw Error('https://private.test?latitude=12');}});assert.equal(network.error,'lookup_network_failed');assert(!JSON.stringify(network).includes('latitude'));
const timeout=await measureCityLookup({...fixture,lookupTimeoutMs:5,fetcher:async(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}))});assert.equal(timeout.error,'lookup_timeout');
const wrong=await measureCityLookup({...fixture,fetcher:async()=>({ok:true,status:200,json:async()=>({latitude:12,longitude:45,lookupSource:'ip',city:'Private'})})});assert.equal(wrong.cityAvailable,false);assert.equal(wrong.returnedCoordinatesMatch,false);
console.log('Passed: synthetic-only mocks, phase timing, permission denial/pre-cancel/late location never fetch, allowlisted report excludes location and payload, mismatched/IP location not accepted, network errors redacted, timeout. No real geocoder requests.');
