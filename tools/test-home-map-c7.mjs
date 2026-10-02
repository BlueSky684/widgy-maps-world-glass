// Baseline command (from repo root):
// git show 2adabdba651d857ee572c5afcebed44a01852df4:lib/home-map-day-night.js > lib/.home-map-c6-check.mjs
// node tools/test-home-map-c7.mjs
import assert from 'node:assert/strict';
import {unlinkSync} from 'node:fs';
import sharp from 'sharp';
import * as fast from '../lib/home-map-day-night.js';
const baselineFile=new URL('../lib/.home-map-c6-check.mjs',import.meta.url);
try{
 const old=await import(baselineFile.href);
 assert.equal(sharp.versions.sharp,'0.34.5');
 const base={date:new Date('2026-10-02T12:00:00Z'),location:null,presentation:'glass',atlas:'r6',width:3306};
 await old.renderHomeMap(base);await fast.renderHomeMap(base);
 const results=[];
 for(const input of [base,{...base,location:{latitude:0,longitude:0,city:'Test City',source:'coordinates'}},{...base,width:1653,diagnostic:true},{...base,atlas:'f50',presentation:'default',width:1102}]){
  let start=performance.now();const before=await old.renderHomeMap(input),beforeMs=performance.now()-start;
  start=performance.now();const after=await fast.renderHomeMap(input),afterMs=performance.now()-start;
  assert.deepEqual(await sharp(after).raw().toBuffer(),await sharp(before).raw().toBuffer());
  assert.deepEqual(after,before,'Final lossless PNG must be byte-identical');
  results.push({width:input.width,location:!!input.location,diagnostic:!!input.diagnostic,beforeMs:Math.round(beforeMs),afterMs:Math.round(afterMs),identicalPNG:true});
 }
 console.log(JSON.stringify({passed:true,sharp:sharp.versions.sharp,results,deviceTimingNotMeasured:true}));
}finally{unlinkSync(baselineFile);}
