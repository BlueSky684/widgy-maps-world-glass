import assert from 'node:assert/strict';
import {createFirestore, encodeValue, decodeValue} from '../services/map-server/firestore.mjs';
import {createFirestoreBudget, BUDGET_DOCUMENT, budgetState} from '../services/map-server/firestore-budget.mjs';
import {migrateBudget, returnBudget, ledgerFromSnapshot, FENCE_LUA, RETURN_LUA, ACKNOWLEDGE_LUA} from '../services/map-server/budget-migration.mjs';

let clock = 20000 * 86400000;
const now = () => clock, target = 'projects/synthetic-project/databases/(default)';
const id = '12345678-1234-1234-1234-123456789012';
const fresh = () => ({schema: 1, state: 'active', days: {}, minute: 0, rate: 0, migrationId: id, target});
function memoryStore(initial) {
  let value = structuredClone(initial), version = 1, conflicts = 0;
  return {
    get: async () => {await new Promise(setImmediate); return value ? {value: structuredClone(value), updateTime: String(version)} : null;},
    put: async (_path, next, options = {}) => {
      await new Promise(setImmediate);
      if ((options.exists === false && value) || (options.updateTime !== undefined && options.updateTime !== String(version))) {
        conflicts++; throw Error('firestore_conflict');
      }
      value = structuredClone(next); version++;
      return {value: structuredClone(value), updateTime: String(version)};
    },
    state: () => ({value: structuredClone(value), version, conflicts})
  };
}

// Two independent instances race at the last remaining unit of allowance.
let store = memoryStore({...fresh(), days: {'20000': 39999}});
const a = createFirestoreBudget({store, now}), b = createFirestoreBudget({store, now});
const race = await Promise.allSettled([a(), b()]);
assert.equal(race.filter(v => v.status === 'fulfilled').length, 1);
assert.equal(store.state().value.days['20000'], 40000);
assert.equal(store.state().conflicts, 1);
assert.equal(race.find(v => v.status === 'rejected').reason.message, 'budget_exhausted');
clock += 31 * 86400000;
await assert.rejects(a(), /budget_exhausted/);
clock += 86400000;
assert.deepEqual(await b(), {used: 1, limit: 40000});
assert.equal(store.state().value.days['20000'], undefined);
for (let i = 1; i < 10; i++) await a();
await assert.rejects(b(), /budget_rate_limited/);
clock += 60000;
assert.equal((await b()).used, 11);
for (const bad of [undefined, {...fresh(), state: 'returned'}, {...fresh(), days: {'9999999': 1}},
  {...fresh(), days: {'20000': -1}}, {...fresh(), rate: 11}]) {
  await assert.rejects(createFirestoreBudget({store: memoryStore(bad), now})(), /budget_unavailable/);
}

// A write might commit before its response is lost: never retry/refund it.
store = memoryStore(fresh());
const ambiguous = {get: store.get, put: async (...args) => {await store.put(...args); throw Error('network_timeout');}};
await assert.rejects(createFirestoreBudget({store: ambiguous, now})(), /budget_unavailable/);
assert.equal(budgetState(store.state().value, now()).used, 1);

// REST wire format, identity, CAS, timestamps, missing/corrupt documents,
// and privacy are exercised through an injected HTTP transport.
const wireCalls = [];
const wireValue = {...fresh(), importedAt: new Date(clock)};
const wire = createFirestore({env: () => ({FIRESTORE_PROJECT_ID: 'synthetic-project'}), now,
  fetcher: async (url, init) => {
    wireCalls.push({url: String(url), init});
    if (String(url).startsWith('http://metadata.')) {
      assert.equal(init.headers['Metadata-Flavor'], 'Google');
      return {ok: true, json: async () => ({access_token: 'synthetic-oauth', expires_in: 3600})};
    }
    assert.equal(init.redirect, 'error'); assert(init.signal);
    assert.equal(init.headers.Authorization, 'Bearer synthetic-oauth');
    return {ok: true, status: 200, json: async () => ({fields: encodeValue(wireValue).mapValue.fields, updateTime: '2026-10-14T18:00:00.123456Z'})};
  }});
const doc = await wire.get(BUDGET_DOCUMENT);
assert.deepEqual(doc.value, wireValue);
await wire.put(BUDGET_DOCUMENT, doc.value, {updateTime: doc.updateTime});
assert.equal(wireCalls.filter(v => v.url.startsWith('http://metadata.')).length, 1);
assert.equal(new URL(wireCalls.at(-1).url).searchParams.get('currentDocument.updateTime'), doc.updateTime);
assert.deepEqual(decodeValue({mapValue: {fields: JSON.parse(wireCalls.at(-1).init.body).fields}}), wireValue);
await assert.rejects(wire.get('somewhere/private'), /invalid_firestore_document/);
for (const status of ['PERMISSION_DENIED', 'FAILED_PRECONDITION']) {
  const failed = createFirestore({env: () => ({FIRESTORE_PROJECT_ID: 'synthetic-project'}), tokenProvider: async () => 'secret',
    fetcher: async () => ({ok: false, status: 400, json: async () => ({error: {status, message: 'PRIVATE VALUES MUST NOT ESCAPE'}})})});
  await assert.rejects(failed.put(BUDGET_DOCUMENT, fresh()), error =>
    error.message === (status === 'FAILED_PRECONDITION' ? 'firestore_conflict' : 'firestore_unavailable'));
}

// Lifecycle fixture: real Lua scripts are independently executed by the Python
// test. This fixture stresses failed handoffs and reruns around Google writes.
clock = 20000 * 86400000;
let sourceState = '1', snapshot, returned;
const redis = async command => {
  if (command[0] === 'HGET') return command[2] === '_initialized' ? sourceState : snapshot && JSON.stringify(snapshot);
  assert.equal(command[0], 'EVAL');
  if (command[1] === ACKNOWLEDGE_LUA) {snapshot.activated = true; return 'acknowledged';}
  if (command[1] === FENCE_LUA) {
    if (sourceState === '1') {
      snapshot = {migrationId: command[4], target: command[5], exportedAt: clock / 1000,
        fields: ['_initialized', '1', '_minute', '0', '_rate', '0', '19999', '25', '20000', '7']};
      sourceState = 'firestore';
    }
    return JSON.stringify(snapshot);
  }
  assert.equal(command[1], RETURN_LUA);
  if (sourceState === '1' && returned) return 'returned';
  assert.equal(sourceState, 'firestore');
  returned = JSON.parse(command[6]); sourceState = '1'; return 'returned';
};
store = memoryStore();
let rejectWrite = true;
const interrupted = {get: store.get, put: (...args) => {
  if (rejectWrite) throw Error('synthetic outage');
  return store.put(...args);
}};
await assert.rejects(migrateBudget({store: interrupted, redis, target, now}), /migration_incomplete/);
assert.equal(sourceState, 'firestore'); assert.equal(store.state().value, undefined);
rejectWrite = false;
assert.equal((await migrateBudget({store: interrupted, redis, target, now})).used, 32);
await createFirestoreBudget({store, now})();
assert.deepEqual(await migrateBudget({store, redis, target, now}), {alreadyMigrated: true, used: 33});
assert.equal(ledgerFromSnapshot(snapshot, now()).days['19999'], 25);
await assert.rejects(migrateBudget({store: memoryStore(), redis, target, now}), /activated_budget_missing/);
await assert.rejects(migrateBudget({store, redis, target: 'projects/another-project/databases/(default)', now}), /requires_review/);
assert.deepEqual(await returnBudget({store, redis, target, now}), {returned: true});
assert.equal(returned.days['20000'], 8); assert.equal(returned.days['19999'], 25);
await assert.rejects(createFirestoreBudget({store, now})(), /budget_unavailable/);
const firstReturned = structuredClone(returned);
await returnBudget({store, redis, target, now});
assert.deepEqual(returned, firstReturned);
console.log(JSON.stringify({passed: true, atomicQuotaBoundary: true, rollingWindowAndRate: true,
  ambiguousWriteFailsClosed: true, wireIdentityAndPreconditions: true,
  migrationResumeAndNoReset: true, rollbackPreservesNewUsage: true,
  liveFirestore: 'pending authenticated Google project'}));
