// Build a focused Health-source correction from the owner's latest phone export.
// The input and unencrypted output must remain outside the tracked repository.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv, createDecipheriv, createHash, randomBytes} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';
import {verificationMarkup} from './copy-verification.js';

const [input, output] = process.argv.slice(2);
assert(input && output, 'Supply the current RC1 phone export and a private output directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const privateDir = resolve(output);
assert(relative(root, privateDir).startsWith('../'));
mkdirSync(privateDir, {recursive:true, mode:0o700});
const sha = value => createHash('sha256').update(value).digest('hex');
const inputBytes = readFileSync(input);
const before = JSON.parse(inputBytes);
assert.equal(before['3'], 'Widgy Weather RC1');
const widget = structuredClone(before);
const layers = [...widgetLayers(widget)];
const layer = id => {
  const matches = layers.filter(n => n.d0 === id);
  assert.equal(matches.length, 1, `Expected one layer ${id}`);
  return matches[0];
};
const nativeSteps = {'5':'Health (Daily)', '6':'Step Count'};
assert.equal(layer(85066)['1'], nativeSteps['5']);
assert.equal(layer(85066)['2'], nativeSteps['6']);
assert.equal(layer(85037)['1'], 'Health (Daily)');
assert.equal(layer(85037)['2'], 'Active Energy Burned');
assert.equal(layer(85037)['20'], 500);
assert.deepEqual(layer(6144)['66'], [{'5':'Health (Daily)', '6':'Active Energy Burned'}]);

// Use native text sources rather than a native variable -> JS -> text chain.
// Home, Health and the weekly table now all request today's Health step count.
const modifiedTextIDs = [6141, 85002, 85003];
for (const id of modifiedTextIDs) assert.equal(layer(id)['66'][0]['5'], 'Javascript');
layer(6141)['66'] = [structuredClone(nativeSteps)];
layer(85002)['66'] = [structuredClone(nativeSteps)];
layer(85003)['66'] = structuredClone(layer(6144)['66']);

const homeRing = layer(80209);
assert.equal(homeRing['1'], 'Pedometer');
assert.equal(homeRing['2'], 'Steps');
assert.equal(homeRing['20'], 10000);
homeRing['1'] = nativeSteps['5'];
homeRing['2'] = nativeSteps['6'];

// Retain the existing guarded percentage calculation; its input changes to
// the same Health source. This does not claim atomic refreshes inside Widgy.
const stepsVariable = widget['36'].find(v => v['1'] === 'steps_today');
assert.deepEqual(stepsVariable['3']['66'], [{'5':'Pedometer', '6':'Steps'}]);
stepsVariable['3']['66'] = [structuredClone(nativeSteps)];
assert(layer(85007)['66'][0]['10'].includes('${widgy.steps_today}'));

const name = 'Widgy Weather RC1.1';
widget['3'] = name;
widget['4'] = 'RC1.1: daily Health steps shared by Home, Health and weekly activity; direct native step and active-calorie text. Phone verification pending.';

// Reverse only the intended edits and compare the full private export. This
// protects the map, credentials, navigation, styling and all unrelated data.
const reversed = structuredClone(widget);
const originalLayers = new Map([...widgetLayers(before)].map(n => [n.d0,n]));
for (const n of widgetLayers(reversed)) {
  if (modifiedTextIDs.includes(n.d0)) n['66'] = structuredClone(originalLayers.get(n.d0)['66']);
  if (n.d0 === 80209) for (const k of ['1','2']) n[k] = originalLayers.get(n.d0)[k];
}
reversed['36'].find(v => v['1'] === 'steps_today')['3']['66'] =
  structuredClone(before['36'].find(v => v['1'] === 'steps_today')['3']['66']);
for (const k of ['3','4']) reversed[k] = before[k];
assert.deepEqual(reversed, before, 'An unrelated widget field changed');

const raw = Buffer.from(JSON.stringify(widget));
assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())), widget);
const slug = 'widgy-weather-rc11';
const aadText = 'widgy-weather-rc11:v1:20261019';
const key = randomBytes(32), iv = randomBytes(12), aad = Buffer.from(aadText);
const cipher = createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(aad);
const ciphertext = Buffer.concat([cipher.update(gzipSync(raw)), cipher.final(), cipher.getAuthTag()]);
const envelope = {v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher = createDecipheriv('aes-256-gcm',key,iv);
decipher.setAAD(aad); decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
const origin = 'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
writeFileSync(resolve(privateDir,'Widgy_Weather_RC1.1.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),`${origin}/tools/${slug}-copy.html#key=${key.toString('base64url')}`,{mode:0o600});
writeFileSync(resolve(root,`tools/${slug}.enc.json`),JSON.stringify(envelope)+'\n');

let controller = readFileSync(resolve(root,'tools/widgy-weather-rc1-copy.js'),'utf8');
controller = controller.replaceAll('Widgy Weather RC1',name)
  .replaceAll('Widgy_Weather_RC1.json','Widgy_Weather_RC1.1.json')
  .replaceAll('widgy-weather-rc1:v1:20261017',aadText)
  .replaceAll('widgy-weather-rc1.enc.json',`${slug}.enc.json`);
controller = "import {installCopyVerification} from './copy-verification.js?v=1';\n" +
  controller.replace(/load\(\);\s*$/, 'installCopyVerification(() => payload);\nload();\n');
writeFileSync(resolve(root,`tools/${slug}-copy.js`),controller);
let html = readFileSync(resolve(root,'tools/widgy-weather-rc1-copy.html'),'utf8');
html = html.replaceAll('Widgy Weather RC1',name)
  .replaceAll('widgy-weather-rc1-copy.js',`${slug}-copy.js`)
  .replace('<button id="download"', verificationMarkup+'\n<button id="download"')
  .replace('מועמדת לגרסה הסופית, עם כל תיקוני העיצוב והמרווחים האחרונים ופונטים עם אפס ללא קו.',
    'גרסת בדיקה לתיקון התאמת נתוני הצעדים והקלוריות בין התצוגות. הצעדים ב־Home וב־Health מחוברים למקור היומי של הטבלה; הקלוריות ב־Health מחוברות ישירות למקור של הטבעת.')
  .replace('בדוק שהאפסים מוצגים ללא הקו ב־Home, Calendar, Weather ו־Health.',
    'פתח Health והשווה את הצעדים והקלוריות למספרים בשורה של היום בטבלה. בדוק גם שהצעדים ב־Home תואמים. שמור את RC1 להשוואה.');
writeFileSync(resolve(root,`tools/${slug}-copy.html`),html);
const manifestPath = resolve(root,'tools/public-site-files.json');
const manifest = JSON.parse(readFileSync(manifestPath,'utf8'));
for (const path of [`tools/${slug}-copy.html`,`tools/${slug}-copy.js`,`tools/${slug}.enc.json`,'tools/copy-verification.js']) {
  if (!manifest.files.includes(path)) manifest.files.push(path);
}
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const report = {name,sourceSHA256:sha(inputBytes),sha256:sha(raw),bytes:raw.length,
  directTextLayers:modifiedTextIDs,homeRingSource:'Health (Daily) / Step Count',
  percentageInputSource:'Health (Daily) / Step Count',percentageScriptRetained:true,
  stepsGoal:10000,moveGoal:500,unrelatedConfigurationIdentical:true,
  layers:layers.length,variables:widget['36'].length,encryptionRoundTripExact:true,
  jsonCopyFormattingExact:true,nativePhoneVerification:'pending'};
writeFileSync(resolve(root,'tools/widgy-weather-rc11-verification-20261019.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
