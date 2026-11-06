"""Opt the existing full widget into Home's seven-field weather response.

Default: validate without producing a widget. --output writes a candidate;
the matching server change must be deployed before claiming a speed benefit.
Private widget exports and credentials must never be committed to Git.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import zlib

FIELDS = {'temperature', 'high', 'low', 'status', 'icon_status', 'sunrise', 'sunset'}

def transform(source):
    candidate = copy.deepcopy(source)
    changes = []
    def visit(value, path=()):
        if isinstance(value, dict):
            if value.get('5') == 'JSON Endpoint' and '/api/weather-panel?' in value.get('18', ''):
                url = value['18']
                assert '&format=json' in url and '&view=' not in url
                assert len(value.get('23', [])) == 1 and value['23'][0] in FIELDS
                changes.append((path, url, value['23'][0]))
                value['18'] = url + '&view=home-v1'
            for key, child in value.items():
                visit(child, path + (key,))
        elif isinstance(value, list):
            for key, child in enumerate(value):
                visit(child, path + (key,))
    visit(candidate)
    assert len(changes) == 7 and {item[2] for item in changes} == FIELDS
    assert len({item[1] for item in changes}) == 1
    restored = copy.deepcopy(candidate)
    for path, url, _ in changes:
        node = restored
        for key in path:
            node = node[key]
        assert node['18'] == url + '&view=home-v1'
        node['18'] = url
    assert restored == source, 'Every other field, including all navigation and drawing, must remain exact'
    return candidate

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    packed = args.baseline.read_bytes()
    source = json.loads(zlib.decompress(packed, -15))
    candidate = transform(source)
    encoder = zlib.compressobj(9, wbits=-15)
    raw = json.dumps(candidate, ensure_ascii=False, separators=(',', ':')).encode()
    encoded = encoder.compress(raw) + encoder.flush()
    assert json.loads(zlib.decompress(encoded, -15)) == candidate
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(encoded)
    print(json.dumps({'verified': True, 'changed_bindings': 7,
        'other_document_fields_exact': True, 'archive_roundtrip': True,
        'baseline_sha256': hashlib.sha256(packed).hexdigest(),
        'candidate_written': bool(args.output), 'server_deployment_required': True}))
