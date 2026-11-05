"""Reduce tab data work without changing the widget's drawing tree."""
import copy, json, re, sys, zlib
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED

def walk(n):
    for child in n.get('1', []) if isinstance(n.get('1'), list) else []:
        yield child
        yield from walk(child)

def native(fmt):
    return {'5': 'Date And Time', '6': fmt}

def literal(text):
    return {'5': 'Custom Text', '6': 'Text', '25': text}

def optimize(source, assets):
    w=copy.deepcopy(source)
    nodes={n['d0']:n for n in walk(w)}
    changed=[]
    def date(n, parts, uppercase=False, days=0):
        assert len(n['66'])==1 and n['66'][0]['5']=='Javascript'
        n['66']=parts
        if uppercase:
            # Case format 1, as serialized by native Widgy date layers.
            n['9']={'a':[{'a':1,'b':638,'c':0,'d':638}],'b':0}
        if days:
            # Native input date: year|month|day|hour|minute; exported +/- day
            # fixtures use mode 2 for addition and mode 3 for subtraction.
            n['29']=f'0|0|{2 if days>0 else 3}_{abs(days)}|0|0'
        changed.append(n['d0'])
    date(nodes[6103],[native('EEEE')],True)
    date(nodes[6104],[native('MMMM')],True)
    for i in (80338,85001):
        date(nodes[i],[native('EEEE'),literal(', '),native('d'),literal(' '),native('MMMM'),literal(' '),native('yyyy')])
    for n in nodes.values():
        s=n.get('66',[{}])[0].get('10','')
        if n.get('s')=='Month' and '(new Date().getMonth()+0)%12' in s:
            date(n,[native('MMMM')])
        elif n.get('s')=='Year' and s=='function main(){return String(new Date().getFullYear()+(0));}':
            date(n,[native('yyyy')])
        elif re.fullmatch(r'Day[0-6]',n.get('s','')) and "['SUN','MON','TUE','WED','THU','FRI','SAT']" in s:
            offset=int(re.search(r'getDate\(\)\+\((-?\d+)\)',s).group(1))
            date(n,[native('E')],True,offset)
    assert len(changed)==15,changed
    city=next(v for v in w['36'] if v['1']=='calendar_location_pair')
    assert nodes[83204]['66']==[literal('${widgy.calendar_location_pair}')]
    assert sum('${widgy.calendar_location_pair}' in json.dumps(n.get('66')) for n in nodes.values())==1
    nodes[83204]['66']=copy.deepcopy(city['3']['66'])
    w['36'].remove(city)
    assert '${widgy.calendar_location_pair}' not in json.dumps(w)
    image_ids=[]
    for n in nodes.values():
        if n.get('z')=='5' and n.get('1')=='Web URL':
            for original,replacement in assets.items():
                if n.get('2','').endswith(original):
                    n['2']=n['2'][:-len(original)]+replacement
                    image_ids.append(n['d0'])
    assert len(image_ids)==4
    return w,{'nativeDateLayers':changed,'localCityLayer':83204,'immutableBackgroundLayers':image_ids}

if __name__=='__main__':
    source=json.loads(Path(sys.argv[1]).read_text())
    assets=json.loads(Path(sys.argv[2]).read_text())
    w,report=optimize(source,assets)
    out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
    raw=json.dumps(w,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    compressor=zlib.compressobj(9,wbits=-15)
    encoded=compressor.compress(raw)+compressor.flush()
    (out/'Widgy Weather.widgy').write_bytes(encoded)
    with ZipFile(out/'Widgy Weather.zip','w',ZIP_STORED) as z:z.writestr('Widgy Weather.widgy',encoded)
    (out/'candidate.json').write_bytes(raw)
    (out/'report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))
