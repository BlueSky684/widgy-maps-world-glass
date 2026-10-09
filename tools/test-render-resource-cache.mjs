import test from 'node:test';import assert from 'node:assert/strict';
import {createRenderResourceCache} from '../lib/render-resource-cache.js';
test('reuses deterministic inputs and keeps distinct text/style keys separate',async()=>{
 const cache=createRenderResourceCache();let calls=0;const make=()=>{calls++;return {data:Buffer.from('abc'),info:{width:1}};};
 const a=await cache('city:a',make);assert.strictEqual(await cache('city:a',make),a);
 assert.notStrictEqual(await cache('city:b',make),a);assert.equal(calls,2);
});
test('coalesces identical in-flight work',async()=>{
 const cache=createRenderResourceCache();let calls=0,release;const build=()=>{calls++;return new Promise(r=>release=r);};
 const first=cache('same',build),second=cache('same',build);release(Buffer.from('x'));
 assert.strictEqual(await first,await second);assert.equal(calls,1);
});
test('evicts LRU by entry and byte limits; oversized resources are not retained',async()=>{
 const cache=createRenderResourceCache({maxEntries:2,maxBytes:5});const counts={};
 const get=(k,n=2)=>cache(k,()=>{counts[k]=(counts[k]||0)+1;return Buffer.alloc(n);});
 await get('a');await get('b');await get('a');await get('c');await get('b');assert.equal(counts.a,1);assert.equal(counts.b,2);
 await get('large',6);await get('large',6);assert.equal(counts.large,2);
});
test('failed builders can retry, including synchronous exceptions',async()=>{
 const cache=createRenderResourceCache();await assert.rejects(cache('x',()=>{throw Error('bad');}));
 await assert.rejects(cache('x',()=>Promise.reject(Error('bad'))));
 assert.equal((await cache('x',()=>Buffer.from('ok'))).toString(),'ok');
});
test('pending-key retention is bounded',async()=>{
 const cache=createRenderResourceCache({maxPending:1}),release=[];let calls=0;
 const build=()=>{calls++;return new Promise(r=>release.push(r));};
 const tasks=[cache('a',build),cache('a',build),cache('b',build),cache('b',build)];
 assert.equal(calls,3);release.forEach(r=>r(Buffer.alloc(1)));await Promise.all(tasks);
});
