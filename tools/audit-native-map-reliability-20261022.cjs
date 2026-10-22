// Investigation only: exercises unchanged 0.6.6 modules. No phone package built.
// node tools/audit-native-map-reliability-20261022.cjs /absolute/typescript.js
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const harnessFile = path.join(root, 'tools/scripting-map-cache-test/0.6.6/tests/verify-native-066.cjs');
const source = fs.readFileSync(harnessFile, 'utf8').split('let checks=0;')[0];
const moduleBox = {exports:{}};
vm.runInThisContext('(function(require,module,exports,__dirname,__filename){' + source +
  '\nmodule.exports={harness,target,bytes,setTag:fn=>tagNativePNG=fn};\n})')(
  createRequire(harnessFile), moduleBox, moduleBox.exports, path.dirname(harnessFile), harnessFile);
const {harness,target,bytes,setTag} = moduleBox.exports;
const results = [];
const test = async (name, fn) => {const detail = await fn(); results.push({name, ...detail}); console.log('CONFIRMED '+name+' '+JSON.stringify(detail));};
const deferred = () => {let resolve; const promise=new Promise(r=>resolve=r); return {promise,resolve};};

(async()=>{
  const {tagNativePNG} = await import('../lib/native-map-file.js'); setTag(tagNativePNG);
  await test('normal cycle native byte I/O count', async()=>{
    const h=harness(), counts={reads:0,writes:0}, fm=h.scripting.FileManager;
    const read=fm.readAsBytes, write=fm.writeAsBytes;
    fm.readAsBytes=async p=>{counts.reads++;return read(p)};
    fm.writeAsBytes=async(p,b)=>{counts.writes++;return write(p,b)};
    const u=await h.begin(); await h.run(u,h.downloaded(u));
    assert.equal(h.row().state,'done'); assert.equal(counts.reads,8); assert.equal(counts.writes,3);
    return counts;
  });
  await test('missed completion watch consumes next scheduled attempt', async()=>{
    const h=harness(); await h.begin(); h.advance(15*60*1000);
    const at15=await h.begin(); assert.match(at15,/NATIVE_INCOMPLETE/); assert.equal(h.row().state,'failed');
    h.advance(15*60*1000); const at30=await h.begin(); assert.match(at30,/^https:\/\//);
    return {newDownloadAtMinute15:false,newDownloadAtMinute30:true};
  });
  await test('completion watch reports missing download but does not retry', async()=>{
    const h=harness(); await h.begin(); h.fire();
    assert.match(await h.begin(),/NATIVE_INCOMPLETE/);
    assert.equal(h.db.prepare('SELECT count(*) n FROM map_native_runs').get().n,1);
    assert.equal(h.pending.length,1);
    return {newTransferRows:0,remainingNotifications:'regular tick only'};
  });
  await test('report-file failure correctly preserves successful publication classification', async()=>{
    const h=harness(), u=await h.begin(), f=h.downloaded(u), write=h.scripting.FileManager.writeAsString;
    let once=true;
    h.scripting.FileManager.writeAsString=async(p,s)=>{
      if(once && p.endsWith('MapCacheTest-last-update.json')){once=false;throw Error('simulated report failure')}
      return write(p,s);
    };
    const result=await h.run(u,f); assert.equal(result,'');
    assert.deepEqual(h.files.get(target),h.files.get(f[0])); assert.equal(h.row().state,'done');
    return {validNewMapSaved:true,journalState:h.row().state};
  });
  await test('completion journal failure after publication also loses success classification', async()=>{
    const h=harness(), u=await h.begin(), f=h.downloaded(u), open=h.scripting.SQLite.open; let once=true;
    h.scripting.SQLite.open=(...args)=>{const db=open(...args), execute=db.execute;return {...db,execute:async(sql,args)=>{
      if(once && sql.includes("state='done'")){once=false;throw Error('simulated journal failure')}
      return execute(sql,args);
    }}};
    assert.match(await h.run(u,f),/לא הושלם/); assert.deepEqual(h.files.get(target),h.files.get(f[0]));
    return {validNewMapSaved:true,journalState:h.row().state};
  });
  await test('interrupted current overwrite retains backup but blocks subsequent recovery', async()=>{
    const h=harness(), u=await h.begin(), f=h.downloaded(u), reached=deferred(), write=h.scripting.FileManager.writeAsBytes;
    h.scripting.FileManager.writeAsBytes=async(p,b)=>{
      if(p===target){h.files.set(p,b.slice(0,25));reached.resolve();return new Promise(()=>{})}
      return write(p,b);
    };
    // Model a suspended/terminated invocation whose native write did not finish;
    // no finally callback is delivered. This is not an actual iOS kill experiment.
    void h.run(u,f); await reached.promise; h.advance(15*60*1000);
    assert.match(await h.begin(),/MAP_BUSY/);
    assert.deepEqual(h.files.get('/docs/MapCacheTest/previous-map.bin'),bytes);
    assert.equal(h.files.get(target).length,25); assert.equal(h.row().state,'publishing');
    return {backupValid:true,currentIncomplete:true,automaticRecoveryBlocked:true};
  });
  console.log(JSON.stringify({checks:results.length,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
