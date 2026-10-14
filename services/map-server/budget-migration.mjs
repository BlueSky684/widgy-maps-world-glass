// Operator-only migration, never imported by the HTTP service.
import {randomUUID} from 'node:crypto';
import {BUDGET_DOCUMENT, budgetState} from './firestore-budget.mjs';
export const LEGACY_LEDGER = 'widgy:bdc:budget:v1';

// Atomic snapshot + fence. Even old deployed clients require _initialized=1.
export const FENCE_LUA = `
local state=redis.call('HGET',KEYS[1],'_initialized')
if state=='firestore' then
  local record=redis.call('HGET',KEYS[1],'_firestoreMigration')
  if not record then return redis.error_reply('missing_migration') end
  local data=cjson.decode(record)
  if data.target~=ARGV[2] then return redis.error_reply('different_target') end
  return record
end
if state~='1' then return redis.error_reply('budget_unavailable') end
local fields=redis.call('HGETALL',KEYS[1])
local time=tonumber(redis.call('TIME')[1])
local day=math.floor(time/86400)
local total=0
for i=1,#fields,2 do
  local d=tonumber(fields[i])
  if d then
    if not string.match(fields[i],'^%d+$') then return redis.error_reply('budget_corrupt') end
    local n=tonumber(fields[i+1])
    if d<0 or d~=math.floor(d) or d>day or not n or n<0 or n>40000 or n~=math.floor(n) then return redis.error_reply('budget_corrupt') end
    if d>=day-31 then total=total+n end
  end
end
local minute=tonumber(redis.call('HGET',KEYS[1],'_minute') or '0')
local rate=tonumber(redis.call('HGET',KEYS[1],'_rate') or '0')
if total>40000 or not minute or minute<0 or minute>math.floor(time/60) or minute~=math.floor(minute) or not rate or rate<0 or rate>10 or rate~=math.floor(rate) then return redis.error_reply('budget_corrupt') end
local record=cjson.encode({migrationId=ARGV[1],target=ARGV[2],exportedAt=time,fields=fields})
redis.call('HSET',KEYS[1],'_initialized','firestore','_firestoreMigration',record)
return record
`;

export const RETURN_LUA = `
local state=redis.call('HGET',KEYS[1],'_initialized')
if state=='1' and redis.call('HGET',KEYS[1],'_returnedMigration')==ARGV[1] then return 'returned' end
if state~='firestore' then return redis.error_reply('source_not_fenced') end
local record=cjson.decode(redis.call('HGET',KEYS[1],'_firestoreMigration') or '{}')
if record.migrationId~=ARGV[1] or record.target~=ARGV[2] then return redis.error_reply('different_migration') end
local next=cjson.decode(ARGV[3])
local time=tonumber(redis.call('TIME')[1])
local day=math.floor(time/86400)
local total=0
for d,n in pairs(next.days) do
  if not tonumber(d) or tonumber(d)<0 or tonumber(d)>day or type(n)~='number' or n<0 or n>40000 or n~=math.floor(n) then return redis.error_reply('budget_corrupt') end
  if tonumber(d)>=day-31 then total=total+n end
end
if total>40000 or type(next.minute)~='number' or next.minute<0 or next.minute>math.floor(time/60) or next.minute~=math.floor(next.minute) or type(next.rate)~='number' or next.rate<0 or next.rate>10 or next.rate~=math.floor(next.rate) then return redis.error_reply('budget_corrupt') end
local fields=redis.call('HGETALL',KEYS[1])
for i=1,#fields,2 do if tonumber(fields[i]) then redis.call('HDEL',KEYS[1],fields[i]) end end
for d,n in pairs(next.days) do redis.call('HSET',KEYS[1],d,tostring(n)) end
redis.call('HSET',KEYS[1],'_minute',tostring(next.minute),'_rate',tostring(next.rate),'_returnedMigration',ARGV[1],'_initialized','1')
return 'returned'
`;

export const ACKNOWLEDGE_LUA = `
if redis.call('HGET',KEYS[1],'_initialized')~='firestore' then return redis.error_reply('source_not_fenced') end
local record=cjson.decode(redis.call('HGET',KEYS[1],'_firestoreMigration') or '{}')
if record.migrationId~=ARGV[1] or record.target~=ARGV[2] then return redis.error_reply('different_migration') end
record.activated=true
redis.call('HSET',KEYS[1],'_firestoreMigration',cjson.encode(record))
return 'acknowledged'
`;

export function ledgerFromSnapshot(snapshot, nowMs = Date.now()) {
  if (!snapshot || !Array.isArray(snapshot.fields) || snapshot.fields.length % 2 ||
      !Number.isSafeInteger(snapshot.exportedAt) || snapshot.exportedAt <= 0) throw Error('invalid_snapshot');
  const fields = {};
  for (let i = 0; i < snapshot.fields.length; i += 2) {
    const [key, value] = snapshot.fields.slice(i, i + 2);
    if (typeof key !== 'string' || typeof value !== 'string' || Object.hasOwn(fields, key)) throw Error('invalid_snapshot');
    Object.defineProperty(fields, key, {value, enumerable: true});
  }
  if (fields._initialized !== '1') throw Error('invalid_snapshot');
  const days = Object.fromEntries(Object.entries(fields).filter(([k]) => /^\d+$/.test(k)).map(([k, v]) => {
    if (!/^\d+$/.test(v)) throw Error('invalid_snapshot');
    return [k, Number(v)];
  }));
  const value = {schema: 1, state: 'active', days, minute: Number(fields._minute || '0'), rate: Number(fields._rate || '0'),
    migrationId: snapshot.migrationId, source: 'upstash-import', target: snapshot.target, importedAt: new Date(snapshot.exportedAt * 1000)};
  budgetState(value, nowMs);
  return value;
}

export async function migrateBudget({store, redis, target, now = Date.now}) {
  const before = await store.get(BUDGET_DOCUMENT, {timeoutMs: 15000});
  let snapshot, document = before;
  if (before) {
    const raw = await redis(['HGET', LEGACY_LEDGER, '_firestoreMigration']);
    snapshot = typeof raw === 'string' ? JSON.parse(raw) : null;
    const sourceState = await redis(['HGET', LEGACY_LEDGER, '_initialized']);
    if (sourceState !== 'firestore' || !['pending', 'active'].includes(before.value.state) ||
        before.value.target !== target || snapshot?.target !== target ||
        snapshot.migrationId !== before.value.migrationId) throw Error('existing_budget_requires_review');
    if (before.value.state === 'active') {
      if (snapshot.activated !== true) throw Error('existing_budget_requires_review');
      return {alreadyMigrated: true, used: budgetState(before.value, now()).used};
    }
  } else {
    snapshot = JSON.parse(await redis(['EVAL', FENCE_LUA, '1', LEGACY_LEDGER, randomUUID(), target]));
    if (snapshot.target !== target) throw Error('different_target');
    // Once a destination was activated, a missing document is data loss, not
    // permission to re-import its old snapshot and silently reset later usage.
    if (snapshot.activated) throw Error('activated_budget_missing_requires_recovery');
    const value = {...ledgerFromSnapshot(snapshot, now()), state: 'pending'};
    try { document = await store.put(BUDGET_DOCUMENT, value, {exists: false, timeoutMs: 15000}); }
    catch {
      document = await store.get(BUDGET_DOCUMENT, {timeoutMs: 15000});
      if (!document || document.value.migrationId !== value.migrationId || document.value.target !== target ||
          !['pending', 'active'].includes(document.value.state)) throw Error('migration_incomplete_rerun_same_command');
    }
  }
  budgetState({...document.value, state: 'active'}, now());
  const acknowledged = await redis(['EVAL', ACKNOWLEDGE_LUA, '1', LEGACY_LEDGER, snapshot.migrationId, target]);
  if (acknowledged !== 'acknowledged') throw Error('migration_incomplete_rerun_same_command');
  if (document.value.state === 'pending') {
    try { await store.put(BUDGET_DOCUMENT, {...document.value, state: 'active'}, {updateTime: document.updateTime, timeoutMs: 15000}); }
    catch { /* Read back below: a competing retry or lost response may have succeeded. */ }
  }
  const confirmed = await store.get(BUDGET_DOCUMENT, {timeoutMs: 15000});
  if (!confirmed || confirmed.value.migrationId !== snapshot.migrationId || confirmed.value.target !== target || confirmed.value.state !== 'active') throw Error('migration_incomplete_rerun_same_command');
  return {alreadyMigrated: false, used: budgetState(confirmed.value, now()).used};
}

export async function returnBudget({store, redis, target, now = Date.now}) {
  let document;
  for (let attempt = 0; attempt < 5; attempt++) {
    document = await store.get(BUDGET_DOCUMENT, {timeoutMs: 15000});
    if (!document || document.value.target !== target) throw Error('wrong_budget');
    if (document.value.state === 'returned') break;
    budgetState(document.value, now());
    try {
      document = await store.put(BUDGET_DOCUMENT, {...document.value, state: 'returned'}, {updateTime: document.updateTime, timeoutMs: 15000});
      break;
    } catch (error) { if (error.message !== 'firestore_conflict') throw Error('return_incomplete_rerun_same_command'); }
  }
  if (document.value.state !== 'returned') throw Error('return_incomplete_rerun_same_command');
  const value = document.value;
  budgetState({...value, state: 'active'}, now());
  const result = await redis(['EVAL', RETURN_LUA, '1', LEGACY_LEDGER, value.migrationId, target,
    JSON.stringify({days: value.days, minute: value.minute, rate: value.rate})]);
  if (result !== 'returned') throw Error('return_incomplete_rerun_same_command');
  return {returned: true};
}
