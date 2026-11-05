"""Upgrade the existing annual calendar URLs without changing widget objects."""
import json,sys,zlib,zipfile
from pathlib import Path

PREFIX='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/calendar-widget?'
def optimize(source):
    changes=[]
    def update(value):
        if isinstance(value,dict):return {k:update(v) for k,v in value.items()}
        if isinstance(value,list):return [update(v) for v in value]
        if isinstance(value,str) and value.startswith(PREFIX):
            assert value.count('&reuse=months-v1')==1, 'Expected version 5 calendar source'
            changes.append(1)
            return value.replace('&reuse=months-v1','&reuse=year-v1')
        return value
    result=update(source)
    assert len(changes)==62, 'Expected the existing 37 fields and 25 month images'
    return result

if __name__=='__main__':
    candidate=optimize(json.loads(Path(sys.argv[1]).read_text()))
    out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
    raw=json.dumps(candidate,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
    (out/'candidate.json').write_bytes(raw)
    encoder=zlib.compressobj(9,wbits=-15)
    packed=encoder.compress(raw)+encoder.flush()
    (out/'Widgy Weather.widgy').write_bytes(packed)
    with zipfile.ZipFile(out/'Widgy Weather.zip','w',zipfile.ZIP_STORED) as z:z.writestr('Widgy Weather.widgy',packed)
    print('Built annual provider reuse: 62 URL flags changed; all widget objects preserved.')
