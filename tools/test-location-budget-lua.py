"""Execute the actual Lua script with an in-memory Redis command fixture.
Requires lupa; live Upstash integration remains a separate activation gate.
"""
import re
from pathlib import Path
from lupa import LuaRuntime
script=re.search(r'RESERVE_LUA=`(.*?)`;',Path('lib/location/budget.js').read_text(),re.S)[1]
ledger={}
clock=[20000*86400]
def instance():
    lua=LuaRuntime(unpack_returned_tuples=True)
    def call(command,key=None,*args):
        if command=='TIME': return lua.table_from([str(clock[0]),'0'])
        if command=='HGET': return ledger.get(args[0])
        if command=='HGETALL': return lua.table_from([v for pair in ledger.items() for v in pair])
        if command=='HDEL': ledger.pop(args[0],None); return 1
        if command=='HINCRBY':
            value=int(ledger.get(args[0],'0'))+int(args[1]);ledger[args[0]]=str(value);return value
        if command=='HSET':
            for i in range(0,len(args),2): ledger[args[i]]=str(args[i+1])
            return len(args)//2
        raise AssertionError(command)
    lua.globals().redis=lua.table_from({'call':call})
    lua.globals().KEYS=lua.table_from(['fixture'])
    return lambda:list(lua.execute(script).values())
a,b=instance(),instance()
assert a()==[-1,0]
ledger['_initialized']='1'
for i in range(10): assert (a if i%2 else b)()==[1,i+1]
assert a()==[2,10]
clock[0]+=60
assert b()==[1,11]
ledger['20000']='39999'
clock[0]+=60
assert a()==[1,40000]
assert b()==[0,40000]
clock[0]=20031*86400
assert a()==[0,40000] # Preserve partial oldest day for rolling 31-day safety.
clock[0]=20032*86400
assert b()==[1,1]
assert '20000' not in ledger
ledger['20032']='broken'
assert a()[0]==-1
ledger.clear()
assert b()[0]==-1 # Eviction must never reset quota implicitly.
print('PASS: actual Lua, shared ledger across runtimes, minute throttle, 40k boundary, rollover and missing/corrupt ledger')
