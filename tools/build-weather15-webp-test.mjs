// Build a private, complete Home Start export with one explicit codec opt-in.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes, createCipheriv, createDecipheriv, createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';

const [input, output] = process.argv.slice(2);
assert(input && output, 'Supply private Home Start export and private output directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const privateDir = resolve(output);
assert(relative(root, privateDir).startsWith('../'), 'Private exports must stay outside the repository');
const sourceBytes = readFileSync(input), before = JSON.parse(sourceBytes);
assert.equal(before['3'], 'Widgy Weather 15 - Home Start');
const layers = [...widgetLayers(before)];
assert.equal(layers.length, 1204); assert.equal(before['36'].length, 74);
assert.deepEqual(before['1'].filter(n => n.a !== false).map(n => n.d0), [83010,245]);
const map = layers.find(n => n.d0 === 6170);
assert(map?.['1'] === 'Web URL' && map['2'] === '${widgy.map_request}');
const widget = structuredClone(before);
const request = widget['36'].find(v => v['1'] === 'map_request');
const parts = request?.['3']?.['66'];
assert(parts?.length === 1 && parts[0]['5'] === 'Custom Text');
const original = parts[0]['25'], url = new URL(original);
const origin = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
assert.equal(url.origin, origin); assert.equal(url.pathname, '/api/night-map');
assert.equal(url.searchParams.get('width'), '3306');
assert.equal(url.searchParams.get('shared_location'), '1');
assert.equal(url.searchParams.get('lat'), '${widgy.map_latitude_max5}');
assert.equal(url.searchParams.get('lon'), '${widgy.map_longitude_max5}');
assert.equal(url.searchParams.get('t'), '${widgy.calendar_refresh_minute}');
assert(!url.searchParams.has('format') && !url.searchParams.has('layer') && !url.searchParams.has('at') && !url.searchParams.has('city_text'));
// Preserve literal substitution tokens, parameter ordering and every credential.
parts[0]['25'] = original + '&format=webp-exact-v1';
widget['3'] = 'Widgy Weather 15 - WebP Test';
const restored = structuredClone(widget);
restored['3'] = before['3'];
restored['36'].find(v => v['1'] === 'map_request')['3']['66'][0]['25'] = original;
assert.deepEqual(restored, before, 'Only the name and map codec opt-in may change');
const raw = Buffer.from(JSON.stringify(widget));
assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())), widget);
const key = randomBytes(32), iv = randomBytes(12);
const aad = Buffer.from('widgy-weather15-webp-test:v1:20261014');
const cipher = createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(aad);
const ciphertext = Buffer.concat([cipher.update(gzipSync(raw)), cipher.final(), cipher.getAuthTag()]);
const envelope = {v:1, iv:iv.toString('base64url'), data:ciphertext.toString('base64url'), bytes:raw.length, sha256:createHash('sha256').update(raw).digest('hex')};
const decipher = createDecipheriv('aes-256-gcm', key, iv); decipher.setAAD(aad); decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)), decipher.final()])).equals(raw));
mkdirSync(privateDir, {recursive:true, mode:0o700});
writeFileSync(resolve(privateDir, 'Widgy_Weather_15_WebP_Test.json'), raw, {mode:0o600});
writeFileSync(resolve(privateDir, 'copy-key.txt'), key.toString('base64url'), {mode:0o600});
writeFileSync(resolve(privateDir, 'copy-url.txt'), origin+'/tools/widgy-weather15-webp-test-copy.html#key='+key.toString('base64url'), {mode:0o600});
writeFileSync(new URL('./widgy-weather15-webp-test.enc.json', import.meta.url), JSON.stringify(envelope)+'\n');
const report = {sourceSha256:createHash('sha256').update(sourceBytes).digest('hex'), layers:1204, variables:74,
  changes:['Identifying name: WebP Test','Map URL: append format=webp-exact-v1'],
  allOtherFieldsIdentical:true, encryptionRoundTrip:true, bytes:raw.length, sha256:envelope.sha256,
  nativeLoadVerified:false};
writeFileSync(resolve(privateDir, 'verification.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
