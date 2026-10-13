import fs from 'node:fs';
import assert from 'node:assert/strict';

// Use the user's working phone export, including its corrected music sources.
const source = JSON.parse(fs.readFileSync(new URL('./source/Widgy_Music_Glass_W1_phone.json', import.meta.url)));
const widget = structuredClone(source);
const layers = widget['1'];
const artistIndex = layers.findIndex(layer => layer.d0 === 17004);
const artist = layers[artistIndex];
assert.deepEqual(artist['66'], [{5:'Music Player', 6:'Artist'}]);
assert.equal(layers.find(layer => layer.d0 === 17002)['1'], 'Music Player - Album Art');

const scalar = value => ({b:0, a:[{a:Math.round(value * 1e6) / 1e6, b:1126, c:0, d:1126}]});
const album = structuredClone(artist);
album.d0 = Math.max(widget.a2 || 0, ...layers.map(layer => layer.d0 + 1));
album.s = 'Album title · Native Now Playing';
album['66'] = [{5:'Music Player', 6:'Album'}];
// Same x/width/font as Artist; a shorter native line box makes this secondary.
// Base artwork coordinates: x314, y325, width174, height28 (530px square).
album.c = scalar(325 * 1600 / 530);
album.e = scalar(28 * 1600 / 530);
album.f = artist.f.replace(/-\d+$/, '-80');
layers.splice(artistIndex + 1, 0, album);
widget.a2 = album.d0 + 1;
widget['3'] = 'Widgy Music Glass W2';
widget['4'] = 'Music Glass W2 — adds native Music Player album title below the artist, in smaller muted text. Built from the working phone export dated 2026-10-13, preserving all eight existing layers and their corrected music sources. Same small size, artwork, fonts and glass design. Playback controls, elapsed time and progress remain unconnected. New album title source and text fitting require phone validation.';

// Preserve every existing layer exactly, including frame, source and artwork.
assert.deepEqual(layers.filter(layer => layer.d0 !== album.d0), source['1']);
assert.equal(new Set(layers.map(layer => layer.d0)).size, 9);
assert.equal(widget['6'], 2);
assert.equal(layers.length, source['1'].length + 1);
assert.equal(album.b.a[0].a, artist.b.a[0].a);
assert.equal(album.d.a[0].a, artist.d.a[0].a);
assert(325 >= (artist.c.a[0].a + artist.e.a[0].a) * 530 / 1600);
assert(325 + 28 < 371); // Clear of the playback panel.

const output = new URL('../Widgy_Music_Glass_W2.json', import.meta.url);
fs.writeFileSync(output, JSON.stringify(widget));
console.log(JSON.stringify({name:widget['3'], layers:layers.length, bytes:fs.statSync(output).size, existingLayersPreserved:true}));
