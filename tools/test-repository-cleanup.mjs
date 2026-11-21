import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)), output=resolve(root,'public');
const read=p=>readFileSync(resolve(root,p));
const manifest=JSON.parse(read('tools/public-site-files.json'));
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
const widget=JSON.parse(read('tools/Widgy_Home_Glass_Calendar_C16.json'));
function findLayer(nodes, id) {
 for (const node of nodes) {
  if (node.d0===id) return node;
  if (node.z==='13') {
   const found=findLayer(node['1'],id);
   if(found)return found;
  }
 }
}
const layer=findLayer(widget['1'],6170);
assert.equal(layer['1'],'Files');
assert.equal(layer['s'],'World map · map-current.png');
let widgetPaths=0;
for(const input of process.argv.slice(2))for(const m of readFileSync(input,'utf8').matchAll(/\/assets\/[A-Za-z0-9_.\/-]+\.(?:png|jpg|jpeg|svg|ttf|otf|txt)/g)){assert(served.has(m[0].slice(1)),m[0]);widgetPaths++;}
console.log(JSON.stringify({pass:true,publicFiles:served.size,publicReferences:references,widgetPaths}));
