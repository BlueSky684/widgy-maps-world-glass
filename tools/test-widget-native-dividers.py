"""Contract, complete navigation-state and divider geometry checks.

These model the export; they neither launch Widgy nor measure phone speed.
"""
import base64
import calendar
import collections
import datetime
import io
import json
import re
import sys
import zlib
from pathlib import Path
from zipfile import ZipFile

from PIL import Image


def children(n):
    return n['1'] if isinstance(n.get('1'), list) else []


def walk(n):
    for c in children(n):
        yield c
        yield from walk(c)


def without(n, *keys):
    return {k: v for k, v in n.items() if k not in keys}


def model(w):
    ns = {n['d0']: n for n in walk(w)}
    parent = {c['d0']: n.get('d0') for n in [w, *walk(w)] for c in children(n)}
    actions = {i: [set(map(int, a.split(','))) for a in n['1a'][7:].split('-')]
               for i, n in ns.items() if n.get('1a', '').startswith('button_')}
    targets = set().union(*(on | off for on, off in actions.values()))
    initial = frozenset(i for i in targets if ns[i].get('a', True))

    def visible(state, i):
        while i is not None:
            if (i not in state if i in targets else not ns[i].get('a', True)):
                return False
            i = parent[i]
        return True
    return ns, parent, actions, targets, initial, visible


def js_count(value):
    if isinstance(value, dict):
        return int(value.get('1') == 'Javascript' or value.get('5') == 'Javascript') + sum(map(js_count, value.values()))
    if isinstance(value, list):
        return sum(map(js_count, value))
    return 0


before = json.loads(Path(sys.argv[1]).read_bytes())
out = Path(sys.argv[2])
after = json.loads((out / 'candidate.json').read_bytes())
A, B = model(before), model(after)
assert len(A[0]) == 500 and len(B[0]) == 548
assert len(B[0]) == len(list(walk(after))), 'duplicate layer id'
assert sum(not children(n) for n in B[0].values()) == 498
assert sum(bool(children(n)) for n in B[0].values()) == 50
assert A[2:5] == B[2:5] and len(B[2]) == 65
assert {i:B[1][i] for i in A[0]} == A[1]
assert without(before, '1', 'a2') == without(after, '1', 'a2')
assert after['a2'] > max(B[0]) and after['a2'] >= before['a2']
assert [g['s'] for g in children(after)] == ['HOME', 'CALENDAR', 'WEATHER', 'HEALTH']
assert (js_count(before), js_count(after)) == (42, 18)
changed = {i for i,n in A[0].items() if n.get('s') == 'Week dividers'}
added = B[0].keys() - A[0].keys()
assert len(changed) == 24 and len(added) == 48
assert not (A[0].keys() - B[0].keys())
assert not (changed | added) & A[3]
for i,n in A[0].items():
    if children(n):
        assert without(n, '1') == without(B[0][i], '1')
        assert [c['d0'] for c in children(n) if c['d0'] not in changed] == [
            c['d0'] for c in children(B[0][i]) if c['d0'] not in changed | added]
    elif i not in changed:
        assert n == B[0][i], ('unrelated layer edited', i)
for i in [6170, 80781, 80802, 80844, 83204, 81106]:
    assert A[0][i] == B[0][i]

templates = {w:B[0][i] for w,i in [(4,80390),(5,80395),(6,80401)]}
native_by_panel = {}
for offset in range(-12, 13):
    panel = B[0][81106 + offset]
    layers = [n for n in children(panel) if re.fullmatch('[456] week dividers', n.get('s',''))]
    assert len(layers) == 3
    native_by_panel[panel['d0']] = layers
    for n in layers:
        weeks = int(n['s'][0])
        assert without(n, 'd0', 'o1') == without(templates[weeks], 'd0', 'o1')
        assert n['o1'] == dict(templates[weeks]['o1'], **{'2':chr(77 + offset)+str(weeks)})
    if offset:
        old = next(n for n in children(A[0][panel['d0']]) if n['d0'] in changed)
        original_order = [n['d0'] for n in children(A[0][panel['d0']])]
        expanded_order = []
        for n in children(panel):
            if n in layers:
                if n is layers[0]: expanded_order.append(old['d0'])
            else: expanded_order.append(n['d0'])
        assert original_order == expanded_order

# Every existing non-divider element and action retains visibility and paint order
# under both behavior models used to catch the previous month-reset regression.
stable_ids = set(A[0]) - changed
for reset,expected in [(False,(100,473)),(True,(28,185))]:
    pending,seen,edges,reached = [B[4]],set(),0,set()
    while pending:
        state = pending.pop()
        if state in seen: continue
        seen.add(state)
        assert [i for i in A[0] if i in stable_ids and A[5](state,i)] == [
            i for i in B[0] if i in stable_ids and B[5](state,i)]
        panels = [i for i in native_by_panel if B[5](state,i)]
        if B[5](state,94002):
            assert len(panels) == 1
            reached.update(panels)
            for weeks in (4,5,6):
                # Exactly the divider variant that shares the native grid's predicate.
                chosen = [n for n in native_by_panel[panels[0]] if n['o1']['2'].endswith(str(weeks))]
                grids = [n for n in children(B[0][panels[0]]) if n.get('s') == f'Dates · {weeks} weeks']
                assert len(chosen) == len(grids) == 1
                assert chosen[0]['o1'] == grids[0]['o1']
                assert B[5](state,chosen[0]['d0']) and B[5](state,grids[0]['d0'])
        else: assert not panels
        for i,(on,off) in B[2].items():
            if B[5](state,i):
                pending.append(frozenset(((B[4] if reset else state)|on)-off))
                edges += 1
    assert (len(seen),edges) == expected and len(reached) == 25
    print(f'PASS navigation reset={reset}: {len(seen)} states, {edges} transitions, 25 months.')

# Independent Gregorian calendar reference checks every month/offset in 400 years.
counts=collections.Counter()
for year in range(2000,2400):
    for month in range(1,13):
        for offset in range(-12,13):
            y,m=divmod(year*12+month-1+offset,12);m+=1
            weekday=(datetime.date(y,m,1).weekday()+1)%7
            days=calendar.monthrange(y,m)[1]
            weeks=(weekday+days+6)//7
            assert weeks in (4,5,6)
            token=chr(77+offset)+str(weeks)
            choices=[n for n in native_by_panel[81106+offset] if n['o1']['2']==token]
            assert len(choices)==1 and int(choices[0]['s'][0])==weeks
            counts[weeks]+=1
assert all(counts[w]>0 for w in (4,5,6))
print('PASS 120,000 month/offset cases, including leap years and year rollover:',dict(counts))

# The prior PNGs are area-sampled renderings of these exact native polygons.
# Verify every row and RGBA pixel against the polygon coverage at source scale.
pixel_checks=0
for i in sorted(changed):
    old=A[0][i]
    uris=re.findall(r'data:image/png;base64,([A-Za-z0-9+/=]+)',old['22'])
    assert len(uris)==3
    left,top,width,height=[old[k]['a'][0]['a'] for k in 'bcde']
    for weeks,uri in zip((4,5,6),uris):
        n=templates[weeks]
        x,y,w,h=[n[k]['a'][0]['a'] for k in 'bcde']
        assert x==left and w==width
        shapes=json.loads(base64.b64decode(n['2']))['items']
        assert len(shapes)==1 and shapes[0]['id']==n['3']
        points=shapes[0]['shape']['points']
        assert len(points)==(weeks-1)*7
        bands=[]
        for j in range(0,len(points),7):
            ps=[(p['x'],p['y']) for p in points[j:j+7]]
            lo,hi=ps[1][1],ps[3][1]
            assert ps==[(0,0),(0,lo),(1,lo),(1,hi),(0,hi),(0,lo),(0,0)]
            bands.append((y+lo*h,y+hi*h))
        color_id=n['g'].split('-')[0]
        swatch=next(c for c in before['2'] if c.startswith(color_id+'-')).split('-')[1]
        assert n['g'].endswith('-100') and swatch[-2:]=='FF'
        rgb=tuple(bytes.fromhex(swatch[:6]))
        im=Image.open(io.BytesIO(base64.b64decode(uri))).convert('RGBA')
        scale=im.width/width
        assert abs(height*scale-im.height)<1e-6
        expected=bytearray()
        for row in range(im.height):
            coverage=sum(max(0,min(row+1,(b-top)*scale)-max(row,(a-top)*scale)) for a,b in bands)
            alpha=round(255*min(1,coverage))
            expected.extend(bytes((*rgb,alpha))*im.width)
        assert im.tobytes()==bytes(expected), ('divider geometry or color mismatch',i,weeks)
        pixel_checks+=im.width*im.height
print('PASS native geometry/ink matches all 72 source PNGs:',pixel_checks,'RGBA pixels.')

with ZipFile(out/'Widgy Weather.zip') as z:
    assert z.namelist()==['Widgy Weather.widgy'] and z.testzip() is None
    packed=z.read('Widgy Weather.widgy')
    assert packed==(out/'Widgy Weather.widgy').read_bytes()
    assert json.loads(zlib.decompress(packed,-15))==after
print('PASS 24 divider sources only; 42→18 JS sources; 498 leaves + 50 groups; sources/actions/headings preserved; ZIP round-trip.')
