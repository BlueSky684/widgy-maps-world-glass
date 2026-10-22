// Local synthetic rendering/protocol investigation. No network/provider calls.
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createNightMapHandler} from '../api/night-map.js';
const key='local-synthetic-audit-key-'.repeat(3);
process.env.WIDGY_MAP_FILE_ACCESS_TOKEN=key;
process.env.WIDGY_MAP_FILE_CITY_BACKEND='vercel-bdc';
const token='11111111-2222-4333-8444-555555555555';
const handler=createNightMapHandler({resolveFileCity:async()=>{throw Error('No provider call expected')}});
const oldInfo=console.info; console.info=()=>{};
async function route(at,headers={}){
  const query=new URLSearchParams({delivery:'vercel-file-v1',location_key:key,lat:'51.5',lon:'-0.1',width:'2400',
    shared_location:'0',city:'SYNTHETIC TEST',at,presentation:'glass',atlas:'r6',native_file:'1',transfer_id:token});
  const res={headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},status(n){this.statusCode=n;return this},
    json(v){this.body=v;return this},send(v){this.body=v;return this},end(){return this}};
  const started=performance.now(); await handler({url:'/api/night-map?'+query,method:'GET',headers},res);
  return {...res,elapsedMs:performance.now()-started};
}
try {
  const initial=await route('2026-10-22T08:50:00Z'); assert.equal(initial.statusCode,200);
  const ranged=await route('2026-10-22T08:50:00Z',{'range':'bytes=100-','if-range':initial.headers.etag});
  assert.equal(ranged.statusCode,200); assert(initial.body.equals(ranged.body));
  const later=await route('2026-10-22T08:52:00Z');
  assert.equal(initial.headers.etag,later.headers.etag); assert(!initial.body.equals(later.body));
  console.log(JSON.stringify({protocol:{rangeStatus:ranged.statusCode,rangeReturnsWholeBody:true,
    acceptRanges:ranged.headers['accept-ranges']??null,tokenOnlyETagReusedForDifferentBytes:true,
    bytes:initial.body.length,localInitialRenderMs:Math.round(initial.elapsedMs)}}));
  const original=await sharp(initial.body).raw().toBuffer(), meta=await sharp(initial.body).metadata();
  const rows=[];
  for(const [level,adaptive] of [[6,false],[6,true],[9,false],[9,true]]){
    const started=performance.now();
    const result=await sharp(initial.body).keepMetadata().png({compressionLevel:level,adaptiveFiltering:adaptive,palette:false}).toBuffer();
    const ms=performance.now()-started, decoded=await sharp(result).raw().toBuffer(), metadata=await sharp(result).metadata();
    assert(decoded.equals(original)); assert.equal(metadata.width,2400); assert.equal(metadata.height,1131);
    assert(Buffer.from(metadata.icc??[]).equals(Buffer.from(meta.icc??[])));
    rows.push({compressionLevel:level,adaptiveFiltering:adaptive,bytes:result.length,
      encodeMs:Math.round(ms),savingPercent:+(100*(1-result.length/initial.body.length)).toFixed(1),
      pixelsAndProfileEqual:true});
  }
  console.log(JSON.stringify({compression:rows},null,2));
}finally{console.info=oldInfo}
