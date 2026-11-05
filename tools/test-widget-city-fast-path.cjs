const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'widget-city-fast-path.js'),'utf8');
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
function harness(source=script) {
  let time=10000000,calls=0,alarms=0,aborts=0;
  const values=[],timers=new Map();let seq=0;
  let implementation=async url=>{
    const u=new URL(url);
    return {ok:true,json:async()=>({state:'LOOKUP',entry:{latitude:Number(u.searchParams.get('lat')),longitude:Number(u.searchParams.get('lon')),city:'Ashkelon',countryName:'Israel',observedAt:time}})};
  };
  class Clock extends Date {static now(){return time;}}
  const context=vm.createContext({Date:Clock,sendToWidgy:v=>values.push(v),
    setTimeout:(fn,ms)=>{assert.equal(ms,4000);alarms++;timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),
    AbortController:class {constructor(){this.signal={};}abort(){aborts++;}},
    fetch:(...args)=>{calls++;return implementation(...args);}});
  vm.runInContext(source,context);
  async function run(lat='1',lon='2',endpoint='https://example.invalid/?location_key=first'){
    const before=values.length;
    context.sharedLocationText(lat,lon,endpoint);await flush();
    return values.slice(before);
  }
  return {context,run,values,timers,get calls(){return calls;},get alarms(){return alarms;},get aborts(){return aborts;},get time(){return time;},set time(v){time=v;},set fetch(v){implementation=v;}};
}
const response=(entry,state='LOOKUP')=>({ok:true,json:async()=>({state,entry})});
(async()=>{
  const h=harness();
  for(let i=0;i<20;i++)assert.deepEqual(await h.run(),['Ashkelon, Israel']);
  assert.equal(h.calls,1);assert.equal(h.alarms,1);assert.equal(h.timers.size,0);
  const expires=h.context.__worldMapGlassCityV1.expiresAt;
  h.time+=59999;assert.deepEqual(await h.run('1.0','2.00'),['Ashkelon, Israel']);assert.equal(h.calls,1);
  assert.equal(h.context.__worldMapGlassCityV1.expiresAt,expires,'Warm hits cannot slide expiry');
  h.time++;await h.run();assert.equal(h.calls,2);
  await h.run('3','4');assert.equal(h.calls,3);
  await h.run('3','4','https://example.invalid/?location_key=second');assert.equal(h.calls,4);
  await h.run();assert.equal(h.calls,5,'One cached point, no location history');
  h.time-=1;await h.run();assert.equal(h.calls,6,'Clock rollback bypasses memory');
  // Re-created contexts, missing globalThis and inaccessible cache still work.
  for(const configure of [c=>{c.globalThis=undefined;},c=>{Object.defineProperty(c,'__worldMapGlassCityV1',{get(){throw Error('unavailable');}});},c=>{Object.defineProperty(c,'__worldMapGlassCityV1',{value:null,writable:false});}]) {
    const h=harness();configure(h.context);await h.run();await h.run();assert.equal(h.calls,2);assert.deepEqual(h.values,['Ashkelon, Israel','Ashkelon, Israel']);
  }
  for(const state of ['STALE','UNKNOWN',undefined]) {
    const h=harness();h.fetch=async()=>response({latitude:1,longitude:2,city:'Ashkelon',countryName:'Israel',observedAt:h.time},state===undefined?null:state);
    await h.run();await h.run();assert.equal(h.calls,2);assert.equal(h.values.length,2);
  }
  for(const stamp of [null,NaN,Infinity,'10000000',10000001,6400000]) {
    const h=harness();h.fetch=async()=>response({latitude:1,longitude:2,city:'Ashkelon',countryName:'Israel',observedAt:stamp});
    await h.run();await h.run();assert.equal(h.calls,2);assert.deepEqual(h.values,['Ashkelon, Israel','Ashkelon, Israel']);
  }
  const boundary=harness();boundary.fetch=async()=>response({latitude:1,longitude:2,city:'Ashkelon',countryName:'Israel',observedAt:6400500});
  await boundary.run();boundary.time+=499;await boundary.run();assert.equal(boundary.calls,1);
  boundary.time++;await boundary.run();assert.equal(boundary.calls,2,'Never extend original provider freshness');
  for(const entry of [null,{}, {latitude:8,longitude:2,city:'Wrong',countryName:'Israel'}, {latitude:1,longitude:2,city:{},countryName:'Israel'}, {latitude:1,longitude:2,city:'',countryName:'Israel'}]) {
    const h=harness();h.fetch=async()=>response(entry);await h.run();await h.run();assert.equal(h.calls,2);assert.deepEqual(h.values,['Location unavailable','Location unavailable']);
  }
  for(const fetch of [()=>{throw Error('fetch');},async()=>{throw Error('network');},async()=>({ok:false}),async()=>({ok:true,json:async()=>{throw Error('body');}})]) {
    const h=harness();h.fetch=fetch;assert.deepEqual(await h.run(),['Location unavailable']);assert.equal(h.context.__worldMapGlassCityV1,undefined);assert.equal(h.timers.size,0);
  }
  const invalid=harness();for(const [lat,lon] of [['91','2'],['1','181'],['NaN','2'],['${widgy.lat}','2']])assert.deepEqual(await invalid.run(lat,lon),['Location unavailable']);assert.equal(invalid.calls,0);
  const timeout=harness();let release;
  timeout.fetch=()=>new Promise(r=>release=r);assert.deepEqual(await timeout.run(),[]);
  [...timeout.timers.values()][0]();assert.equal(timeout.aborts,1);
  release(response({latitude:1,longitude:2,city:'Too late',countryName:'Israel',observedAt:timeout.time}));await flush();
  assert.deepEqual(timeout.values,['Location unavailable']);assert.equal(timeout.context.__worldMapGlassCityV1,undefined);
  // Optional comparison with the actual previous script, never logged.
  if(process.argv[2]) {
    const widget=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
    const walk=n=>(Array.isArray(n['1'])?n['1']:[]).flatMap(c=>[c,...walk(c)]);
    const old=walk(widget).find(n=>n.d0===83204)['66'][0]['10'].replace(/^sharedLocationText\([^\n]+\);\s*$/m,'');
    const before=harness(old);for(let i=0;i<20;i++)await before.run();assert.equal(before.calls,20);
    console.log('Simulated reusable JS context: 20 consecutive calls, fetches 20 -> 1; all outputs identical. This is not an iPhone timing measurement.');
  }
  console.log('PASS: TTL, coordinates, credential isolation, clock rollback, context fallback, stale/invalid/error responses, timeout and late-callback guards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
