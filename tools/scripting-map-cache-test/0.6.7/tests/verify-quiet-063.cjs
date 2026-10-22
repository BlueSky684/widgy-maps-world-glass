// Actual intent -> quiet -> writer -> bridge/core graph; native APIs mocked.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ts=require(process.argv[2]||'typescript'),root=path.resolve(__dirname,'..');
const compiled={};
for(const f of fs.readdirSync(root).filter(n=>/\.tsx?$/.test(n))){
  const r=ts.transpileModule(fs.readFileSync(path.join(root,f),'utf8'),{
    fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,jsxFactory:'UI.createElement'}});
  assert.equal(r.diagnostics.length,0,f);compiled[f.replace(/\.tsx?$/,'')]=r.outputText;
}
const bytes=new Uint8Array(fs.readFileSync(path.join(__dirname,'test-fixture.png')));
const target='/docs/MapCacheTest/map-current.png',reportPath='/group/MapCacheTest-last-update.json';
const tick={content:{title:'World Glass Map Tick',userInfo:{purpose:'world-glass-map-recurring',intervalMinutes:15}}};
function harness(options={}){
  const binding={schema:2,bookmarkName:'existing',folderId:'11111111-1111-1111-1111-111111111111'};
  const files=new Map([[target,bytes.slice()],['/group/MapCacheTest-writer.json',JSON.stringify(binding)],
    ['/docs/MapCacheTest/map-cache-folder-id.txt',binding.folderId]]);
  const notifications=[],requests=[],exits=[],writes=[],pending=[tick];let failCurrent=options.writeFailure;
  const fm={documentsDirectory:'/docs',appGroupDocumentsDirectory:'/group',exists:async p=>files.has(p),
    readAsString:async p=>files.get(p),writeAsString:async(p,b)=>{if(options.reportFailure&&p===reportPath)throw Error('SECRET disk');files.set(p,b)},
    readAsStringSync:()=>JSON.stringify({mapAccessKey:'synthetic-secret-key-'.repeat(3)}),
    readAsBytes:async p=>files.get(p).slice(),writeAsBytes:async(p,b)=>{
      writes.push(p);if(failCurrent&&p===target){failCurrent=false;files.set(p,b.slice(0,20));throw Error('SECRET write')};files.set(p,b.slice());
    },remove:async p=>files.delete(p)};
  const scripting={Script:{env:'intent',directory:'/script',exit:v=>exits.push(v)},FileManager:fm,AbortController,
    Intent:{shortcutParameter:{type:'text',value:options.invalidInput?'bad':'31.67\n34.57\n'+new Date().toISOString()},text:value=>({type:'text',value})},
    Notification:{schedule:async content=>{if(options.alertFailure)throw Error('SECRET notification');notifications.push(content)},
      getAllPendingsOfCurrentScript:async()=>pending,removeAllPendingsOfCurrentScript:async()=>{throw Error('Must not cancel tick')}},
    Data:{fromUint8Array:b=>b},UIImage:{fromData:()=>({width:2400,height:1131})},
    fetch:async url=>{requests.push(url);if(options.networkFailure)throw Error('SECRET URL '+url);
      return{status:200,headers:{get:k=>({'x-map-service':'vercel-file-v1','content-type':'image/png','content-length':String(bytes.length)})[k]??null},
        data:async()=>({size:bytes.length,toUint8Array:()=>bytes})};}};
  const context=vm.createContext({Uint8Array,Date,Promise,Error,console,setTimeout,clearTimeout}),cache={};
  function load(name){
    if(name==='scripting')return scripting;
    name=name.replace(/^\.\//,'');
    if(name==='lock')return{withMapLock:async work=>work()};
    if(name==='probe')return{bookmarkedMap:async()=>target};
    if(options.unexpectedWriter&&name==='writer')return{performShortcutUpdate:async()=>{throw Error('SECRET unexpected')}};
    if(cache[name])return cache[name].exports;
    const module=cache[name]={exports:{}};
    assert(compiled[name],name);
    vm.runInContext('(function(require,module,exports){'+compiled[name].replace('void main();','globalThis.finished = main();')+'\n})',context,{filename:name})(load,module,module.exports);
    return module.exports;
  }
  return{files,notifications,requests,exits,writes,pending,scripting,load,report:()=>JSON.parse(files.get(reportPath)),
    run:async()=>{load('intent');await context.finished;assert.equal(exits.length,1);return exits[0].value}};
}
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS '+name)}
(async()=>{
  await test('Actual successful intent publishes 2400, returns empty text and creates no notification',async()=>{
    const h=harness();assert.equal(await h.run(),'');assert.equal(h.notifications.length,0);
    assert.equal(h.requests.length,1);assert.equal(new URL(h.requests[0]).searchParams.get('width'),'2400');
    assert.deepEqual(h.files.get(target),bytes);assert(h.writes.includes(target));assert.equal(h.report().ok,true);
    assert.equal(h.report().alert,'not-needed');assert.equal(h.report().version,'0.6.7');
    assert.match(await h.load('quiet').lastUpdateStatus(),/2400 × 1131/);assert.equal(h.pending[0],tick);
  });
  await test('Network failure creates one safe error alert, preserves current map and records diagnosis',async()=>{
    const h=harness({networkFailure:true}),out=await h.run();assert.match(out,/לא הושלם/);assert.equal(h.notifications.length,1);
    const n=h.notifications[0];assert.notEqual(n.title,tick.content.title);assert.equal(n.trigger,undefined);assert.equal(n.tapAction,'none');
    assert.equal(n.userInfo.purpose,'world-glass-map-failure');assert.equal(h.pending[0],tick);assert.deepEqual(h.files.get(target),bytes);
    assert.equal(h.report().ok,false);assert.equal(h.report().alert,'requested');
    assert.doesNotMatch(JSON.stringify([h.report(),n,out]),/SECRET|synthetic-secret|https:\/\/|31\.67|34\.57/);
  });
  await test('Invalid Shortcut input alerts once before any map/network write',async()=>{
    const h=harness({invalidInput:true});await h.run();assert.equal(h.requests.length,0);assert.equal(h.writes.length,0);assert.equal(h.notifications.length,1);
  });
  await test('Publication failure restores old bytes and error alert does not falsely claim success',async()=>{
    const h=harness({writeFailure:true});await h.run();assert.equal(h.report().ok,false);assert.deepEqual(h.files.get(target),bytes);
    assert.equal(h.notifications.length,1);assert.match(h.notifications[0].body,/יש לבדוק/);
  });
  await test('Unavailable error notifications preserve safe failure result and report ALERT_FAILED',async()=>{
    const h=harness({networkFailure:true,alertFailure:true});const out=await h.run();assert.match(out,/ALERT_FAILED/);
    assert.equal(h.report().ok,false);assert.equal(h.report().alert,'failed');assert.doesNotMatch(out,/SECRET/);
    assert.match(await h.load('quiet').lastUpdateStatus(),/ALERT_FAILED/);
  });
  await test('Diagnostic disk failure cannot create a false map failure or success notification',async()=>{
    const h=harness({reportFailure:true});assert.equal(await h.run(),'');assert.deepEqual(h.files.get(target),bytes);assert.equal(h.notifications.length,0);
  });
  await test('Diagnostic disk failure cannot prevent a real failure notification',async()=>{
    const h=harness({networkFailure:true,reportFailure:true});assert.match(await h.run(),/לא הושלם/);assert.equal(h.notifications.length,1);
  });
  await test('Unexpected writer throw becomes a safe failure with no unverified last-good claim',async()=>{
    const h=harness({unexpectedWriter:true});const out=await h.run();assert.match(out,/INTERNAL/);assert.doesNotMatch(out,/SECRET/);
    assert.match(h.notifications[0].body,/יש לבדוק/);assert.equal(h.report().ok,false);
  });
  await test('No prior result is explicit; corrupt reports produce a safe diagnostic error',async()=>{
    const h=harness(),q=h.load('quiet');assert.match(await q.lastUpdateStatus(),/עדיין לא/);
    h.files.set(reportPath,'SECRET corrupt');await assert.rejects(()=>q.lastUpdateStatus(),/REPORT_READ/);
    assert.equal(h.notifications.length,0);assert.equal(h.requests.length,0);
  });
  await test('Foreground alert test leaves map, latest result and repeating tick untouched',async()=>{
    const h=harness();await h.run();const before=h.files.get(reportPath);h.scripting.Script.env='index';
    await h.load('quiet').testFailureAlert();assert.equal(h.notifications.length,1);assert.equal(h.files.get(reportPath),before);
    assert.deepEqual(h.files.get(target),bytes);assert.equal(h.pending[0],tick);assert.equal(h.notifications[0].trigger,undefined);
    assert.notEqual(h.notifications[0].title,tick.content.title);assert.match(h.notifications[0].body,/בדיקת התראה בלבד/);
  });
  await test('Alert test cannot run from intent and its native errors are sanitized',async()=>{
    const h=harness({alertFailure:true}),q=h.load('quiet');await assert.rejects(()=>q.testFailureAlert(),/בתפריט/);
    h.scripting.Script.env='index';await assert.rejects(()=>q.testFailureAlert(),/ALERT_FAILED/);assert.equal(h.notifications.length,0);
  });
  console.log(checks+' quiet-intent checks passed; native notification delivery remains a device check.');
})().catch(e=>{console.error(e);process.exitCode=1});
