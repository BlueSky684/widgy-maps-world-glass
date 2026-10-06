import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import handler from '../api/solar-mask.js';
import {renderMaskPair} from '../lib/map-mask-live.js';

const epoch=Date.parse('2026-10-06T09:35:00Z');
const url=(part,t=epoch,revision='alpha-1')=>'/api/solar-mask?rev='+revision+'&part='+part+'&t='+t;
async function request(path,method='GET',headers={}){
  const res={headers:{},code:null,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.code=c;return this;},
    send(body){this.body=body;return this;},json(body){this.body=body;return this;},end(){return this;}};
  await handler({url:path,method,headers},res);return res;
}
const [d,n]=await Promise.all([request(url('day')),request(url('night'))]);
assert.equal(d.headers['x-mask-cache'],'MISS');assert.equal(n.headers['x-mask-cache'],'HIT');
const original=await renderMaskPair(epoch),raw={};
for(const [part,r] of [['day',d],['night',n]]){
  assert.equal(r.code,200);assert.equal(r.headers['content-type'],'image/png');
  assert.equal(r.headers['x-mask-time'],new Date(epoch).toISOString());
  assert.equal(r.headers['x-mask-revision'],'alpha-1');
  assert.match(r.headers['cache-control'],/^public, max-age=86400, immutable$/);
  assert.equal(r.headers['cdn-cache-control'],r.headers['cache-control']);
  assert.equal(r.headers['vercel-cdn-cache-control'],r.headers['cache-control']);
  assert.equal(r.headers.etag,'"'+createHash('sha256').update(r.body).digest('hex')+'"');
  const meta=await sharp(r.body).metadata();
  assert.deepEqual([meta.width,meta.height,meta.channels,meta.hasAlpha],[522,246,4,true]);assert(meta.icc.length>0);
  const expected=await sharp(original[part]).raw().toBuffer();raw[part]=await sharp(r.body).raw().toBuffer();
  for(let p=0;p<522*246;p++){
    for(let c=0;c<3;c++)assert.equal(raw[part][p*4+c],0,'No RGB white plane');
    assert.equal(raw[part][p*4+3],255-expected[p*3],'Exact inverse weight, including stamp');
  }
}
const next=await request(url('night',epoch+300000));assert.equal(next.code,200);assert.notEqual(next.headers.etag,n.headers.etag);
const nextRaw=await sharp(next.body).raw().toBuffer(),band=522*(246-18)*4;
assert(!nextRaw.subarray(0,band).equals(raw.night.subarray(0,band)),'Solar alpha must advance');
assert(!nextRaw.subarray(band).equals(raw.night.subarray(band)),'Bitmap time must advance');
const repeat=await request(url('night'),'GET',{'x-vercel-ip-latitude':'0'});assert(repeat.body.equals(n.body));
assert.equal((await request(url('night'),'GET',{'if-none-match':'W/'+n.headers.etag})).code,304);
assert.equal((await request(url('day'),'HEAD')).body,null);assert.equal((await request(url('day'),'POST')).code,405);
for(const path of [url('day',epoch+1),url('wrong'),url('day')+'&extra=1',url('day')+'&rev=alpha-1',
  url('day',0),url('day',epoch,'unknown'),url('day',epoch,'__proto__')]){
  const bad=await request(path);assert.equal(bad.code,400);assert.equal(bad.headers['cache-control'],'no-store');
}
// The original revision still returns its original bytes, with a separate cache.
const oldDay=await request(url('day',epoch,'live-1'));
assert(oldDay.body.equals(original.day));assert.equal(oldDay.headers['x-mask-cache'],'MISS');
assert.equal(oldDay.headers['x-mask-revision'],'live-1');assert.notEqual(oldDay.headers.etag,d.headers.etag);
const wrongRevisionTag=await request(url('day'),'GET',{'if-none-match':oldDay.headers.etag});assert.equal(wrongRevisionTag.code,200);
console.log(JSON.stringify({result:'PASS',bytes:{day:d.body.length,night:n.body.length,total:d.body.length+n.body.length},
  checks:'Real route; inverse alpha and black RGB; stamp and solar advancement; revision isolation; original PNG bytes; immutable headers/ETag/304/HEAD/invalid queries'}));
