// Local, synthetic regression. No network, real location or private calendar.
// Run tools/build-map-cache.mjs first to prepare the deployment asset.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {NIGHT_MAP_ASSETS} from '../lib/night-map-assets.js';
import {solarPosition,solarElevation,resolveLocation} from '../lib/map-astronomy-location.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const baseline='4f21b52e295dd728c1bcdd7402b4e5d574c5886c';
const before=file=>execFileSync('git',['show',`${baseline}:${file}`],{cwd:root,encoding:'utf8'});
const oldHelpers=before('lib/home-map-v122.js');
for(const helper of [solarPosition,solarElevation,resolveLocation])
  assert(oldHelpers.includes(helper.toString()),'Shared calculation must be moved verbatim');
fs.mkdirSync(path.join(root,'work'),{recursive:true});
const scratch=fs.mkdtempSync(path.join(root,'work/cleanup-isolation-'));
const assetNames=[...Object.keys(NIGHT_MAP_ASSETS),'OFL.txt'];
const allAssets=fs.readdirSync(path.join(root,'assets/earth'));
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
assert.equal(config.functions['api/night-map.js'].includeFiles,
  'assets/earth/{Terrain_Master_3306x1558.png,Night_Lights_Master_3306x1558.png,Widget_Asset_Contract.json,render-cache-r6.bin.gz,BarlowCondensed-Regular.ttf,BarlowCondensed-Medium.ttf,OFL.txt}');
for(const version of [78,80])for(const extension of ['html','json']){
  const source=`/tools/widgy-v${version}.${extension}`,destination=`/tools/widgy-v77.${extension}`;
  assert(!fs.existsSync(path.join(root,source)));
  assert(config.rewrites.some(r=>r.source===source && r.destination===destination));
  assert.equal(before(source.slice(1)),fs.readFileSync(path.join(root,destination),'utf8'));
}

function prepare(name,source,names){
  const dir=path.join(scratch,name),seen=new Set();
  fs.mkdirSync(dir,{recursive:true});
  function copy(file){
    if(seen.has(file))return;seen.add(file);
    const text=source(file),target=path.join(dir,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);
    for(const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g))
      if(m[1].startsWith('.'))copy(path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1])));
  }
  copy('api/night-map.js');
  fs.writeFileSync(path.join(dir,'package.json'),'{"type":"module"}');
  fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');
  fs.mkdirSync(path.join(dir,'assets/earth'),{recursive:true});
  for(const n of names)fs.copyFileSync(path.join(root,'assets/earth',n),path.join(dir,'assets/earth',n));
  return {dir,modules:[...seen].sort()};
}
function render(dir,atlas){
  return JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
    import {createHash} from 'node:crypto';
    import sharp from 'sharp';
    import {renderHomeMap} from './lib/home-map-day-night.js';
    import {precomputedState} from './lib/map-precomputed.js';
    const bytes=await renderHomeMap({date:new Date('2026-10-04T18:00:00Z'),
      atlas:${JSON.stringify(atlas)},presentation:'glass',width:3306,
      location:{latitude:0,longitude:0,city:'Example'}});
    const hash=b=>createHash('sha256').update(b).digest('hex');
    const metadata=await sharp(bytes).metadata();
    console.log(JSON.stringify({png:hash(bytes),pixels:hash(await sharp(bytes).raw().toBuffer()),
      icc:hash(metadata.icc),width:metadata.width,height:metadata.height,bytes:bytes.length,
      prepared:precomputedState()}));
  `],{cwd:dir,encoding:'utf8',timeout:60000}));
}
try{
  const old=prepare('before',before,allAssets);
  const current=prepare('current',f=>fs.readFileSync(path.join(root,f),'utf8'),assetNames);
  assert(!current.modules.some(f=>/home-map-v\d+/.test(f)));
  const rows=[];
  for(const atlas of ['r6','f50']){
    const a=render(old.dir,atlas),b=render(current.dir,atlas);
    assert.deepEqual(b,a,'Packaged map must remain byte-identical');
    assert.equal(b.prepared,'HIT');rows.push({atlas,...b});
  }
  fs.unlinkSync(path.join(current.dir,'assets/earth/render-cache-r6.bin.gz'));
  const fallback=render(current.dir,'r6');
  assert.equal(fallback.prepared,'FALLBACK');
  const expected={...rows[0]};delete expected.atlas;expected.prepared='FALLBACK';
  assert.deepEqual(fallback,expected,'Original masters still provide an identical fallback');
  const size=names=>names.reduce((sum,n)=>sum+fs.statSync(path.join(root,'assets/earth',n)).size,0);
  console.log(JSON.stringify({passed:true,baseline,isolatedAssetFiles:assetNames.length,
    priorEarthFiles:allAssets.length,priorEarthBytes:size(allAssets),isolatedEarthBytes:size(assetNames),
    excludedEarthBytes:size(allAssets.filter(n=>!assetNames.includes(n))),
    currentModules:current.modules,rows,fallbackExact:true,preservedImportURLs:4,
    scope:'Local isolated runtime, not the measured deployed bundle or phone latency'},null,2));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
