import json,runpy,sys,zlib,zipfile
from pathlib import Path
source=json.loads(Path(sys.argv[1]).read_text())
out=Path(sys.argv[2])
builder=runpy.run_path(str(Path(__file__).with_name('build-widget-year-reuse.py')))
candidate=json.loads((out/'candidate.json').read_text())
assert candidate==builder['optimize'](source)
changed=[]
def compare(a,b,path=()):
    assert type(a)==type(b),path
    if isinstance(a,dict):
        assert a.keys()==b.keys(),path
        for k in a:compare(a[k],b[k],path+(k,))
    elif isinstance(a,list):
        assert len(a)==len(b),path
        for i,(left,right) in enumerate(zip(a,b)):compare(left,right,path+(i,))
    elif a!=b:
        assert isinstance(a,str) and a.startswith(builder['PREFIX']),path
        assert b==a.replace('&reuse=months-v1','&reuse=year-v1'),path
        changed.append(path)
compare(source,candidate)
assert len(changed)==62
with zipfile.ZipFile(out/'Widgy Weather.zip') as z:
    assert z.namelist()==['Widgy Weather.widgy']
    packed=z.read(z.namelist()[0])
    assert packed==(out/'Widgy Weather.widgy').read_bytes()
    assert json.loads(zlib.decompress(packed,-15))==candidate
print('PASS: precisely 62 URL flags changed; every other field, object, map, Today circle, script and navigation action preserved; archive round-trip.')
