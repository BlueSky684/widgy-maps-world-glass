"""Compile exact glyph ink bounds and the revision-14 glass background.

Run locally with fontTools installed. Generated JSON/SVG/PNG are committed;
no Python dependency is needed by the deployed Vercel function.
"""
import json
from pathlib import Path
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path

assets = Path(__file__).resolve().parent.parent / 'assets/weather-premium'
fonts = json.loads((assets / 'glyphs.json').read_text())
bounds = {}
for weight, font in fonts.items():
    bounds[weight] = {}
    for char, glyph in font['glyphs'].items():
        pen = BoundsPen(None)
        parse_path(glyph['path'], pen)
        bounds[weight][char] = list(pen.bounds) if pen.bounds else None
(assets / 'text-ink-bounds.json').write_text(json.dumps(bounds, separators=(',', ':')) + '\n')
chrome = (assets / 'chrome-r6.svg').read_text()
start = chrome.index('<path d="M498 280L498 460"')
end = chrome.index('<rect x="24" y="512"', start)
# Metric dividers and every current-card label now render together with data.
chrome = chrome[:start] + chrome[end:]
(assets / 'chrome-r14.svg').write_text(chrome)
print('Compiled current-card ink bounds and chrome-r14.svg')
