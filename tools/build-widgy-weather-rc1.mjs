// Package the current approved widget as the first release candidate.
// The widget name is the only change to its configuration.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv, createDecipheriv, createHash, randomBytes} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';

const [input, output] = process.argv.slice(2);
assert(input && output, 'Supply Google Clean Zero JSON and a private output directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const privateDir = resolve(output);
assert(relative(root, privateDir).startsWith('../'));
mkdirSync(privateDir, {recursive:true, mode:0o700});
const sha = value => createHash('sha256').update(value).digest('hex');
const beforeBytes = readFileSync(input);
assert.equal(sha(beforeBytes), 'a61d840f2d8e50efb8d80d0bfffa6439a09f900fe5ef0f405e6aa57f90700d4c');
const before = JSON.parse(beforeBytes);
const widget = structuredClone(before);
const name = 'Widgy Weather RC1';
widget['3'] = name;
const reversed = structuredClone(widget);
reversed['3'] = before['3'];
assert.deepEqual(reversed, before, 'Only the widget display name may change');
const layers = [...widgetLayers(widget)];
assert.equal(layers.length, 1204);
assert.equal(widget['36'].length, 74);
const raw = Buffer.from(JSON.stringify(widget));
assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())), widget);

const origin = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const slug = 'widgy-weather-rc1';
const aadText = 'widgy-weather-rc1:v1:20261017';
const key = randomBytes(32), iv = randomBytes(12), aad = Buffer.from(aadText);
const cipher = createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(aad);
const ciphertext = Buffer.concat([cipher.update(gzipSync(raw)), cipher.final(), cipher.getAuthTag()]);
const envelope = {v:1, iv:iv.toString('base64url'), data:ciphertext.toString('base64url'), bytes:raw.length, sha256:sha(raw)};
const decipher = createDecipheriv('aes-256-gcm', key, iv);
decipher.setAAD(aad);
decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)), decipher.final()])).equals(raw));
writeFileSync(resolve(privateDir, 'Widgy_Weather_RC1.json'), raw, {mode:0o600});
writeFileSync(resolve(privateDir, 'copy-key.txt'), key.toString('base64url'), {mode:0o600});
writeFileSync(resolve(privateDir, 'copy-url.txt'), `${origin}/tools/${slug}-copy.html#key=${key.toString('base64url')}`, {mode:0o600});
writeFileSync(resolve(root, `tools/${slug}.enc.json`), JSON.stringify(envelope)+'\n');

let controller = readFileSync(resolve(root, 'tools/widgy-weather15-google-clean-zero-copy.js'), 'utf8');
controller = controller.replaceAll('Widgy Weather 15 - Google Clean Zero', name)
  .replaceAll('Widgy_Weather_15_Google_Clean_Zero.json', 'Widgy_Weather_RC1.json')
  .replaceAll('widgy-weather15-google-clean-zero:v1:20261016', aadText)
  .replaceAll('widgy-weather15-google-clean-zero', slug);
writeFileSync(resolve(root, `tools/${slug}-copy.js`), controller);
let html = readFileSync(resolve(root, 'tools/widgy-weather15-google-clean-zero-copy.html'), 'utf8');
html = html.replaceAll('widgy-weather15-google-clean-zero', slug)
  .replaceAll('Widgy Weather 15 — Google Clean Zero', name)
  .replaceAll('Widgy Weather 15 - Google Clean Zero', name)
  .replaceAll('Widgy Plain Zero Fonts', 'Widgy Fonts')
  .replace('אפס נקי בכל ארבע הלשוניות, עם כל העיצוב והריווח המאושרים של Soft Glow 6. יש להתקין תחילה את חבילת הפונטים Widgy Fonts שנשלחה בשיחה.', 'מועמדת לגרסה הסופית, עם כל תיקוני העיצוב והמרווחים האחרונים ופונטים עם אפס ללא קו.')
  .replace('התקן את חבילת <b dir="ltr">Widgy Fonts</b> מהשיחה, ואז פתח מחדש את Widgy.', 'אם חבילת <b dir="ltr">Widgy Fonts</b> כבר מותקנת, אפשר להמשיך ישירות להעתקה. אחרת, התקן אותה תחילה מהשיחה.');
assert(!html.includes('Soft Glow') && !html.includes('Google Clean Zero'));
writeFileSync(resolve(root, `tools/${slug}-copy.html`), html);
const manifestPath = resolve(root, 'tools/public-site-files.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
for (const path of [`tools/${slug}-copy.html`, `tools/${slug}-copy.js`, `tools/${slug}.enc.json`]) {
  if (!manifest.files.includes(path)) manifest.files.push(path);
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)+'\n');
const report = {name, sourceSHA256:sha(beforeBytes), sha256:sha(raw), bytes:raw.length,
  changedWidgetFields:['3'], allDataSourcesIdentical:true, allLayerFramesIdentical:true,
  googleMapUnchanged:true, fontsUnchanged:true, layers:layers.length, variables:widget['36'].length,
  encryptionRoundTripExact:true, jsonCopyFormattingExact:true};
writeFileSync(resolve(root, 'tools/widgy-weather-rc1-verification-20261017.json'), JSON.stringify(report, null, 2)+'\n');
console.log(JSON.stringify(report));
