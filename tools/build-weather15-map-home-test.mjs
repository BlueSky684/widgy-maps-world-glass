// A controlled removal of Home content from the owner's known PNG baseline.
// Private exports/keys stay outside the repository; only ciphertext is public.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes, createCipheriv, createDecipheriv, createHash} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';

const [input, output] = process.argv.slice(2);
assert(input && output, 'Supply the previous private export and private output directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const privateDir = resolve(output);
assert(relative(root, privateDir).startsWith('../'), 'Private exports must stay outside the repository');
const sha = value => createHash('sha256').update(value).digest('hex');
const before = JSON.parse(readFileSync(input));
// The phone was reverted to PNG on October 14. Recover that exact Home Start
// baseline from the locally available WebP trial, without reserializing its URL.
if (before['3'] === 'Widgy Weather 15 - WebP Test') {
  const text = before['36'].find(v => v['1'] === 'map_request')['3']['66'][0];
  assert(text['25'].endsWith('&format=webp-exact-v1'));
  text['25'] = text['25'].slice(0, -'&format=webp-exact-v1'.length);
  before['3'] = 'Widgy Weather 15 - Home Start';
}
assert.equal(sha(JSON.stringify(before)), 'cf0a272cf7b1477bbf322f0ae4c49a3bdbe6ec05c351458d317c63841725f137');
const oldLayers = [...widgetLayers(before)];
assert.equal(oldLayers.length, 1204);
assert.equal(before['36'].length, 74);
const widget = structuredClone(before);
const group = (w, id) => w['1'].find(n => n.d0 === id);
const home = group(widget, 245), shared = group(widget, 83010), calendar = group(widget, 247);
const homeKeep = new Set([5021,5022,5023,5024,5012,5013,80310,5015,5016,6170]);
const sharedNavigation = new Set([5017,5018,6195,5020]);
const dateIds = [6190,6103,6104,80312,80313,6105];
assert.deepEqual(shared['1'].map(n => n.d0), [...dateIds, ...sharedNavigation]);
assert.deepEqual([...homeKeep].sort((a,b)=>a-b), home['1'].filter(n=>homeKeep.has(n.d0)).map(n=>n.d0).sort((a,b)=>a-b));
const removed = home['1'].filter(n => !homeKeep.has(n.d0));
home['1'] = home['1'].filter(n => homeKeep.has(n.d0));
// Keep the original date group's frame and all its child fields intact, but
// place it inside Calendar. Calendar's 1600x1600 parent matches the root canvas.
const calendarDate = structuredClone(shared);
calendarDate.d0 = Math.max(...oldLayers.map(n => n.d0)) + 1;
calendarDate.s = 'Calendar date · retained from shared header';
calendarDate['1'] = calendarDate['1'].filter(n => !sharedNavigation.has(n.d0));
shared['1'] = shared['1'].filter(n => sharedNavigation.has(n.d0));
shared.s = 'Shared Home and Calendar · inactive navigation';
calendar['1'].unshift(calendarDate);

// Widgy references variables by both UUID (native bindings) and name (text/JS).
// Only delete dependencies made unreachable by this change, preserving existing
// unrelated unused variables to keep this comparison narrowly scoped.
const variables = before['36'];
function references(value) {
  const text = JSON.stringify(value);
  return new Set(variables.filter(v => text.includes(v['0']) ||
    new RegExp('(?<![A-Za-z_0-9])'+v['1']+'(?![A-Za-z_0-9])').test(text)).map(v => v['1']));
}
function reachable(w) {
  const body = {...w}; delete body['36'];
  const names = references(body);
  let grew = true;
  while (grew) {
    grew = false;
    for (const v of variables) if (names.has(v['1'])) {
      for (const name of references(v)) if (!names.has(name)) { names.add(name); grew = true; }
    }
  }
  return names;
}
const prior = reachable(before), current = reachable(widget);
const removedVariables = variables.filter(v => prior.has(v['1']) && !current.has(v['1']));
assert.deepEqual(removedVariables.map(v => v['1']), ['wx_status']);
widget['36'] = variables.filter(v => !removedVariables.includes(v)).map(v => structuredClone(v));
widget['3'] = 'Widgy Weather 15 - Map Home Test';
widget['4'] = 'Diagnostic: Home contains only the original live PNG map with city/day-night and navigation. Other tabs retained. Add native Memory Used manually.';
const layers = [...widgetLayers(widget)];
const layerById = id => layers.find(n => n.d0 === id);
assert.equal(new Set(layers.map(n => n.d0)).size, layers.length);
assert.deepEqual(group(widget,246), group(before,246));
assert.deepEqual(group(widget,195), group(before,195));
const restoredCalendar = structuredClone(calendar); restoredCalendar['1'].shift();
assert.deepEqual(restoredCalendar, group(before,247));
assert.deepEqual(calendarDate['1'], group(before,83010)['1'].slice(0,6));
for (const n of oldLayers) if (homeKeep.has(n.d0) || sharedNavigation.has(n.d0)) assert.deepEqual(layerById(n.d0), n);
const removedLayers = removed.flatMap(n => [...widgetLayers(n)]);
for (const n of removedLayers) assert(!layerById(n.d0), `Removed layer ${n.d0} still present`);
const map = layerById(6170);
assert.equal(map['1'], 'Web URL'); assert.equal(map['2'], '${widgy.map_request}');
const request = widget['36'].find(v => v['1']==='map_request');
assert.deepEqual(request, before['36'].find(v => v['1']==='map_request'));
const url = new URL(request['3']['66'][0]['25']);
assert.equal(url.searchParams.get('width'),'3306');
assert(!url.searchParams.has('format') && !url.searchParams.has('at') && !url.searchParams.has('layer'));
assert.equal(url.searchParams.get('lat'),'${widgy.map_latitude_max5}');
assert.equal(url.searchParams.get('lon'),'${widgy.map_longitude_max5}');
assert.equal(url.searchParams.get('t'),'${widgy.calendar_refresh_minute}');
assert.deepEqual(widget['1'].filter(n=>n.a!==false).map(n=>n.d0),[83010,245]);
const navBefore=oldLayers.filter(n=>n.z==='11' && /^(HOME|CALENDAR|WEATHER|HEALTH) Tap$/.test(n.s));
assert.equal(navBefore.length,16);
for (const n of navBefore) assert.deepEqual(layerById(n.d0),n);
// Every navigation target still exists, including Calendar's month controls.
for (const n of layers) if (typeof n['1a']==='string' && n['1a'].startsWith('button_')) {
  for (const id of n['1a'].slice(7).split(/[,-]/).filter(Boolean)) assert(layerById(Number(id)), `Missing navigation target ${id}`);
}
for (const v of removedVariables) {
  const remaining = JSON.stringify(widget);
  assert(!remaining.includes(v['0']) && !remaining.includes('${widgy.'+v['1']+'}'));
}
const originalMeta={...before}, newMeta={...widget};
for (const key of ['1','3','4','36']) { delete originalMeta[key]; delete newMeta[key]; }
assert.deepEqual(newMeta,originalMeta);
const raw=Buffer.from(JSON.stringify(widget));
assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32), iv=randomBytes(12), aad=Buffer.from('widgy-weather15-map-home-test:v1:20261014');
const cipher=createCipheriv('aes-256-gcm',key,iv); cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv); decipher.setAAD(aad); decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
mkdirSync(privateDir,{recursive:true,mode:0o700});
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Map_Home_Test.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-map-home-test-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-map-home-test.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={baseline:'Home Start PNG, reconstructed and exact SHA-256 verified',sourceSha256:sha(JSON.stringify(before)),
  layersBefore:oldLayers.length,layersAfter:layers.length,homeChildrenBefore:42,homeChildrenAfter:home['1'].length,
  removedLayerCount:removedLayers.length,removedLayers:removedLayers.map(n=>({id:n.d0,name:n.s})),
  removedVariables:removedVariables.map(v=>v['1']),variablesBefore:74,variablesAfter:widget['36'].length,
  preexistingUnusedVariablesPreserved:[...variables.filter(v=>!prior.has(v['1'])).map(v=>v['1'])],
  calendarOriginalChildrenIdentical:true,calendarDateRetainedWithOriginalFrame:true,weatherAndHealthIdentical:true,
  navigationActionsIdentical:true,mapLayerAndRequestIdentical:true,mapFormat:'PNG',mapWidth:3306,
  debugCounterIncluded:false,nativeLoadVerified:false,encryptionRoundTrip:true,bytes:raw.length,sha256:sha(raw)};
writeFileSync(new URL('./weather15-map-home-test-verification-20261014.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
writeFileSync(resolve(privateDir,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,removedLayers:undefined}));
