"""Structural and navigation checks; date semantics are tested separately.

This does not launch Widgy or test its private Edit Date decoder.
"""
import json
import sys
import zlib
from pathlib import Path
from zipfile import ZipFile


def children(n):
    return n['1'] if isinstance(n.get('1'), list) else []


def walk(n):
    for c in children(n):
        yield c
        yield from walk(c)


def state_model(w):
    nodes = {n['d0']: n for n in walk(w)}
    parents = {c['d0']: n.get('d0') for n in [w, *walk(w)] for c in children(n)}
    actions = {i: [set(map(int, a.split(','))) for a in n['1a'][7:].split('-')]
               for i, n in nodes.items() if n.get('1a', '').startswith('button_')}
    targets = set().union(*(on | off for on, off in actions.values()))
    initial = frozenset(i for i in targets if nodes[i].get('a', True))

    def visible(state, i):
        while i is not None:
            if (i not in state if i in targets else not nodes[i].get('a', True)):
                return False
            i = parents[i]
        return True

    return nodes, parents, actions, targets, initial, visible


before = json.loads(Path(sys.argv[1]).read_bytes())
out = Path(sys.argv[2])
after = json.loads((out / 'candidate.json').read_bytes())
A, B = state_model(before), state_model(after)
assert A[1:5] == B[1:5]
assert list(A[0]) == list(B[0])
assert len(B[0]) == 500
assert len([n for n in B[0].values() if not children(n)]) == 450
assert [g['s'] for g in children(after)] == ['HOME', 'CALENDAR', 'WEATHER', 'HEALTH']
assert {k:v for k,v in before.items() if k != '1'} == {k:v for k,v in after.items() if k != '1'}
headings = set()
for offset in range(-12, 13):
    group = B[0][81106 + offset]
    heads = [n for n in children(group) if n.get('s') in ['Month', 'Year']]
    assert len(heads) == 2
    headings.update(n['d0'] for n in heads)
    for head in heads:
        assert head['66'] == [{'5': 'Date And Time', '6': 'MMMM' if head['s'] == 'Month' else 'yyyy'}]
        if offset:
            y, m, d, h, minute = head['29'].split('|')
            assert y == h == minute == '0'
            assert d == '1_1'
            op, amount = map(int, m.split('_'))
            assert op in [2, 3] and amount * (1 if op == 2 else -1) == offset
        else:
            assert '29' not in head

changed = []
for i, left in A[0].items():
    right = B[0][i]
    if left == right:
        continue
    if children(left):
        assert [n['d0'] for n in children(left)] == [n['d0'] for n in children(right)]
        assert {k:v for k,v in left.items() if k != '1'} == {k:v for k,v in right.items() if k != '1'}
    else:
        assert i in headings
        assert {k:v for k,v in left.items() if k not in ['66', '29']} == {k:v for k,v in right.items() if k not in ['66', '29']}
        changed.append(i)
assert len(changed) == 48
old_js = sum(s.get('5') == 'Javascript' for i in headings for s in A[0][i]['66'])
new_js = sum(s.get('5') == 'Javascript' for i in headings for s in B[0][i]['66'])
assert (old_js, new_js) == (46, 0)
for i in [6170, 80781, 80802, 80844, 83204]:
    assert A[0][i] == B[0][i]

for reset, expected in [(False, (100, 473)), (True, (28, 185))]:
    pending, seen, edges = [B[4]], set(), 0
    reached = set()
    while pending:
        state = pending.pop()
        if state in seen:
            continue
        seen.add(state)
        assert [i for i in A[0] if A[5](state, i)] == [i for i in B[0] if B[5](state, i)]
        months = [i for i in range(81094, 81119) if B[5](state, i)]
        if B[5](state, 94002):
            assert len(months) == 1
            reached.add(months[0])
            visible_heads = {i for i in headings if B[5](state, i)}
            assert visible_heads == {n['d0'] for n in children(B[0][months[0]]) if n.get('s') in ['Month', 'Year']}
        for i, (on, off) in B[2].items():
            if B[5](state, i):
                base = B[4] if reset else state
                pending.append(frozenset((base | on) - off))
                edges += 1
    assert (len(seen), edges) == expected
    assert reached == set(range(81094, 81119))
    print(f'PASS: navigation reset={reset}, {len(seen)} states / {edges} transitions, exactly one matching heading pair.')

with ZipFile(out / 'Widgy Weather.zip') as z:
    assert z.namelist() == ['Widgy Weather.widgy']
    assert z.testzip() is None
    packed = z.read('Widgy Weather.widgy')
    assert packed == (out / 'Widgy Weather.widgy').read_bytes()
    assert json.loads(zlib.decompress(packed, -15)) == after
print('PASS: 48 heading layers only; 46 local JS sources removed. Sources, map, Today circle, style, all 65 navigation actions preserved. ZIP round-trip passed.')
