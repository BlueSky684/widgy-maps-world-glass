// Offline codec measurements + real local Cloud Run HTTP adapter. Synthetic
// locations and an injected city lookup: no provider calls or cloud writes.
// node tools/test-map-tiff-lossless.mjs /absolute/fixture-directory
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import http from 'node:http';
import sharp from 'sharp';
import {renderHomeMap} from '../lib/home-map-day-night.js';
import {encodeMapLosslessTIFF} from '../lib/map-tiff-lossless.js';
import {createMapServer} from '../services/map-server/server.mjs';

const directory = process.argv[2];
assert(directory, 'Supply the existing synthetic fixture directory');
const sha = b => createHash('sha256').update(b).digest('hex');
const fixtures = JSON.parse(readFileSync(resolve(directory, 'fixtures.json')));
const rows = [];
for (const fixture of fixtures) {
  const png = readFileSync(resolve(directory, fixture.name + '.png'));
  assert.equal(sha(png), fixture.sha256);
  const fresh = await renderHomeMap({date:new Date(fixture.instant), location:fixture.location,
    width:3306, presentation:'glass', atlas:'r6'});
  assert(fresh.equals(png), 'Existing PNG changed');
  const start = performance.now(), tiff = await encodeMapLosslessTIFF(png), encodeMs = performance.now()-start;
  assert(tiff.subarray(0,4).equals(Buffer.from([0x49,0x49,0x2a,0])), 'Expected classic little-endian TIFF');
  const meta = await sharp(tiff).metadata(), originalMeta = await sharp(png).metadata();
  assert.equal(meta.width,3306); assert.equal(meta.height,1558);
  assert.equal(meta.channels,4); assert.equal(meta.hasAlpha,true);
  assert.equal(meta.depth,'uchar'); assert.equal(meta.pages,1);
  assert.deepEqual(meta.icc,originalMeta.icc);
  const target=await sharp(png).raw().toBuffer(), decoded=await sharp(tiff).raw().toBuffer();
  assert(decoded.equals(target),'TIFF must preserve every RGBA byte, including invisible RGB');
  writeFileSync(resolve(directory, fixture.name+'.tiff'),tiff);
  rows.push({fixture:fixture.name,pngBytes:png.length,tiffBytes:tiff.length,
    encodeMs:Math.round(encodeMs),rgbaByteIdentical:true,iccIdentical:true,pngBytesUnchanged:true,
    tiffSHA256:sha(tiff)});
}

// Include colors hidden under full transparency and partially transparent edges.
const edgePixels=Buffer.from([93,51,212,0, 13,71,219,1, 22,103,53,128, 241,38,86,255]);
const edgePNG=await sharp(edgePixels,{raw:{width:4,height:1,channels:4}}).png().toBuffer();
assert((await sharp(await encodeMapLosslessTIFF(edgePNG)).raw().toBuffer()).equals(edgePixels));

const logs=[], savedInfo=console.info, savedToken=process.env.WIDGY_LOCATION_ACCESS_TOKEN;
const token='synthetic-native-tiff-test-token-not-a-secret';
process.env.WIDGY_LOCATION_ACCESS_TOKEN=token;
console.info=value=>logs.push(JSON.parse(value));
const server=createMapServer({env:()=>({WIDGY_LOCATION_ACCESS_TOKEN:token}),
  lookup:async point=>({entry:{...point,city:'Synthetic City'},state:'MEMORY'}),
  logger:line=>logs.push(JSON.parse(line))});
let requests=0;
try {
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  async function request(changes={}, method='GET', headers={}) {
    requests++;
    const query=new URLSearchParams({mode:'live',width:'3306',atlas:'r6',presentation:'glass',
      reuse:'60',lat:'10',lon:'20',shared_location:'1',location_key:token,...changes});
    return new Promise((done,reject)=>{
      const req=http.request({hostname:'127.0.0.1',port:server.address().port,
        path:'/api/night-map?'+query,method,headers},res=>{
        const chunks=[]; res.on('data',b=>chunks.push(b));res.on('error',reject);
        res.on('end',()=>done({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));
      });req.on('error',reject);req.end();
    });
  }
  const fixed={at:'2026-10-14T12:00:00Z'};
  const png=await request(fixed), tif=await request({...fixed,format:'tiff-lossless-v1'});
  assert.equal(png.status,200);assert.equal(tif.status,200);
  assert.equal(png.headers['content-type'],'image/png');assert.equal(tif.headers['content-type'],'image/tiff');
  assert.equal(tif.headers['x-map-format'],'tiff-lossless-v1');
  assert.equal(Number(tif.headers['content-length']),tif.body.length);
  assert(tif.body.equals(await encodeMapLosslessTIFF(png.body)));
  const changedTime=await request({at:'2026-10-14T00:00:00Z',format:'tiff-lossless-v1'});
  const changedPoint=await request({...fixed,lat:'-20',lon:'130',format:'tiff-lossless-v1'});
  assert(!changedTime.body.equals(tif.body));assert(!changedPoint.body.equals(tif.body));
  const p=await request(), j=await request({format:'tiff-lossless-v1'});
  assert.equal(p.headers['x-map-cache'],'MISS');assert.equal(j.headers['x-map-cache'],'MISS');
  assert.notEqual(p.headers.etag,j.headers.etag);
  const hit=await request({format:'tiff-lossless-v1'});
  assert.equal(hit.headers['x-map-cache'],'HIT');assert(hit.body.equals(j.body));
  assert.match(hit.headers['cache-control'],/^private, max-age=\d+, must-revalidate$/);
  assert.equal(hit.headers['cdn-cache-control'],'no-store');
  assert.equal(hit.headers['vercel-cdn-cache-control'],'no-store');
  const conditional=await request({format:'tiff-lossless-v1'},'GET',{'If-None-Match':j.headers.etag});
  assert.equal(conditional.status,304);assert.equal(conditional.body.length,0);
  const crossFormat=await request({format:'tiff-lossless-v1'},'GET',{'If-None-Match':p.headers.etag});
  assert.equal(crossFormat.status,200);assert(crossFormat.body.equals(j.body));
  const head=await request({format:'tiff-lossless-v1'},'HEAD');
  assert.equal(head.status,200);assert.equal(head.body.length,0);
  assert.equal(head.headers['content-type'],'image/tiff');
  const restored=await request();assert(restored.body.equals(p.body));
  assert.equal((await request({format:'tiff-lossless-v1',location_key:'invalid'})).status,403);
  const overlay=await request({...fixed,format:'tiff-lossless-v1',layer:'location',width:'1102'});
  const overlayPNG=await request({...fixed,layer:'location',width:'1102'});
  assert.equal(overlay.status,200);
  assert((await sharp(overlay.body).raw().toBuffer()).equals(await sharp(overlayPNG.body).raw().toBuffer()));
  assert.equal((await request({format:'tiff-lossless-v1'},'POST')).status,405);
  // The previous opt-in format still has its own MIME and lossless pixels.
  const webp=await request({...fixed,format:'webp-exact-v1'});
  assert.equal(webp.headers['content-type'],'image/webp');
  assert((await sharp(webp.body).raw().toBuffer()).equals(await sharp(png.body).raw().toBuffer()));
  for(const privateText of [token,'Synthetic City','location_key=']) assert(!JSON.stringify(logs).includes(privateText));
} finally {
  await new Promise(done=>server.close(done));console.info=savedInfo;
  if(savedToken===undefined)delete process.env.WIDGY_LOCATION_ACCESS_TOKEN;else process.env.WIDGY_LOCATION_ACCESS_TOKEN=savedToken;
}
const report={date:'2026-10-15',format:'tiff-lossless-v1',compression:'lzw',width:3306,height:1558,lossless:true,
  images:rows,httpRequests:requests,privateCachingAuthorizationAndRollback:true,
  existingPNGAndWebPPreserved:true,liveTimeAndLocationPreserved:true,
  timingScope:'local Linux encoder only',hostedVerified:false,nativeWidgyVerified:false};
writeFileSync(new URL('./performance/map-tiff-lossless-verification-20261015.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
