import assert from 'node:assert/strict';
import {createBudget,LEDGER_KEY} from '../lib/location/budget.js';
import {createSharedLocation} from '../lib/location/shared.js';
const env=()=>({UPSTASH_REDIS_REST_URL:'https://test.upstash.io',UPSTASH_REDIS_REST_TOKEN:'test-token'});
let requests=0;
const reserve=createBudget({env,fetcher:async(url,o)=>{
  requests++;assert.equal(o.redirect,'error');assert.equal(o.headers.Authorization,'Bearer test-token');
  const command=JSON.parse(o.body);assert.equal(command[0],'EVAL');assert.equal(command[3],LEDGER_KEY);
  return {ok:true,json:async()=>({result:[1,2]})};
}});
assert.deepEqual(await reserve(),{used:2,limit:40000});assert.equal(requests,1);
for(const result of [[0,40000],[2,5],[-1,0],[1,40001],[1,-1],null]){
  const deny=createBudget({env,fetcher:async()=>({ok:true,json:async()=>({result})})});
  await assert.rejects(deny(),/budget_/);
}
await assert.rejects(createBudget({env:()=>({})})(),/budget_unavailable/);
await assert.rejects(createBudget({env,fetcher:async()=>{throw Error('offline');}})(),/budget_unavailable/);
let providerCalls=0;
const options={env:()=>({BIGDATACLOUD_API_KEY:'fixture',WIDGY_LOCATION_ACCESS_TOKEN:'x'.repeat(43)}),cache:()=>({get:async()=>null}),fetcher:async()=>{providerCalls++;throw Error('should not be called');},reserve:async()=>{throw Error('budget_exhausted');}};
await assert.rejects(createSharedLocation(options)({latitude:1,longitude:2}),/location_unavailable/);
assert.equal(providerCalls,0);
const entry={latitude:1,longitude:2,city:'Fixture',countryName:'Fixture',observedAt:Date.now()};
const hit=createSharedLocation({...options,cache:()=>({get:async()=>entry})});
assert.equal((await hit({latitude:1,longitude:2})).state,'SHARED');assert.equal(providerCalls,0);
console.log('PASS: reservation transport, fail-closed errors, denied lookup sends no provider request, cached city bypasses budget');
