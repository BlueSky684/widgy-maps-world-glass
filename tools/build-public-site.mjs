// Only the supported browser entry points and their dependencies are public.
// API code and map assets remain at the project root for Vercel's function bundler.
import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync,unlinkSync,readdirSync,lstatSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=resolve(root,'public');
const manifest=JSON.parse(readFileSync(new URL('./public-site-files.json',import.meta.url)));
const marker=resolve(root,'work/public-build-files.json');
function safe(base,path){
  assert(typeof path==='string' && /^(tools|assets)\//.test(path));
  const full=resolve(base,path);
  assert(relative(base,full)===path && !path.includes('..'));
  return full;
}
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  assert(!e.isSymbolicLink(),'Unexpected symlink in generated output');
  const path=resolve(dir,e.name);return e.isDirectory()?walk(path):[relative(output,path)];
});}
assert.equal(new Set(manifest.files).size,manifest.files.length);
for(const path of manifest.files){
  assert(lstatSync(safe(root,path)).isFile(),`Missing public dependency: ${path}`);
}
// Never erase an arbitrary directory: only outputs explicitly owned by an earlier build.
if(existsSync(output)){
  assert(existsSync(marker),'Refusing to overwrite an unrecognized public directory');
  const previous=JSON.parse(readFileSync(marker));
  for(const path of walk(output))assert(previous.includes(path),`Unowned output: ${path}`);
  for(const path of previous){const full=safe(output,path);if(existsSync(full))unlinkSync(full);}
}
mkdirSync(output,{recursive:true});
let bytes=0;
for(const path of manifest.files){
  const dest=safe(output,path);mkdirSync(dirname(dest),{recursive:true});
  copyFileSync(safe(root,path),dest);bytes+=lstatSync(dest).size;
}
mkdirSync(dirname(marker),{recursive:true});
writeFileSync(marker,JSON.stringify(manifest.files)+'\n');
console.log(JSON.stringify({publicFiles:manifest.files.length,publicBytes:bytes,diagnosticImagesGenerated:false}));
