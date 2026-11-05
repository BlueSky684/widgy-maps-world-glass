"""Diagnostic copy: bypass just the asynchronous city/country label source.

Never use this as the production widget: its location label intentionally
does not update. Private input/output exports must not be committed.
"""
import argparse
import copy
import json
import subprocess
import zlib
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile


def children(node):
    return node['1'] if isinstance(node.get('1'), list) else []


def walk(node):
    for child in children(node):
        yield child
        yield from walk(child)


def build(source):
    probe = copy.deepcopy(source)
    nodes = {node['d0']: node for node in walk(probe)}
    assert len(nodes) == 500
    # Reject the slower native-divider trial as an accidental input.
    assert sum(n.get('s') == 'Week dividers' and n.get('1') == 'Javascript'
               for n in nodes.values()) == 24
    label = nodes[83204]
    assert label['z'] == '1' and len(label['66']) == 1
    original = copy.deepcopy(label['66'])
    assert original[0]['5'] == 'Javascript'
    assert original[0]['6'] == 'Async + No main()'
    assert 'sharedLocationText' in original[0]['10']
    assert 'fetch(' in original[0]['10'] and 'sendToWidgy' in original[0]['10']
    label['66'] = [{'5': 'Custom Text', '6': 'Text', '25': 'City lookup paused'}]
    # Full export equality after restoring this field proves there are no
    # changes to navigation, grids, data sources, style or tree order.
    restored = copy.deepcopy(probe)
    next(n for n in walk(restored) if n['d0'] == 83204)['66'] = original
    assert restored == source
    assert probe['36'] == source['36']
    return probe


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--compressor', type=Path, required=True)
    args = parser.parse_args()
    source = json.loads(args.source.read_bytes())
    probe = build(source)
    args.output.mkdir(parents=True, exist_ok=True)
    document = args.output / 'candidate.json'
    document.write_text(json.dumps(probe, ensure_ascii=False, separators=(',', ':')))
    widget = args.output / 'Widgy Weather.widgy'
    with widget.open('wb') as output:
        subprocess.run([str(args.compressor.resolve()), '--deflate', '--i15', '-c', str(document)],
                       stdout=output, check=True)
    assert json.loads(zlib.decompress(widget.read_bytes(), -15)) == probe
    archive = args.output / 'Widgy Weather.zip'
    with ZipFile(archive, 'w', compression=ZIP_STORED) as output:
        output.write(widget, widget.name)
    with ZipFile(archive) as check:
        assert check.namelist() == ['Widgy Weather.widgy'] and check.testzip() is None
        assert check.read(widget.name) == widget.read_bytes()
    print('PASS: only layer 83204 source replaced; 500 objects and all 65 button actions retained; ZIP verified.')
