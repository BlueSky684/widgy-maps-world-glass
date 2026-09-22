import assert from 'node:assert/strict';
import sharp from 'sharp';
import {writeFileSync} from 'node:fs';
import {solarPosition,project,resolveLocation,renderHomeMap,WIDTH,HEIGHT} from '../lib/home-map.js';
import handler from '../api/home-map.js';

// Astronomical and geometric boundary cases, including both hemispheres.
assert(Math.abs(solarPosition(new Date('2026-06-21T12:00:00Z')).latitude-23.44)<.1);
assert(Math.abs(solarPosition(new Date('2026-12-21T12:00:00Z')).latitude+23.44)<.1);
assert(Math.abs(solarPosition(new Date('2026-09-23T12:00:00Z')).latitude)<.5);
assert.deepEqual(project(85,-180),{x:0,y:0});
assert.deepEqual(project(-65,180),{x:WIDTH,y:HEIGHT});
assert.equal(project(86,0),null);
assert.equal(resolveLocation(new URL('https://example.test/'),{}),null);
assert.equal(resolveLocation(new URL('https://example.test/?lat=&lon='),{}),null);
assert.equal(resolveLocation(new URL('https://example.test/?lat=31'),{}),null);
assert.equal(resolveLocation(new URL('https://example.test/?lat=91&lon=34'),{}),null);
assert.equal(resolveLocation(new URL('https://example.test/?lat=0&lon=0'),{}).latitude,0);
const loc=resolveLocation(new URL('https://example.test/'),{'x-vercel-ip-latitude':'31.8','x-vercel-ip-longitude':'34.65','x-vercel-ip-city':'Ashdod'});
assert.equal(loc.source,'ip-approximate');
const day=await renderHomeMap({date:new Date('2026-09-22T05:44:00Z'),location:loc});
const night=await renderHomeMap({date:new Date('2026-09-22T19:00:00Z'),location:loc});
assert.notDeepEqual(day,night);
const {data,info}=await sharp(day).raw().toBuffer({resolveWithObject:true});
assert.deepEqual([info.width,info.height,info.channels],[WIDTH,HEIGHT,4]);
assert.equal(data[3],0); // Transparent rounded corner.
const p=project(loc.latitude,loc.longitude),i=(Math.round(p.y)*WIDTH+Math.round(p.x))*4;
assert(data[i]>230&&data[i+1]>230&&data[i+2]>230); // White marker core at real coordinates.
writeFileSync('work/map/morning.png',day);
writeFileSync('work/map/evening.png',night);
// Escaping, antimeridian, southern latitudes, missing location and unsupported pole.
for(const location of [null,{latitude:-33.87,longitude:151.21,city:'Sydney'},
 {latitude:31.8,longitude:34.65,city:'<b>A & B</b>'},{latitude:90,longitude:0,city:'North Pole'}]) {
 const bytes=await renderHomeMap({date:new Date('2026-06-21T12:00:00Z'),location});
 assert(bytes.length>100000);
}
const headers={};let status=0,sent;
const res={setHeader:(k,v)=>headers[k]=v,status:n=>{status=n;return res;},send:b=>sent=b,json:o=>sent=o,end:()=>{}};
await handler({method:'GET',url:'/?lat=31.8&lon=34.65&city=Ashdod',headers:{}},res);
assert.equal(status,200);assert.equal(headers['X-Map-Location-Source'],'coordinates');
assert(headers['Cache-Control'].includes('no-store'));assert(Buffer.isBuffer(sent));
console.log('PASS: solar seasons, projection, location validation, PNG geometry, marker position, day/night changes, labels and API');
