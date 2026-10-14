// Build a small, explicit, secret-free upload directory. No account/network
// operations. Run from any directory: node tools/prepare-cloud-run-map.mjs OUT.
import {readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync} from 'node:fs';
import {resolve, dirname, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {NIGHT_MAP_ASSETS} from '../lib/night-map-assets.js';

const root = fileURLToPath(new URL('../', import.meta.url));
if (!process.argv[2]) throw Error('Specify an empty output directory outside the repository');
const out = resolve(process.argv[2]);
const inside = relative(root, out);
if (!inside.startsWith('..') && !isAbsolute(inside)) throw Error('Output must be outside the repository');
if (existsSync(out) && readdirSync(out).length) throw Error('Output directory must be empty');
const files = new Set();
function visit(path) {
  if (files.has(path)) return;
  if (path.startsWith('../') || isAbsolute(path)) throw Error('Unexpected dependency outside repository');
  files.add(path);
  const source = readFileSync(resolve(root, path), 'utf8');
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(['"])(\.[^'"]+)\1/g)) {
    visit(relative(root, resolve(root, dirname(path), match[2])));
  }
}
visit('services/map-server/server.mjs');
visit('tools/build-map-cache.mjs');
files.add('package.json'); files.add('package-lock.json');
for (const [name, url] of Object.entries(NIGHT_MAP_ASSETS)) {
  // Generate this from approved sources inside the container, never upload a
  // possibly stale/locally generated cache.
  if (name === 'render-cache-r6.bin.gz') continue;
  files.add(relative(root, fileURLToPath(url)));
}
mkdirSync(out, {recursive: true});
const manifest = [];
for (const file of [...files].sort()) {
  const target = resolve(out, file);
  mkdirSync(dirname(target), {recursive: true});
  copyFileSync(resolve(root, file), target);
  const data = readFileSync(target);
  manifest.push({path: file, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex')});
}
copyFileSync(resolve(root, 'services/map-server/Dockerfile'), resolve(out, 'Dockerfile'));
const dockerfile = readFileSync(resolve(out, 'Dockerfile'));
manifest.push({path: 'Dockerfile', source: 'services/map-server/Dockerfile', bytes: dockerfile.length,
  sha256: createHash('sha256').update(dockerfile).digest('hex')});
writeFileSync(resolve(out, '.gcloudignore'), '.git\nnode_modules\n');
writeFileSync(resolve(out, '.dockerignore'), '.git\nnode_modules\n');
writeFileSync(resolve(out, 'source-manifest.json'), JSON.stringify({schema: 2, files: manifest}, null, 2) + '\n');
console.log(JSON.stringify({output: out, files: manifest.length, sourceBytes: manifest.reduce((sum, f) => sum + f.bytes, 0)}));
