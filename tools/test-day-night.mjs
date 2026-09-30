import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {PNG} from 'pngjs';
import {WIDTH, HEIGHT, project, pixelCoordinates, solarPosition, solarElevation,
  weightsAt, composePixel, renderPixels, getTextures, renderHomeMap} from '../lib/home-map-day-night.js';
import handler from '../api/night-map.js';

mkdirSync('work/day-night', {recursive: true});
const sha = b => createHash('sha256').update(b).digest('hex');
const sourceHashes = ['Terrain_Master_3306x1558.png', 'Night_Lights_Master_3306x1558.png']
  .map(n => sha(readFileSync('assets/earth/'+n)));
assert.deepEqual(sourceHashes, ['82d5ef93612689b4e5d48d06503292832fa743bad528d0b14b31630a03350907',
  '51df5942dd84f0dc52d5d6975472b2397d53de0cad99cd7085bcb8ebc44db4aa']);
const textures = getTextures(), rawHashes = [sha(textures.terrain), sha(textures.lights)];

// Independent geographic controls: source contract, recognizable land points,
// seam continuity, poles, local noon and the solar antipode.
assert.deepEqual(project(85, -180), {x:0, y:0});
assert.deepEqual(project(-61, 180), {x:WIDTH, y:HEIGHT});
for (const [lat, lon] of [[31.8,34.65],[35.68,139.69],[-33.87,151.21],[-33.93,18.42],[40.71,-74.01]]) {
  const p = project(lat, lon), at = (Math.round(p.y)*WIDTH+Math.round(p.x))*4;
  assert(Math.max(...textures.terrain.subarray(at, at+3))>10, 'coordinate is outside approved artwork land');
}
assert.equal(project(-70,0), null);
assert.equal(weightsAt(0).day, .5);
assert.equal(weightsAt(0).lights, 0);
assert.equal(weightsAt(-6).lights, 1);
for (const e of [0,1,3,4,20]) assert(Math.abs(weightsAt(e).day+weightsAt(-e).day-1)<1e-12);
assert(Math.abs(solarElevation(0,0,{latitude:0,longitude:0})-90)<1e-9);
assert(Math.abs(solarElevation(0,180,{latitude:0,longitude:0})+90)<1e-9);
const dates = ['2013-05-23T09:24:00Z','2026-06-21T12:00:00Z','2026-09-30T06:00:00Z','2026-12-21T12:00:00Z'];
for (const date of dates) {
  const sun = solarPosition(new Date(date));
  for (const lat of [-61,0,85]) assert(Math.abs(solarElevation(lat,-180,sun)-solarElevation(lat,180,sun))<1e-10);
}
assert(solarPosition(new Date(dates[1])).latitude>23);
assert(solarPosition(new Date(dates[3])).latitude < -23);
const refSun = solarPosition(new Date(dates[0]));
assert(refSun.latitude>20 && refSun.latitude<21);
const southTurningLatitude = refSun.latitude-90;
assert(southTurningLatitude < -61, 'reference lower arc is outside the approved crop');
assert(Math.abs(solarElevation(southTurningLatitude,refSun.longitude,refSun))<1e-9);
assert.deepEqual(solarPosition(new Date('2026-09-30T09:00:00+03:00')), solarPosition(new Date(dates[2])));

// Independent source-over expectations, including zero-alpha ocean and light
// visibility. Production pixels are compared to scalar samples in both frames.
assert.deepEqual(composePixel([0,0,0],[255,200,30,0],20), [12,20,29]);
assert.deepEqual(composePixel([0,0,0],[255,200,30,0],-20), [0,0,0]);
assert.deepEqual(composePixel([100,100,100],[255,200,30,255],-20), [255,200,30]);
assert.deepEqual(composePixel([100,100,100],[255,200,30,255],20), [108,108,108]);
const first = renderPixels(new Date(dates[2]));
const later = renderPixels(new Date('2026-09-30T18:00:00Z'));
assert.notEqual(sha(first.data), sha(later.data));
for (const frame of [first,later]) for (const [x,y] of [[600,900],[2000,550],[1450,1400],[100,700],[3200,400]]) {
  const i = (y*WIDTH+x)*4, o = (y*WIDTH+x)*3, geo = pixelCoordinates(x,y);
  const expected = composePixel(textures.terrain.subarray(i,i+4),textures.lights.subarray(i,i+4),
    solarElevation(geo.latitude,geo.longitude,frame.sun));
  assert.deepEqual([...frame.data.subarray(o,o+3)], expected);
}
const started = performance.now();
const png = await renderHomeMap({date:new Date(dates[2]),location:{latitude:31.8,longitude:34.65,city:'Ashdod'}});
const renderMs = performance.now()-started;
assert(png.length < 4_500_000, 'PNG exceeds server response budget');
const decoded = PNG.sync.read(png);
assert.equal(decoded.width,WIDTH);assert.equal(decoded.height,HEIGHT);
assert.equal(decoded.data[3],0);assert.equal(decoded.data[((HEIGHT/2|0)*WIDTH+(WIDTH/2|0))*4+3],255);
writeFileSync('work/day-night/rendered-map.png',png);
assert.deepEqual([sha(textures.terrain),sha(textures.lights)],rawHashes,'source pixels mutated');

const call = async (url, method='GET') => {
  const result = {headers:{}};
  const res = {setHeader:(k,v)=>result.headers[k]=v,status:n=>{result.status=n;return res;},
    send:b=>result.body=b,json:o=>result.body=o,end:()=>{}};
  await handler({url,method,headers:{}},res);return result;
};
assert.equal((await call('/?at=2013-05-23')).status,400);
assert.equal((await call('/', 'POST')).status,405);
const RealDate = globalThis.Date, fixed = new RealDate(dates[2]);
globalThis.Date = class extends RealDate {constructor(...a){super(...(a.length?a:[fixed.getTime()]));}static now(){return fixed.getTime();}};
try {
  const live = await call('/api/night-map?t=0');
  assert.equal(live.status,200);assert.equal(live.headers['X-Map-Rendered-At'],fixed.toISOString());
  assert.equal(live.headers['X-Map-Time-Mode'],'server-now');
  assert(live.headers['Cache-Control'].includes('no-store'));
  assert.equal(live.headers['Vercel-CDN-Cache-Control'],'no-store');
  const historical = await call('/api/night-map?at='+encodeURIComponent(dates[0]),'HEAD');
  assert.equal(historical.status,200);assert.equal(historical.body,undefined);
  assert.equal(historical.headers['X-Map-Time-Mode'],'fixed-test');
  assert.equal(historical.headers['X-Map-Rendered-At'],'2013-05-23T09:24:00.000Z');
} finally {globalThis.Date = RealDate;}

// Only the map URL/script and release name may change in the full widget.
const base=JSON.parse(readFileSync('tools/widgy-v142.json'));
const widget=JSON.parse(readFileSync('tools/widgy-day-night.json'));
function mapLayer(value){if(!value||typeof value!=='object')return null;
  if(value.d0===6170)return value;for(const child of Object.values(value)){const found=mapLayer(child);if(found)return found;}return null;}
const current=mapLayer(widget), original=mapLayer(base);
const context={Date,encodeURIComponent};
const script=current['22'].replaceAll('${widgy.latitude}','31.8').replaceAll('${widgy.Longitude}','34.65').replaceAll('${widgy.City}','Ashdod');
vm.runInNewContext(script+'; result=main();',context);
const url=new URL(context.result);
assert.equal(url.pathname,'/api/night-map');assert.equal(url.searchParams.get('lat'),'31.8');assert(!url.searchParams.has('at'));
current['2']=original['2'];current['22']=original['22'];widget['3']=base['3'];
assert.deepEqual(widget,base,'unrelated native widget settings changed');

const report={passed:true,sourceHashes,sourceDimensions:[WIDTH,HEIGHT],projection:{west:-180,east:180,north:85,south:-61},
  referenceDate:dates[0],referenceSolarPosition:refSun,referenceArcMinimumLatitude:southTurningLatitude,
  sourcePixelsUnchanged:true,alphaOnlyLightMask:true,utcAndCacheChecks:true,widgetOtherLayersUnchanged:true,
  pngBytes:png.length,renderMs:Math.round(renderMs),deviceTested:false};
writeFileSync('work/day-night/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
