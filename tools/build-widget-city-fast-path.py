"""Enable city reuse and adjacent-month provider reuse, preserving all drawing."""
import copy, json, re, sys, zlib, zipfile
from pathlib import Path

def walk(node):
    for child in node.get('1', []) if isinstance(node.get('1'), list) else []:
        yield child
        yield from walk(child)

def optimize(source):
    result=copy.deepcopy(source)
    nodes={n['d0']:n for n in walk(result)}
    layer=nodes[83204]
    assert layer['z']=='1' and len(layer['66'])==1
    script=layer['66'][0]
    assert script['5']=='Javascript'
    # Keep the existing call and its credentials byte-for-byte. Never publish
    # the input JSON or final widget as repository test fixtures.
    call=re.search(r'^sharedLocationText\([^\n]+\);\s*$',script['10'],re.M)
    assert call, 'Expected the independent shared-location call'
    script['10']=Path(__file__).with_name('widget-city-fast-path.js').read_text()+call.group(0).strip()+'\n'
    def enable_month_reuse(value):
        if isinstance(value,dict):return {k:enable_month_reuse(v) for k,v in value.items()}
        if isinstance(value,list):return [enable_month_reuse(v) for v in value]
        if isinstance(value,str) and value.startswith('https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/calendar-widget?'):
            assert '&reuse=' not in value
            return value+'&reuse=months-v1'
        return value
    result=enable_month_reuse(result)
    return result

if __name__=='__main__':
    original=json.loads(Path(sys.argv[1]).read_text())
    candidate=optimize(original)
    out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
    raw=json.dumps(candidate,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    (out/'candidate.json').write_bytes(raw)
    encoder=zlib.compressobj(9,wbits=-15)
    packed=encoder.compress(raw)+encoder.flush()
    (out/'Widgy Weather.widgy').write_bytes(packed)
    with zipfile.ZipFile(out/'Widgy Weather.zip','w',zipfile.ZIP_STORED) as z:z.writestr('Widgy Weather.widgy',packed)
    print('Built city fast path and adjacent-month provider reuse; drawing and buttons preserved.')
