"""Protect the complete widget, including navigation and user-owned styling."""
import copy, json, re, sys, zipfile, zlib, runpy
from pathlib import Path
walk=runpy.run_path(str(Path(__file__).with_name('build-widget-city-fast-path.py')))['walk']

before=json.loads(Path(sys.argv[1]).read_text())
out=Path(sys.argv[2]);after=json.loads((out/'candidate.json').read_text())
old={n['d0']:n for n in walk(before)};new={n['d0']:n for n in walk(after)}
assert len(new)==500 and sum(n['z']=='13' for n in new.values())==50
assert [n['s'] for n in after['1']]==['HOME','CALENDAR','WEATHER','HEALTH']
assert set(old)==set(new)
restored=copy.deepcopy(after)
next(n for n in walk(restored) if n['d0']==83204)['66'][0]['10']=old[83204]['66'][0]['10']
urls=[]
def restore_urls(value):
    if isinstance(value,dict):return {k:restore_urls(v) for k,v in value.items()}
    if isinstance(value,list):return [restore_urls(v) for v in value]
    if isinstance(value,str) and value.startswith('https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/calendar-widget?'):
        assert value.endswith('&reuse=months-v1');urls.append(value)
        return value[:-len('&reuse=months-v1')]
    return value
restored=restore_urls(restored)
assert len(urls)>25
assert restored==before,'Only the city JS source and calendar reuse URL flag may change'
calls=[re.search(r'^sharedLocationText\([^\n]+\);',n[83204]['66'][0]['10'],re.M).group(0) for n in [old,new]]
assert calls[0]==calls[1],'Keep existing coordinates and endpoint'
assert len(after['36'])==45
for i in [6170,80781,80802,80844]:assert new[i]==old[i]
assert sum(n.get('1a','').startswith('button_') for n in new.values())==65
with zipfile.ZipFile(out/'Widgy Weather.zip') as z:
    assert z.namelist()==['Widgy Weather.widgy'] and z.testzip() is None
    assert json.loads(zlib.decompress(z.read('Widgy Weather.widgy'),-15))==after
print(f'PASS: city script plus {len(urls)} calendar URL flags only; exact map/Today circle/drawing tree/65 internal buttons, 500 objects, 50 groups, 45 globals and archive round-trip.')
