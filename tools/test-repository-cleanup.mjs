import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url)),output=resolve(root,'public');
const read=p=>readFileSync(resolve(root,p));
const manifest=JSON.parse(read('tools/public-site-files.json'));
const cleanup=JSON.parse(read('tools/performance/repository-cleanup-20261009-manifest.json'));
const original=p=>execFileSync('git',['show',`${cleanup.baseCommit}:${p}`],{cwd:root,maxBuffer:16*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(d,e.name)):[relative(output,resolve(d,e.name))]);

assert.deepEqual(walk(output).sort(),[...manifest.files].sort(),'Only supported static files are published');
for(const p of manifest.files)assert(readFileSync(resolve(output,p)).equals(read(p)),p);
const served=new Set(manifest.files);
let references=0;
for(const p of manifest.files){
  if(!/\.(html|css|js|mjs|json)$/.test(p)||p.endsWith('.enc.json'))continue;
  const text=read(p).toString();
  const refs=[...text.matchAll(/["'`]((?:\.{1,2}\/|\/assets\/)[^\s"'`<>]+\.(?:html|css|js|mjs|json|png|jpg|jpeg|svg|ttf|otf|txt)(?:\?[^"'`<>\s]*)?)["'`]/g)].map(m=>m[1]);
  refs.push(...[...text.matchAll(/\/assets\/[A-Za-z0-9_.\/-]+\.(?:png|jpg|jpeg|svg|ttf|otf|txt)/g)].map(m=>m[0]));
  for(const ref of refs){
    const path=ref.split('?')[0];
    const target=path.startsWith('/')?path.slice(1):relative(root,resolve(root,dirname(p),path));
    assert(served.has(target),`${p} references missing public dependency ${target}`);references++;
  }
}
for(const p of manifest.files.filter(p=>p.endsWith('.enc.json')&&!p.startsWith('tools/widgy-weather-premium-'))){
  assert(read(p).equals(original(p)),`Rollback/current payload changed: ${p}`);
  const e=JSON.parse(read(p));assert.equal(e.v,1);assert(e.sha256&&e.bytes&&e.data&&e.iv);
}
// The runtime, contracts, fonts and approved masters must remain byte-identical.
const active=execFileSync('git',['ls-tree','-r','--name-only',cleanup.baseCommit,'api','lib','assets/earth','assets/fonts','assets/home-glass','assets/calendar-glass'],{cwd:root,encoding:'utf8'}).trim().split('\n');
for(const p of active.filter(p=>p!=='api/fetch-probe.js'))assert(read(p).equals(original(p)),`Runtime/design dependency changed: ${p}`);
const config=JSON.parse(read('vercel.json')),oldConfig=JSON.parse(original('vercel.json'));
const {['api/fetch-probe.js']:weatherFunction,...priorFunctions}=config.functions;
assert.deepEqual(priorFunctions,oldConfig.functions);
assert.deepEqual(weatherFunction,{maxDuration:10,includeFiles:'assets/weather-premium/{glyphs.json,icons.json}'});
assert.deepEqual(config.rewrites,[{source:'/api/weather-panel',destination:'/api/fetch-probe?weather_panel=1'}]);
assert.equal(readdirSync(resolve(root,'api')).filter(p=>p.endsWith('.js')).length,12);
assert.deepEqual(config.regions,oldConfig.regions);
assert.deepEqual(config.headers,oldConfig.headers.filter(h=>h.source!=='/tools/widgy-map-source.json'));
assert.equal(config.outputDirectory,'public');assert.equal(config.buildCommand,'npm run build');
assert.equal(cleanup.removedFiles.length,cleanup.removedFileCount);
for(const file of cleanup.removedFiles){assert(!existsSync(resolve(root,file.path)));assert.equal(sha(original(file.path)),file.sha256);}
// Optional private inputs validate installed widget paths without printing tokens.
let widgetPaths=0;
for(const input of process.argv.slice(2)){
  const text=readFileSync(input,'utf8');JSON.parse(text);
  for(const m of text.matchAll(/\/assets\/[A-Za-z0-9_.\/-]+\.(?:png|jpg|jpeg|svg|ttf|otf|txt)/g)){
    assert(served.has(m[0].slice(1)),`Installed widget asset is not public: ${m[0]}`);widgetPaths++;
  }
}
console.log(JSON.stringify({pass:true,publicFiles:served.size,publicReferences:references,removedFiles:cleanup.removedFileCount,protectedRuntimeFiles:active.length-1,privateWidgetAssetReferences:widgetPaths,encryptedPayloadsUnchanged:5}));
