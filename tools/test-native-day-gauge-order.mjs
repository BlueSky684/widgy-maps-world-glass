import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {fixNativeDayGaugeOrder} from './native-day-gauge-order.js';

const gauge = {z:'18',d0:82317,s:'Day Progress · Native Linear Gauge',
  f:'hexcol_0C70EACC00004000A000000000000002-100'};
const chrome = {z:'5',d0:80309,s:'Approved Glass · Chrome and Frames'};
const fixture = {'1':[{s:'HOME',d0:245,'1':[{s:'Label'},chrome,gauge,{s:'Map'}]}],
  '36':[{name:'synthetic_variable'}]};
const before = structuredClone(fixture);
const fixed = fixNativeDayGaugeOrder(fixture);
assert.deepEqual(fixture,before);
assert.deepEqual(fixed['1'][0]['1'],[before['1'][0]['1'][0],gauge,chrome,before['1'][0]['1'][3]]);
assert.deepEqual(fixed['36'],before['36']);
assert.throws(()=>fixNativeDayGaugeOrder(fixed),/unexpected_day_gauge_order/);

// The real approved chrome is fully opaque over the native gauge's frame.
const {data,info} = await sharp(new URL('../assets/home-glass/Home_Glass_Chrome_C8.png',import.meta.url).pathname)
  .extract({left:249,top:829,width:822,height:117}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.channels,4);
for (let i=3;i<data.length;i+=4) assert.equal(data[i],255);

// Optional full private export regression; never print or commit its contents.
if (process.argv[2]) {
  const source = JSON.parse(readFileSync(process.argv[2],'utf8'));
  const result = fixNativeDayGaugeOrder(source);
  const layers = result['1'].find(n=>n.d0===245)['1'];
  const g = layers.findIndex(n=>n.d0===82317), c = layers.findIndex(n=>n.d0===80309);
  assert(g<c);
  [layers[g],layers[c]]=[layers[c],layers[g]];
  assert.deepEqual(result,source,'Only the two adjacent sibling positions may change');
}
console.log('PASS: front-to-back gauge/chrome order; opaque overlap confirmed; original layer data preserved.');
