import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {renderHomeMap} from '../lib/home-map-day-night.js';
const fixtures=JSON.parse(readFileSync(new URL('./performance/map-direct-pipeline-fixtures.json',import.meta.url)));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const c of fixtures.cases){
 const bytes=await renderHomeMap({...c,date:new Date(c.date)}),png=PNG.sync.read(bytes);
 assert.equal(png.width,c.expected.width,c.id);assert.equal(png.height,c.expected.height,c.id);
 assert.equal(hash(png.data),c.expected.rgbaSHA256,c.id+' exact decoded RGBA including edges');
 assert.equal(hash(bytes),c.expected.pngSHA256,c.id+' exact PNG including embedded color profile');
 assert.equal(bytes.length,c.expected.bytes,c.id);
}
console.log(JSON.stringify({pass:true,cases:fixtures.cases.length,allPixelsAndPNGBytesExact:true,baselineCommit:fixtures.baselineCommit,nativeLatencyMeasured:false}));
