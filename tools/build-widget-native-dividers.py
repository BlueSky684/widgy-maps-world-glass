"""A/B candidate: use the current month's native divider shapes in all panels.

The private Widgy export is an input, never a repository fixture. This removes
24 JavaScript image sources at the cost of 48 additional conditional leaves.
No navigation, calendar sources, headings, or refresh settings are edited.
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


def optimize(source):
    result = copy.deepcopy(source)
    nodes = {node['d0']: node for node in walk(result)}
    templates = {weeks: nodes[identifier] for weeks, identifier in
                 [(4, 80390), (5, 80395), (6, 80401)]}
    classifier = next(v['0'] for v in result['36']
                      if v['1'] == 'calendar_month_layouts')
    for weeks, template in templates.items():
        assert template['z'] == '2'
        assert template['o1'] == {'0': classifier, '1': 2, '2': f'M{weeks}'}
    extra_id = max(nodes) + 1
    for offset in range(-12, 13):
        if offset == 0:
            continue
        panel = nodes[81106 + offset]
        matches = [n for n in children(panel) if n.get('s') == 'Week dividers']
        assert len(matches) == 1
        old = matches[0]
        assert old['z'] == '5' and old['1'] == 'Javascript'
        assert '${widgy.calendar_month_layouts}' in old['22']
        position = panel['1'].index(old)
        replacements = []
        for weeks in (4, 5, 6):
            layer = copy.deepcopy(templates[weeks])
            layer['d0'] = old['d0'] if weeks == 4 else extra_id
            if weeks != 4:
                extra_id += 1
            layer['o1']['2'] = chr(77 + offset) + str(weeks)
            replacements.append(layer)
        panel['1'][position:position + 1] = replacements
    # Keep the export's next-layer-ID allocator beyond every added layer, so
    # subsequent edits in Widgy cannot reuse a divider's identity.
    assert isinstance(result['a2'], int)
    result['a2'] = max(result['a2'], extra_id)
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
    print('Built divider trial: 24 JS images removed, 48 native leaves added.')
