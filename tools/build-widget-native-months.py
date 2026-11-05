"""Replace month-browser JavaScript headings with native date sources.

Private input/output is intentionally not checked into the server repository.
The Edit Date field uses year|month|day|hour|minute components. A month
offset is paired with day=1 so a short destination month cannot overflow.
This is an export transformation, not an iOS renderer.
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


def native_month_date(offset):
    if not -12 <= offset <= 12 or not isinstance(offset, int):
        raise ValueError('Unsupported month offset')
    if offset == 0:
        return None
    return f"0|{2 if offset > 0 else 3}_{abs(offset)}|1_1|0|0"


def optimize(source):
    result = copy.deepcopy(source)
    nodes = {node['d0']: node for node in walk(result)}
    for offset in range(-12, 13):
        group = nodes[81106 + offset]
        grids = [node for node in children(group)
                 if node.get('z') == '10' and node.get('s', '').startswith('Dates · ')]
        assert len(grids) == 3
        for grid in grids:
            assert grid.get('44', {'a': [{'a': 0}]})['a'][0]['a'] == offset
        for name, fmt in [('Month', 'MMMM'), ('Year', 'yyyy')]:
            heads = [node for node in children(group) if node.get('s') == name]
            assert len(heads) == 1
            head = heads[0]
            assert head['z'] == '1'
            assert len(head['66']) == 1
            assert head['66'][0]['5'] in ['Javascript', 'Date And Time']
            head['66'] = [{'5': 'Date And Time', '6': fmt}]
            edit = native_month_date(offset)
            if edit:
                head['29'] = edit
            else:
                head.pop('29', None)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--compressor', type=Path, required=True)
    args = parser.parse_args()
    candidate = optimize(json.loads(args.source.read_bytes()))
    args.output.mkdir(parents=True, exist_ok=True)
    document = args.output / 'candidate.json'
    document.write_text(json.dumps(candidate, ensure_ascii=False, separators=(',', ':')))
    widget = args.output / 'Widgy Weather.widgy'
    with widget.open('wb') as stream:
        subprocess.run([str(args.compressor.resolve()), '--deflate', '--i15', '-c', str(document)],
                       stdout=stream, check=True)
    assert json.loads(zlib.decompress(widget.read_bytes(), -15)) == candidate
    with ZipFile(args.output / 'Widgy Weather.zip', 'w', compression=ZIP_STORED) as archive:
        archive.write(widget, widget.name)
    print('Built native month/year headings for 25 month panels; no data or navigation changes.')
