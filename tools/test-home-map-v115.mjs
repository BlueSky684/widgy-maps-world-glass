import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {daylightMix,solarElevation,solarPosition,renderHomeMap} from '../lib/home-map-v115.js';
import {renderHomeMap as renderV114} from '../lib/home-map-v114.js';
import {renderHomeMap as renderV113} from '../lib/home-map-v113.js';
import handler from '../api/home-map.js';

// A symmetric transition must not displace the solar horizon.
assert.equal(daylightMix(0),.5);
for(const a of [-90,-7,-6,-3,-.1,0,.1,3,6,7,90]) {
 assert(Math.abs(daylightMix(a)+daylightMix(-a)-1)<1e-12);
 if(a<0) assert(daylightMix(a)<.5);
 if(a>0) assert(daylightMix(a)>.5);
}
// Independent cardinal geometry: zenith, antipode and equinox meridians.
assert(Math.abs(solarElevation(0,0,{latitude:0,longitude:0})-90)<1e-9);
assert(Math.abs(solarElevation(0,180,{latitude:0,longitude:0})+90)<1e-9);
for(const latitude of [-85,-60,0,60,85]) for(const longitude of [-90,90])
 assert(Math.abs(solarElevation(latitude,longitude,{latitude:0,longitude:0}))<1e-9);
const summer=solarPosition(new Date('2026-06-21T12:00:00Z'));
assert(solarElevation(90,0,summer)>23);
assert(solarElevation(-90,0,summer)<-23);
const morning=solarPosition(new Date('2026-09-22T06:00:00Z'));
const evening=solarPosition(new Date('2026-09-22T18:00:00Z'));
assert(solarElevation(32,35,morning)>0);
assert(solarElevation(32,35,evening)<0);
assert.deepEqual(solarPosition(new Date('2026-09-22T12:00:00+03:00')),
 solarPosition(new Date('2026-09-22T09:00:00Z')));

// Versioned URLs retain their own renderer. Client timestamps cannot set the sun.
const RealDate=globalThis.Date,fixed=new RealDate('2026-09-22T09:00:00Z');
globalThis.Date=class extends RealDate {constructor(...a){super(...(a.length?a:[fixed.getTime()]));}static now(){return fixed.getTime();}};
try {
 const expected={115:await renderHomeMap({date:fixed}),114:await renderV114({date:fixed}),113:await renderV113({date:fixed})};
 assert.notDeepEqual(expected[115],expected[114]);
 for(const [query,revision] of [['v=115&t=0',115],['v=114',114],['v=113',113],['',114]]) {
  const headers={};let status,sent;
  const res={setHeader:(k,v)=>headers[k]=v,status:n=>{status=n;return res;},send:b=>sent=b,json:o=>sent=o,end(){}};
  await handler({method:'GET',url:'/?'+query,headers:{}},res);
  assert.equal(status,200);assert.equal(headers['X-Map-Revision'],String(revision));
  assert.equal(headers['X-Map-Rendered-At'],fixed.toISOString());
  assert.deepEqual(sent,expected[revision]);
 }
 writeFileSync('work/map/v115-verified-map.png',await renderHomeMap({date:fixed,location:{latitude:32.1,longitude:34.8,city:'Tel Aviv'}}));
} finally {globalThis.Date=RealDate;}
console.log('PASS v115: horizon alignment, hemisphere geometry, UTC handling, day/night movement, server-time enforcement and v113/v114 compatibility');
