const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const {stripTypeScriptTypes}=require('node:module');
const root=__dirname+'/..';
class SafeMapError extends Error {}
function load(file,names,globals={}) {
  const source=stripTypeScriptTypes(fs.readFileSync(root+'/'+file,'utf8'),{mode:'transform'})
    .replace(/^import .*\n/gm,'').replace(/^export \{.*\} from .*\n/gm,'').replace(/\bexport /g,'');
  const context=vm.createContext({Uint8Array,Date,Promise,SafeMapError,setTimeout,clearTimeout,...globals});
  vm.runInContext(source+'\nthis.result={'+names.join(',')+'}',context);return context.result;
}
const core=load('core.ts',['WIDTH','HEIGHT','checkPNG','checkSavedPNG','crc32','equalBytes','MAX_BYTES','preparePublisher','publishCandidate','recoverCurrent']);
function png(width,height) {
  const chunk=(type,bytes)=>{const head=Buffer.alloc(4);head.writeUInt32BE(bytes.length);const body=Buffer.concat([Buffer.from(type),bytes]),crc=Buffer.alloc(4);crc.writeUInt32BE(core.crc32(body));return Buffer.concat([head,body,crc]);};
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;
  return new Uint8Array(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(Buffer.alloc((width+1)*height))),chunk('IEND',Buffer.alloc(0))]));
}
const small=png(2400,1131),original=png(3306,1558),paths={current:'current',stage:'stage',backup:'backup'};
function memory(prior=original) {
  const files=new Map([['current',prior.slice()]]);let failCurrent=false;const writes=[];
  const io={exists:async p=>files.has(p),read:async p=>files.get(p).slice(),write:async(p,b)=>{
    writes.push(p);if(p==='current'&&failCurrent){failCurrent=false;files.set(p,b.slice(0,20));throw Error('write');}files.set(p,b.slice());
  },remove:async p=>files.delete(p)};
  return {io,files,writes,failNext:()=>{failCurrent=true}};
}
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
(async()=>{
  await test('Legacy saved maps remain readable; every new candidate must be 2400 x 1131',async()=>{
    assert.equal(core.checkSavedPNG(original).width,3306);assert.equal(core.checkSavedPNG(small).height,1131);
    assert.throws(()=>core.checkPNG(original),/dimensions/);assert.equal(core.checkPNG(small).width,2400);
    assert.throws(()=>core.checkSavedPNG(png(2400,1132)),/dimensions/);
    const bad=original.slice();bad[45]^=1;assert.throws(()=>core.checkSavedPNG(bad));
  });
  await test('First 2400px update keeps the old 3306px map as a valid backup',async()=>{
    const f=memory(),p=await core.preparePublisher(f.io,paths);assert(p.hasCurrent);
    await p.publish(small,async()=>{},()=>{});assert.deepEqual(f.files.get('backup'),original);assert.deepEqual(f.files.get('current'),small);
  });
  await test('Interrupted first smaller publication restores the original map exactly',async()=>{
    const f=memory(),p=await core.preparePublisher(f.io,paths);f.failNext();
    await assert.rejects(()=>p.publish(small,async()=>{},()=>{}),/restored/);assert.deepEqual(f.files.get('current'),original);
  });
  await test('Corrupt current recovers from an old-resolution backup; unsupported backup is rejected',async()=>{
    const f=memory(original.slice(0,20));f.files.set('backup',original);assert.deepEqual(await core.recoverCurrent(f.io,paths),original);
    f.files.set('current',small.slice(0,20));f.files.set('backup',png(2400,1132));assert.equal(await core.recoverCurrent(f.io,paths),null);
  });
  await test('Requested resolution mismatch is rejected before decode or file writes',async()=>{
    const f=memory(),p=await core.preparePublisher(f.io,paths);let decoded=false;
    await assert.rejects(()=>p.publish(original,async()=>{decoded=true},()=>{}),/dimensions/);
    assert(!decoded);assert.equal(f.writes.length,0);assert.deepEqual(f.files.get('current'),original);
  });
  await test('Legacy dimensions cannot be requested through a publisher override',async()=>{
    const f=memory(small);
    await assert.rejects(()=>core.publishCandidate(f.io,paths,original,async()=>{},{width:3306,height:1558}),/dimensions/);
    assert.equal(f.writes.length,0);assert.deepEqual(f.files.get('current'),small);
  });

  const files=new Map(),requests=[],target='/docs/MapCacheTest/map-current.png';files.set(target,original);
  const binding={schema:2,bookmarkName:'existing-bookmark',folderId:'11111111-1111-1111-1111-111111111111'};
  files.set('/group/MapCacheTest-writer.json',JSON.stringify(binding));files.set('/docs/MapCacheTest/map-cache-folder-id.txt',binding.folderId);
  const fm={documentsDirectory:'/docs',appGroupDocumentsDirectory:'/group',exists:async p=>files.has(p),createDirectory:async()=>{},
    readAsString:async p=>files.get(p),writeAsString:async(p,b)=>{files.set(p,b)},
    readAsStringSync:()=>JSON.stringify({mapAccessKey:'synthetic-private-key-'.repeat(3)}),
    readAsBytes:async p=>files.get(p).slice(),writeAsBytes:async(p,b)=>{files.set(p,b.slice())},remove:async p=>files.delete(p)};
  let wrongSize=false;const script={env:'index',directory:'/script'};
  const native={Script:script,FileManager:fm,AbortController,Data:{fromUint8Array:b=>b},UIImage:{fromData:b=>core.checkSavedPNG(b)},
    Location:{requestCurrent:async()=>({latitude:31.67,longitude:34.57,timestamp:Date.now()})},
    fetch:async value=>{const width=Number(new URL(value).searchParams.get('width'));requests.push(width);const bytes=wrongSize?original:width===2400?small:original;
      return {status:200,headers:{get:k=>({'x-map-service':'vercel-file-v1','content-type':'image/png','content-length':String(bytes.length)})[k]??null},data:async()=>({size:bytes.length,toUint8Array:()=>bytes})};}};
  const globals={...core,api:n=>native[n],withMapLock:async work=>work()};
  const traces={...load('download-trace.ts',['DownloadTrace','DownloadError']),...load('operation-trace.ts',['OperationTrace']),...load('timing.ts',['UpdateTiming'])};
  const bridge=load('bridge.ts',['mapURL','liveMapURL','updateLiveMap','decode','downloadForPublication','disk','paths','accessKey'],{...globals,...traces});
  const writer=load('writer.ts',['runShortcutUpdate'],{...globals,...traces,...bridge,
    ...load('shortcut-location.ts',['shortcutLocation','shortcutTimingSummary']),bookmarkedMap:async()=>target});
  await test('Manual update ignores the previous 3306 preference and publishes 2400',async()=>{
    files.set('/group/MapCacheTest-resolution.json','{"schema":1,"width":3306}');
    await bridge.updateLiveMap(()=>{});assert.equal(requests.at(-1),2400);assert.deepEqual(files.get(target),small);
  });
  await test('Actual Shortcut writer ignores even a corrupt old preference',async()=>{
    files.set('/group/MapCacheTest-resolution.json','corrupt old setting');script.env='intent';
    const out=await writer.runShortcutUpdate('31.67\n34.57\n'+new Date().toISOString());
    assert.match(out,/עדכון המפה הצליח/);assert.match(out,/2400 × 1131/);assert.equal(requests.at(-1),2400);
    assert.deepEqual(files.get(target),small);
  });
  await test('Wrong-size automatic response cannot overwrite the last good map',async()=>{
    wrongSize=true;const before=files.get(target).slice();const out=await writer.runShortcutUpdate('31.67\n34.57\n'+new Date().toISOString());
    assert.match(out,/לא הושלם/);assert.deepEqual(files.get(target),before);
    await assert.rejects(()=>bridge.decode(original),/requested PNG/);
  });
  await test('Wrong-size manual response is rejected without changing the saved map',async()=>{
    script.env='index';const before=files.get(target).slice();
    await assert.rejects(()=>bridge.updateLiveMap(()=>{}),/DOWNLOAD_PNG/);
    assert.deepEqual(files.get(target),before);wrongSize=false;
  });
  await test('URL functions cannot be switched back by stale size arguments',async()=>{
    const old={width:3306,height:1558},now=Date.now(),point={latitude:0,longitude:0,timestamp:now};
    for(const value of [bridge.mapURL('A','key',old),bridge.mapURL('B','key',old),bridge.liveMapURL(point,'key',now,old)]){
      assert.equal(new URL(value).searchParams.get('width'),'2400');
    }
  });
  console.log(count+' fixed-resolution checks passed; native iPhone appearance is not simulated.');
})().catch(e=>{console.error(e);process.exitCode=1});
