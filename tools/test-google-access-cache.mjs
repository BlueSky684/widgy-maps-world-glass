import test from 'node:test';
import assert from 'node:assert/strict';
import {createGoogleAccessCache} from '../lib/calendar-bridge/google-access-cache.js';
import {readEvents} from '../lib/calendar-bridge/providers.js';
import {monthWindow} from '../lib/calendar-bridge/dots.js';

test('25 month reads share authentication, keep independent event requests and identical results', async () => {
  const original = globalThis.fetch;
  let oauth = 0, events = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    if (url.hostname === 'oauth2.googleapis.com') {
      oauth++;
      return Response.json({access_token:'synthetic-access', expires_in:3600});
    }
    assert.equal(url.hostname, 'www.googleapis.com');
    assert.equal(init.headers.Authorization, 'Bearer synthetic-access');
    events++;
    return Response.json({items:[]});
  };
  try {
    const state = {google:{refresh:'synthetic-month-test'},sources:[{provider:'google',id:'synthetic@example.test',color:1}]};
    const months = Array.from({length:25}, (_,i) => monthWindow({offset:i-12,now:new Date('2026-10-08T12:00:00Z')}));
    const results = await Promise.all(months.map(window => readEvents(state,window)));
    assert.equal(oauth,1); assert.equal(events,25);
    assert.deepEqual(results, months.map(() => []));
    await readEvents(state,months[12]);
    assert.equal(oauth,1); assert.equal(events,26, 'Event reads are not suppressed');
  } finally { globalThis.fetch = original; }
});

test('expiry, clock rollback, account and app configuration isolation', async () => {
  let clock = 100000, calls = 0, app = 'a';
  const access = createGoogleAccessCache({now:()=>clock,scope:()=>app,
    request:async () => ({access_token:`token-${++calls}`,expires_in:3600})});
  const user = {refresh:'synthetic-a'};
  assert.equal(await access(user),'token-1');
  clock += 59999; assert.equal(await access(user),'token-1');
  clock++; assert.equal(await access(user),'token-2');
  assert.equal(await access({refresh:'synthetic-b'}),'token-3');
  app='b'; assert.equal(await access(user),'token-4');
  clock--; assert.equal(await access(user),'token-5');
});

test('short/unknown expiry and exchange failures cannot create reusable stale credentials', async () => {
  for (const expires_in of [undefined,0,10,30,'bad']) {
    let calls=0;
    const access=createGoogleAccessCache({request:async()=>({access_token:`t-${++calls}`,expires_in})});
    await access({refresh:'x'}); await access({refresh:'x'}); assert.equal(calls,2);
  }
  let clock=100000,calls=0;
  const short=createGoogleAccessCache({now:()=>clock,request:async()=>({access_token:`t-${++calls}`,expires_in:31})});
  await short({refresh:'x'});clock+=999;await short({refresh:'x'});assert.equal(calls,1);
  clock++;await short({refresh:'x'});assert.equal(calls,2);
  let failed=true;
  const retry=createGoogleAccessCache({request:async()=>{if(failed)throw Error('synthetic failure');return {access_token:'ok',expires_in:3600}}});
  await assert.rejects(retry({refresh:'x'}));failed=false;assert.equal(await retry({refresh:'x'}),'ok');
  await assert.rejects(retry({refresh:''}));
});

test('bounded entries and eviction races do not remove a newer in-flight request', async () => {
  const waiting=[];
  const access=createGoogleAccessCache({maxEntries:1,request:()=>new Promise((resolve,reject)=>waiting.push({resolve,reject}))});
  const first=access({refresh:'a'}); const failure=assert.rejects(first);
  const second=access({refresh:'b'});const third=access({refresh:'a'});
  await Promise.resolve();waiting[0].reject(Error('old'));await failure;
  const shared=access({refresh:'a'});await Promise.resolve();assert.equal(waiting.length,3);
  waiting[1].resolve({access_token:'b',expires_in:3600});waiting[2].resolve({access_token:'a',expires_in:3600});
  assert.deepEqual(await Promise.all([second,third,shared]),['b','a','a']);
});
