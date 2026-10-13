import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url);
const source = JSON.parse(fs.readFileSync(new URL('tools/Widgy_Music_Glass_W2.json', root)));
const widget = structuredClone(source);
const originalSvg = fs.readFileSync(new URL('assets/music-glass/chrome-w1.svg', root), 'utf8');
const circles = /<circle cx="265" cy="459"[^>]*\/>/g;
assert.equal([...originalSvg.matchAll(circles)].length, 2);
const svg = originalSvg.replace(circles, '');
// Render the code-owned SVG background after removing the two Play bezel nodes.
const png = await sharp(Buffer.from(svg)).png({palette:true, colours:256, dither:0, compressionLevel:9}).toBuffer();
fs.writeFileSync(new URL('assets/music-glass/chrome-w3.svg', root), svg);
fs.writeFileSync(new URL('assets/music-glass/chrome-w3.png', root), png);
const background = widget['1'].find(layer => layer.d0 === 17008);
background['2'] = 'data:image/png;base64,' + png.toString('base64');
widget['3'] = 'Widgy Music Glass W3';
widget['4'] = 'Music Glass W3 — removes both circular Play bezel outlines and their fill. The green Play symbol retains its W2 size, position and color. Album title, artist, song, native album artwork, widget size and all other layers are preserved. Playback actions and live progress are not yet connected.';

assert.deepEqual(widget['1'].filter(layer => layer.d0 !== 17008), source['1'].filter(layer => layer.d0 !== 17008));
assert.deepEqual({...background, 2:null}, {...source['1'].find(layer => layer.d0 === 17008), 2:null});
assert.equal(widget['1'].length, 9);
assert.equal(widget['6'], source['6']);
const output = JSON.stringify(widget);
fs.writeFileSync(new URL('tools/Widgy_Music_Glass_W3.json', root), output);
console.log(JSON.stringify({name:widget['3'], layers:widget['1'].length, bytes:Buffer.byteLength(output), backgroundBytes:png.length, playBezelCirclesRemoved:2}));
