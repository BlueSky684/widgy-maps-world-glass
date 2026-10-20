const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const source=fs.readFileSync(__dirname+'/../bridge.ts','utf8');
const js=stripTypeScriptTypes(source,{mode:'transform'}).replace(/^import .*\n/gm,'')
  .replace(/^export \{.*\} from .*\n/gm,'').replace(/\bexport /g,'');
const context=vm.createContext({Date,Uint8Array,encodeURIComponent,WIDTH:2400,HEIGHT:1131});
vm.runInContext(js+'\nthis.functions={mapURL,liveMapURL,VERSION};',context);
const {mapURL,liveMapURL,VERSION}=context.functions, key='synthetic key & characters';
const now=Date.now(),point={latitude:51.5074,longitude:-0.1278,timestamp:now};
const expected='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
for(const value of [mapURL('A',key),mapURL('B',key),liveMapURL(point,key,now)]) {
  const url=new URL(value);assert.equal(url.origin,expected);assert.equal(url.pathname,'/api/night-map');
  assert.equal(url.searchParams.get('delivery'),'vercel-file-v1');assert.equal(url.searchParams.get('location_key'),key);
  assert.equal(url.searchParams.get('width'),'2400');assert.equal(url.searchParams.get('presentation'),'glass');
  assert(!url.searchParams.has('_vercel_share'));assert(!value.includes('.run.app'));
}
const live=new URL(liveMapURL(point,key,now));assert.equal(live.searchParams.get('shared_location'),'1');
assert(!live.searchParams.has('city'));assert(!live.searchParams.has('at'));assert.equal(VERSION,'0.6.2');
assert.throws(()=>liveMapURL({...point,timestamp:now-120001},key,now));
assert.throws(()=>liveMapURL({...point,latitude:91},key,now));
console.log('PASS Vercel live and A/B URLs request 2400px, app authentication and location guards without temporary access links');
