import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)), output=resolve(root,'public');
const read=p=>readFileSync(resolve(root,p));
const manifest=JSON.parse(read('tools/public-site-files.json'));
const cleanup=JSON.parse(read('docs/release-100-cleanup.json'));
const original=p=>execFileSync('git',['show',`${cleanup.baseCommit}:${p}`],{cwd:root,maxBuffer:32*1024*1024});
const walk=d=>readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(resolve(d,e.name)):[relative(output,resolve(d,e.name))]);
assert.deepEqual(walk(output).sort(),[...manifest.files].sort());
const served=new Set(manifest.files); let references=0;
for(const p of manifest.files){
 assert(readFileSync(resolve(output,p)).equals(read(p)),p);
 if(!/\.(html|css|js|mjs|json)$/.test(p))continue;
 const text=read(p).toString();
 const refs=[...text.matchAll(/["'`]((?:\.{1,2}\/|\/assets\/)[^\s"'`<>]+\.(?:html|css|js|mjs|json|png|jpg|jpeg|svg|ttf|otf|txt)(?:\?[^"'`<>\s]*)?)["'`]/g)].map(m=>m[1]);
 refs.push(...[...text.matchAll(/\/assets\/[A-Za-z0-9_.\/-]+\.(?:png|jpg|jpeg|svg|ttf|otf|txt)/g)].map(m=>m[0]));
 for(const ref of refs){const path=ref.split('?')[0];const target=path.startsWith('/')?path.slice(1):relative(root,resolve(root,dirname(p),path));assert(served.has(target),`${p}: ${target}`);references++;}
}
const retired=['home-map','marker','night-map','solar-mask','widgy-live-map','world-map'].map(n=>'api/'+n+'.js');
for(const path of retired)assert(!existsSync(resolve(root,path)),path);
assert(read('lib/cloud-night-handler.js').equals(original('api/night-map.js')));
assert(read('services/map-server/server.mjs').equals(Buffer.from(original('services/map-server/server.mjs').toString().replace('../..about:blank.js','../../lib/cloud-night-handler.js'))));
let protectedFiles=0;
for(const p of execFileSync('git',['ls-tree','-r','--name-only',cleanup.baseCommit,'api','lib','services','assets/earth'],{cwd:root,encoding:'utf8'}).trim().split('\n')){
 if(cleanup.removedFiles.includes(p)||retired.includes(p)||p==='services/map-server/server.mjs'||p==='api/fetch-probe.js')continue;
 assert(read(p).equals(original(p)),`Active runtime changed: ${p}`);protectedFiles++;
}
const router=read('api/fetch-probe.js').toString();
const oldRouter=original('api/fetch-probe.js').toString();
assert.equal(router.slice(router.indexOf("  if (url.searchParams.get('location_admin')")),oldRouter.slice(oldRouter.indexOf("  if (url.searchParams.get('location_admin')")));
assert(!router.includes('map-stability'));
for(const p of cleanup.removedFiles)assert(!existsSync(resolve(root,p)),p);
let widgetPaths=0;
for(const input of process.argv.slice(2))for(const m of readFileSync(input,'utf8').matchAll(/\/assets\/[A-Za-z0-9_.\/-]+\.(?:png|jpg|jpeg|svg|ttf|otf|txt)/g)){assert(served.has(m[0].slice(1)),m[0]);widgetPaths++;}
console.log(JSON.stringify({pass:true,publicFiles:served.size,publicReferences:references,removedFiles:cleanup.removedFiles.length,protectedFiles,widgetPaths}));
