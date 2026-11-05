import copy,json,sys,zipfile,zlib,re
from pathlib import Path
def kids(n):return n['1'] if isinstance(n.get('1'),list) else []
def walk(n):
 for c in kids(n):yield c;yield from walk(c)
def index(w):
 ns={n['d0']:n for n in walk(w)};parent={c['d0']:n.get('d0') for n in [w,*walk(w)] for c in kids(n)}
 acts={i:[set(map(int,a.split(','))) for a in n['1a'][7:].split('-')] for i,n in ns.items() if n.get('1a','').startswith('button_')}
 ts=set().union(*(on|off for on,off in acts.values()));return ns,parent,acts,ts,frozenset(i for i in ts if ns[i].get('a',True))
def drop(n,*ks):return {k:v for k,v in n.items() if k not in ks}
def rect(n):return [n.get(k,{'a':[{'a':0}]})['a'][0]['a'] for k in 'bcde']
def show(t,s,i):
 ns,p,a,ts,d=t
 while i!=None:
  if (i not in s if i in ts else not ns[i].get('a',True)):return False
  i=p[i]
 return True
def nexts(r,s):return frozenset((s|r[0])-r[1])

root=Path(sys.argv[2])
original=json.loads(Path(sys.argv[1]).read_text())
candidate=json.loads((root/'candidate.json').read_text())
report=json.loads((root/'report.json').read_text())
A=index(original);B=index(candidate);old=A[0];new=B[0]
assert len(new)==500 and sum(n['z']=='13' for n in new.values())==50
assert [n['s'] for n in kids(candidate)]==['HOME','CALENDAR','WEATHER','HEALTH']
assert A[2:]==B[2:] and A[1]==B[1]
assert len(candidate['36'])==45
names={v['1'] for v in candidate['36']};ids={v['0'] for v in candidate['36']}
for name in re.findall(r'\$\{widgy\.([^}]+)\}',json.dumps(candidate)):assert name in names,name
for n in new.values():
    if n.get('o1'):assert n['o1']['0'] in ids
    for k in ['b','c','d','e','1a','4a','o1','f']:
        assert n.get(k)==old[n['d0']].get(k),(n['d0'],k)
for i in [6170,80781,80802,80844]:assert new[i]==old[i]
# White-list exactly the intended mutations, including all other root fields.
restored=copy.deepcopy(candidate);rn=index(restored)[0]
for i in report['nativeDateLayers']:
    for key in ['66','9','29']:
        if key in old[i]:rn[i][key]=copy.deepcopy(old[i][key])
        else:rn[i].pop(key,None)
rn[83204]['66']=copy.deepcopy(old[83204]['66'])
restored['36']=copy.deepcopy(original['36'])
for i in report['immutableBackgroundLayers']:rn[i]['2']=old[i]['2']
assert restored==original
def js_count(o):
    if isinstance(o,dict):return int(o.get('5')=='Javascript' or o.get('z')=='5' and o.get('1')=='Javascript')+sum(js_count(v) for v in o.values())
    if isinstance(o,list):return sum(map(js_count,o))
    return 0
assert (js_count(original),js_count(candidate))==(103,88)
leaves=[i for i,n in old.items() if not kids(n)]
for reset in (False,True):
    pending=[(A[4],B[4])];seen=set();edges=0
    while pending:
        s,t=pending.pop()
        if (s,t) in seen:continue
        seen.add((s,t))
        assert [i for i in leaves if show(A,s,i)]==[i for i in leaves if show(B,t,i)]
        assert sum(show(B,t,i) for i in [245,94002,246,195])==1
        for i in A[2]:
            if show(A,s,i):
                pending.append((nexts(A[2][i],A[4] if reset else s),nexts(B[2][i],B[4] if reset else t)));edges+=1
    print('Navigation',{'reset':reset,'states':len(seen),'transitions':edges})
with zipfile.ZipFile(root/'Widgy Weather.zip') as z:
    assert z.namelist()==['Widgy Weather.widgy'] and z.testzip() is None
    assert json.loads(zlib.decompress(z.read(z.namelist()[0]),-15))==candidate
print('500 objects, 50 groups, unchanged map/Today circle/geometry/actions; 103 → 88 JS sources; 46 → 45 globals; archive round-trip passed.')
