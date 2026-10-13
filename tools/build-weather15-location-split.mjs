// Usage: node tools/build-weather15-location-split.mjs <private-export.json>
//        <private-output-dir-outside-repo>
// Only the encrypted envelope belongs in git/public. The key and plaintext do not.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {splitWeather15,widgetLayers} from './weather15-location-split.js';

const [input,output] = process.argv.slice(2);
assert(input && output, 'Supply an input export and private output directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const privateDir = resolve(output);
assert(relative(root, privateDir).startsWith('..'), 'Keep private outputs outside this repository');
const source = JSON.parse(readFileSync(input, 'utf8'));
const widget = splitWeather15(source);
const raw = Buffer.from(JSON.stringify(widget));
const key = randomBytes(32), iv = randomBytes(12);
const aad = Buffer.from('widgy-weather15-location-split:v1:20261013');
const cipher = createCipheriv('aes-256-gcm',key,iv); cipher.setAAD(aad);
const ciphertext = Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope = {v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')};
const decipher = createDecipheriv('aes-256-gcm',key,iv); decipher.setAAD(aad); decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
mkdirSync(privateDir,{recursive:true,mode:0o700});
writeFileSync(resolve(privateDir,'Widgy_Weather_15.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
const copyURL = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/tools/widgy-weather15-location-split-copy.html#key='+key.toString('base64url');
writeFileSync(resolve(privateDir,'copy-url.txt'),copyURL,{mode:0o600});
writeFileSync(new URL('./widgy-weather15-location-split.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
console.log(JSON.stringify({bytes:raw.length,sha256:envelope.sha256,layers:[...widgetLayers(widget)].length,variables:widget['36'].length,encrypted:true}));
