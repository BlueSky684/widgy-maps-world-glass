import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>JSON.parse(readFileSync(new URL(n,import.meta.url)));
const r3=read('./Widgy_Home_Glass_JS_City_R3.json'),r4=read('./Widgy_Home_Glass_JS_City_R4.json'),r5=read('./Widgy_Home_Glass_JS_City_R5.json');
const all=w=>w['1'].flatMap(function walk(n){return [n,...(n.z==='13'?n['1'].flatMap(walk):[])];});
const originals=new Map(all(r3).map(n=>[n.d0,n]));
const old4=new Map(all(r4).map(n=>[n.d0,n]));
const nodes=all(r5),get=id=>nodes.find(n=>n.d0===id);
assert.equal(new Set(nodes.map(n=>n.d0)).size,nodes.length);
assert(r5.a2>Math.max(...nodes.map(n=>n.d0)));
assert.deepEqual(r5['36'],r3['36']);
assert.deepEqual(get(6122),originals.get(6122),'Restore the complete one-line label verified on phone');
for(const n of nodes){
 if(n.z==='1'&&originals.has(n.d0))assert.equal(n['1'],originals.get(n.d0)['1'],'No unverified font on '+n.s);
 if(old4.has(n.d0))for(const k of ['66','o1','p','q'])assert.deepEqual(n[k],old4.get(n.d0)[k]);
 if(n.s?.startsWith('Steps Goal Ring')||n.s?.startsWith('WX ·')||n.d0===6170||n.d0===80309)assert.deepEqual(n,old4.get(n.d0));
}
assert(!JSON.stringify(r5).includes('BarlowCondensed-Regular'));
const day=get(6105),weights=nodes.filter(n=>n.s==='Header Day · Weight');
assert.equal(weights.length,2);assert.equal(day['1'],'Phenomena-Bold');
assert.equal(day['2'].a[0].a,1);
for(const id of [6103,6104])assert.equal(get(id)['2'].a[0].a,1);
assert.deepEqual(get(6103).b,get(6104).b);
assert.equal(get(6103).d.a[0].a,get(6104).d.a[0].a);
assert(get(6131).e.a[0].a<originals.get(6131).e.a[0].a);
const tempRight=(get(6131).b.a[0].a+get(6131).d.a[0].a)*1135/1600;
assert(tempRight<343,'Temperature frame clears the x=358 divider; actual glyph is inset further');
for(const n of [day,...weights]){
 assert.deepEqual(n['66'],[{'5':'Date And Time','6':'d'}]);
 assert.equal(n['1'],day['1']);assert.deepEqual(n.c,originals.get(6105).c);assert.deepEqual(n.e,originals.get(6105).e);
 assert.equal(n['2'].a[0].a,1);
}
const offsets=weights.map(n=>(n.b.a[0].a-day.b.a[0].a)*1135/1600);
assert(Math.abs(offsets[0]+.75)<1e-6&&Math.abs(offsets[1]-.75)<1e-6);
console.log('PASS R5: no new fonts, exact R3 one-line label, centered original native date, synchronized weight copies; R4 live ring/map/weather/variables/actions unchanged.');
