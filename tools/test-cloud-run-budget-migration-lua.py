"""Execute the actual legacy, handoff and rollback Lua with Redis semantics.
Run with lupa available; no credentials, network calls or live state changes.
"""
import json
import re
from pathlib import Path
from lupa import LuaRuntime

source = Path('services/map-server/budget-migration.mjs').read_text()
fence = re.search(r'FENCE_LUA = `(.*?)`;', source, re.S)[1]
restore = re.search(r'RETURN_LUA = `(.*?)`;', source, re.S)[1]
acknowledge = re.search(r'ACKNOWLEDGE_LUA = `(.*?)`;', source, re.S)[1]
reserve = re.search(r'RESERVE_LUA=`(.*?)`;', Path('lib/location/budget.js').read_text(), re.S)[1]
clock = [20000 * 86400]
ledger = {'_initialized': '1', '19999': '25', '20000': '7', '_minute': '0', '_rate': '0'}
target = 'projects/synthetic-project/databases/(default)'
migration_id = '12345678-1234-1234-1234-123456789012'

def run(script, args=()):
    lua = LuaRuntime(unpack_returned_tuples=True)
    def convert(value):
        if hasattr(value, 'items'):
            pairs = dict(value.items())
            if pairs and all(isinstance(k, int) for k in pairs):
                return [convert(pairs[k]) for k in range(1, len(pairs) + 1)]
            return {k: convert(v) for k, v in pairs.items()}
        return value
    def call(command, key=None, *args):
        if command == 'TIME': return lua.table_from([str(clock[0]), '0'])
        if command == 'HGET': return ledger.get(args[0])
        if command == 'HGETALL': return lua.table_from([v for pair in ledger.items() for v in pair])
        if command == 'HDEL': ledger.pop(args[0], None); return 1
        if command == 'HINCRBY':
            value = int(ledger.get(args[0], '0')) + int(args[1]); ledger[args[0]] = str(value); return value
        if command == 'HSET':
            for i in range(0, len(args), 2): ledger[args[i]] = str(args[i + 1])
            return len(args) // 2
        raise AssertionError(command)
    def fail(message): raise ValueError(message)
    lua.globals().redis = lua.table_from({'call': call, 'error_reply': fail})
    lua.globals().cjson = lua.table_from({'encode': lambda v: json.dumps(convert(v)),
        'decode': lambda v: lua.table_from(json.loads(v), recursive=True)})
    lua.globals().KEYS = lua.table_from(['fixture'])
    lua.globals().ARGV = lua.table_from(args)
    return convert(lua.execute(script))

assert run(reserve) == [1, 33]
snapshot = json.loads(run(fence, [migration_id, target]))
assert dict(zip(snapshot['fields'][::2], snapshot['fields'][1::2]))['20000'] == '8'
assert ledger['_initialized'] == 'firestore'
assert run(reserve) == [-1, 0]
assert json.loads(run(fence, ['different-id', target])) == snapshot
assert run(acknowledge, [migration_id, target]) == 'acknowledged'
assert json.loads(run(fence, ['different-id', target]))['activated'] is True
try: run(fence, ['other', 'projects/other/databases/(default)']); assert False
except ValueError as error: assert str(error) == 'different_target'
next_state = {'days': {'19999': 25, '20000': 11}, 'minute': clock[0] // 60, 'rate': 4}
assert run(restore, [migration_id, target, json.dumps(next_state)]) == 'returned'
assert run(reserve) == [1, 37]
assert run(restore, [migration_id, target, json.dumps(next_state)]) == 'returned'
assert ledger['20000'] == '12'  # Retry never overwrites newer source usage.
ledger.clear()
try: run(fence, [migration_id, target]); assert False
except ValueError as error: assert str(error) == 'budget_unavailable'
ledger.update({'_initialized': '1', '20000': 'corrupt'})
try: run(fence, [migration_id, target]); assert False
except ValueError as error: assert str(error) == 'budget_corrupt'
assert ledger['_initialized'] == '1'
ledger.clear()
ledger.update({'_initialized': '1', '2e4': '39999'})
try: run(fence, [migration_id, target]); assert False
except ValueError as error: assert str(error) == 'budget_corrupt'
print(json.dumps({'passed': True, 'actualLua': True, 'oldInstancesFenced': True,
    'snapshotRetainsUsage': True, 'resumeAndRollbackIdempotent': True, 'corruptSourceRejected': True}))
