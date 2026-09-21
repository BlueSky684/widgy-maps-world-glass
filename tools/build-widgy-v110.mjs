import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {greetingScript, dayPercentScript} from './widgy-time-logic.mjs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const write = (name, value) => writeFileSync(new URL(name, import.meta.url), value);
export const ids = {
  greeting: '259F8CDD-8233-49B7-98CE-B32109559967',
  progress: 'B7E6245D-30B9-40BA-A78F-E687FF65F3DD',
};

export function allNodes(widget) {
  const result = [];
  function visit(node) {
    result.push(node);
    if (node.z === '13') (node['1'] ?? []).forEach(visit);
  }
  widget['1'].forEach(visit);
  return result;
}

// A native export is mandatory: never invent the Javascript storage key.
export function findNativeScriptEntry(document) {
  const candidates = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (!Array.isArray(node) && node['5'] === 'Javascript') {
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && /(?:function\s+main\s*\(|(?:var|let|const)\s+main\s*=)/.test(value)) {
          candidates.push({entry: structuredClone(node), codeKey: key});
        }
      }
    }
    Object.values(node).forEach(visit);
  }
  visit(document);
  assert(candidates.length > 0, 'A native Widgy export containing a synchronous Javascript main() data source is required.');
  assert(!/Async/.test(candidates[0].entry['6'] ?? ''), 'Use synchronous Javascript.');
  return candidates[0];
}

export function buildWidget(before, native) {
  const data = structuredClone(before);
  const layers = data['1'][0]['1'];
  let nextId = data.a2;
  const originalGreeting = structuredClone(layers.find(n => n.d0 === 6102));
  const originalFill = structuredClone(layers.find(n => n.d0 === 6150));
  const track = layers.find(n => n.d0 === 6151);
  const percentage = layers.find(n => n.d0 === 6123);
  assert(originalGreeting && originalFill && track && percentage);

  function variable(name, id, type, script) {
    const text = structuredClone(before['36'][0]['3']);
    const entry = structuredClone(native.entry);
    entry[native.codeKey] = script;
    text['66'] = [entry];
    text.s = `Variable: ${name}`;
    return {'0': id, '1': name, '2': type, '3': text};
  }
  data['36'].push(variable('day_greeting', ids.greeting, 0, greetingScript));
  data['36'].push(variable('day_progress', ids.progress, 2, dayPercentScript));

  const greetings = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].map((word, index) => {
    const node = structuredClone(originalGreeting);
    node.d0 = index === 0 ? 6102 : nextId++;
    node.s = `Greeting Lime · ${word}`;
    node['66'] = [{'5': 'Custom Text', '6': 'Text', '25': word}];
    node.o1 = {'0': ids.greeting, '1': 0, '2': word};
    return node;
  });
  layers.splice(layers.findIndex(n => n.d0 === 6102), 1, ...greetings);
  percentage['66'] = [{'5': 'Custom Text', '6': 'Text', '25': '${widgy.day_progress}%'}];

  // Native, solid overlapping prefixes avoid visible joins in the thin bar.
  // The longest enabled prefix equals the same integer shown in the label.
  const fills = Array.from({length: 100}, (_, index) => {
    const percent = 100 - index;
    const node = structuredClone(originalFill);
    node.d0 = percent === 100 ? 6150 : nextId++;
    node.s = `Day Progress Fill · ${percent}%`;
    node.d.a[0].a = track.d.a[0].a * percent / 100;
    node.o1 = {'0': ids.progress, '1': 5, '2': String(percent)};
    return node;
  });
  layers.splice(layers.findIndex(n => n.d0 === 6150), 1, ...fills);
  data.a2 = nextId;
  data['3'] = 'Widgy Home v110 - Dynamic Greeting and Day Progress';
  data['4'] = 'Local-time greeting: MORNING 05:00–11:59, AFTERNOON 12:00–16:59, EVENING 17:00–21:59, NIGHT 22:00–04:59. Day progress measures the local calendar day from midnight to midnight in whole percentages, shared by the label and native lime fill. Updates follow Widgy widget refreshes. Sunrise and sunset remain separate information. Weather artwork, conditions and KM/H wind threshold are preserved from v109. Javascript source encoding must be taken from a native device export.';

  const nodes = allNodes(data);
  assert.equal(new Set(nodes.map(n => n.d0)).size, nodes.length);
  assert(data.a2 > Math.max(...nodes.map(n => n.d0)));
  // Only the three requested original layers and new layers/variables may differ.
  const changed = new Set([6102, 6123, 6150]);
  const originals = allNodes(before).filter(n => n.z !== '13' && !changed.has(n.d0));
  for (const node of originals) assert.deepEqual(nodes.find(n => n.d0 === node.d0), node);
  const restored = structuredClone(data);
  const originalIds = new Set(allNodes(before).map(n => n.d0));
  restored['1'][0]['1'] = restored['1'][0]['1'].filter(n => originalIds.has(n.d0)).map(n => changed.has(n.d0) ? structuredClone(before['1'][0]['1'].find(o => o.d0 === n.d0)) : n);
  for (const key of ['36', '3', '4', 'a2']) restored[key] = before[key];
  assert.deepEqual(restored, before);
  return data;
}

function main() {
  const exportPath = process.argv[2];
  assert(exportPath, 'Usage: node tools/build-widgy-v110.mjs <native-export.json>');
  const native = findNativeScriptEntry(JSON.parse(readFileSync(exportPath, 'utf8')));
  const before = JSON.parse(read('widgy-v109.json'));
  const data = buildWidget(before, native);
  const payload = JSON.stringify(data);
  const packed = gzipSync(Buffer.from(payload)).toString('base64');
  const hash = createHash('sha256').update(payload).digest('hex');
  const html = read('widgy-v109.html').replaceAll('v109', 'v110')
    .replace('האייקונים המקוריים עם תנאי רוח מ־30 קמ״ש ומעלה.', 'ברכה לפי השעה והתקדמות היום מחצות עד חצות.')
    .replace('יש להשאיר את יחידות מהירות הרוח ב־Widgy על KM/H.', 'מעתיקים ומייבאים ל־Widgy. העדכון מתבצע עם רענון הווידג׳ט.')
    .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/, `const packed=['${packed}'].join('');`)
    .replace(/const expectedHash='[^']+';/, `const expectedHash='${hash}';`)
    .replace(/packed.length!==\d+/, `packed.length!==${packed.length}`)
    .replace(/text.length!==\d+/, `text.length!==${payload.length}`);
  assert.equal(gunzipSync(Buffer.from(html.match(/const packed=\['([^']+)'\]/)[1], 'base64')).toString(), payload);
  write('widgy-v110.json', payload);
  write('widgy-v110.html', html);
  write('widgy-native-javascript-source.json', JSON.stringify(native, null, 2) + '\n');
  write('widgy-v110-integration.json', JSON.stringify({
    status: 'ready-for-device-verification', nativeJavascriptCodeKey: native.codeKey,
    greetingHours: {MORNING: [5, 12], AFTERNOON: [12, 17], EVENING: [17, 22], NIGHT: [22, 5]},
    progress: 'floor(local wall-clock seconds / 86400 * 100)',
    originalWeatherAndLayoutPreserved: true, refresh: 'Widgy widget refresh cadence',
    deviceVerified: false, payloadBytes: Buffer.byteLength(payload), sha256: hash,
  }, null, 2) + '\n');
  console.log(JSON.stringify({bytes: Buffer.byteLength(payload), sha256: hash}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
