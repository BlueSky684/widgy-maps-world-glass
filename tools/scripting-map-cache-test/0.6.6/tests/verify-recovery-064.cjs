// Actual intent -> quiet -> writer -> publisher + recovery. Native boundaries
// mocked; actual SQLite enforces the durable one-retry reservation.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const ts=require(process.argv[2]||'typescript'),root=path.resolve(__dirname,'..'),compiled={};
for(const f of fs.readdirSync(root).filter(n=>/\.tsx?$/.test(n))){
  const r=ts.transpileModule(fs.readFileSync(path.join(root,f),'utf8'),{fileName:f,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,jsxFactory:'UI.createElement'}});
  assert.equal(r.diagnostics.length,0,f);compiled[f.replace(/\.tsx?$/,'')]=r.outputText;
}
const bytes=new Uint8Array(fs.readFileSync(path.join(__dirname,'test-fixture.png'))),target='/docs/MapCacheTest/map-current.png';
const reportPath='/group/MapCacheTest-last-update.json',purpose='world-glass-map-recovery';
const tick={identifier:'regular',content:{title:'World Glass Map Tick',userInfo:{purpose:'world-glass-map-recurring',intervalMinutes:15}}};
function harness(){
  const db=new DatabaseSync(':memory:');let now=Date.parse('2026-10-21T09:00:00Z'),seq=0,mode={},pending=[tick];
  const files=new Map([[target,bytes.slice()],['/group/MapCacheTest-writer.json',JSON.stringify({schema:2,bookmarkName:'existing',folderId:'11111111-1111-1111-1111-111111111111'})],
    ['/docs/MapCacheTest/map-cache-folder-id.txt','11111111-1111-1111-1111-111111111111']]);
  const notifications=[],requests=[],writes=[];
  class Clock extends Date {constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
  const scripting={Script:{env:'intent',directory:'/script'},AbortController,UUID:{string:()=>`uuid-${++seq}`},
    TimeIntervalNotificationTrigger:class{constructor(p){Object.assign(this,p)}},
    SQLite:{open:()=>{if(mode.sqlFailure)throw Error('SECRET SQL');return {
      execute:async(sql,args=[])=>{db.prepare(sql).run(...args)},fetchAll:async(sql,args=[])=>db.prepare(sql).all(...args)}}},
    FileManager:{appGroupDocumentsDirectory:'/group',documentsDirectory:'/docs',exists:async p=>files.has(p),
      readAsString:async p=>files.get(p),writeAsString:async(p,s)=>files.set(p,s),
      readAsStringSync:()=>JSON.stringify({mapAccessKey:'synthetic-private-key-'.repeat(3)}),
      readAsBytes:async p=>files.get(p).slice(),writeAsBytes:async(p,b)=>{
        writes.push(p);files.set(p,b.slice());if(mode.writeFailure&&p===target){mode.writeFailure=false;files.set(p,b.slice(0,25));throw Error('SECRET file')}
      },remove:async p=>files.delete(p)},
    Data:{fromUint8Array:b=>b},UIImage:{fromData:()=>{if(mode.pause){now+=mode.pause;mode.pause=0}return{width:2400,height:1131}}},
    Notification:{getAllPendingsOfCurrentScript:async()=>pending.slice(),removePendings:async ids=>{pending=pending.filter(r=>!ids.includes(r.identifier))},
      removeAllPendingsOfCurrentScript:async()=>{pending=[]},
      schedule:async content=>{notifications.push(content);if(content.trigger){
        pending.push({identifier:`n-${++seq}`,content,trigger:content.trigger});
        if(mode.stopDuringSchedule)pending=pending.filter(r=>r!==tick);
        if(mode.scheduleFailure)throw Error('SECRET notification');
      }}},
    fetch:async url=>{requests.push(url);if(mode.networkFailure)throw Error('SECRET URL');
      return{status:200,headers:{get:k=>({'x-map-service':'vercel-file-v1','content-type':'image/png','content-length':String(bytes.length)})[k]??null},
        data:async()=>({size:bytes.length,toUint8Array:()=>{const b=bytes.slice();if(mode.corrupt)b[40]^=1;return b}})}}};
  function modules(){
    const context=vm.createContext({Uint8Array,Date:Clock,Promise,Error,console,setTimeout,clearTimeout}),cache={};
    function load(name){if(name==='scripting')return scripting;name=name.replace(/^\.\//,'');
      if(name==='probe')return{bookmarkedMap:async()=>target};if(cache[name])return cache[name].exports;
      const module=cache[name]={exports:{}};assert(compiled[name],name);
      vm.runInContext('(function(require,module,exports){'+compiled[name].replace('void main();','globalThis.finished = main();')+'\n})',context,{filename:name})(load,module,module.exports);
      return module.exports}
    return{load,context};
  }
  return {db,files,requests,writes,notifications,scripting,modules,
    get pending(){return pending},advance:ms=>{now+=ms},stop:()=>{pending=[]},
    report:()=>JSON.parse(files.get(reportPath)),retryCount:()=>notifications.filter(n=>n.userInfo?.purpose===purpose).length,
    async run(options={}){mode={...options};const exits=[];scripting.Script.env='intent';scripting.Script.exit=v=>exits.push(v);
      scripting.Intent={shortcutParameter:{type:'text',value:options.input??('31.67\n34.57\n'+new Clock().toISOString())},text:value=>({type:'text',value})};
      const m=modules();m.load('intent');await m.context.finished;assert.equal(exits.length,1);return exits[0].value},
    fire(){pending=pending.filter(r=>r.content.userInfo?.purpose!==purpose);now+=60000}
  };
}
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS '+name)}
(async()=>{
  await test('61.2-second validation pause preserves every map byte and queues one fresh, nonrepeating tick',async()=>{
    const h=harness();assert.equal(await h.run({pause:61200}),'');assert.equal(h.retryCount(),1);assert.equal(h.writes.length,0);
    assert.deepEqual(h.files.get(target),bytes);assert.equal(h.report().ok,false);assert.equal(h.report().alert,'retry-queued');
    assert.match(h.report().message,/UPDATE_TIME/);assert.match(h.report().message,/פענוח תמונה · 61\.2/);
    const retry=h.pending.find(r=>r.content.userInfo.purpose===purpose);assert.equal(retry.content.title,tick.content.title);
    assert.equal(retry.trigger.timeInterval,60);assert.equal(retry.trigger.repeats,false);assert(h.pending.includes(tick));
    assert.doesNotMatch(JSON.stringify([retry,h.report()]),/synthetic-private|SECRET|https:\/\/|31\.67|34\.57/);
  });
  await test('Fresh invocation succeeds quietly with fresh request time and resets the retry reservation',async()=>{
    const h=harness();await h.run({pause:61200});const first=h.requests[0];h.fire();assert.equal(await h.run(),'');
    assert.notEqual(h.requests[1],first);assert.equal(h.report().ok,true);assert.match(h.report().message,/לאחר כשל קודם/);
    assert.equal(h.db.prepare('SELECT COUNT(*) n FROM map_recovery_v1').get().n,0);assert.equal(h.pending.length,1);
    assert.equal(h.notifications.length,1);assert.deepEqual(h.files.get(target),bytes);
  });
  await test('Second and later failures alert without scheduling a retry chain, including after a new JS runtime',async()=>{
    const h=harness();await h.run({pause:61200});h.fire();assert.match(await h.run({pause:61200}),/לא הושלם/);
    assert.equal(h.retryCount(),1);assert.equal(h.report().alert,'requested');h.advance(900000);
    assert.match(await h.run({pause:61200}),/לא הושלם/);assert.equal(h.retryCount(),1);assert.equal(h.writes.length,0);
  });
  await test('Successful ordinary run cancels a still-pending retry and allows recovery for a later failure',async()=>{
    const h=harness();await h.run({pause:61200});assert.equal(await h.run(),'');assert.equal(h.pending.length,1);
    h.advance(900000);await h.run({pause:61200});assert.equal(h.retryCount(),2);assert.equal(h.pending.length,2);
  });
  await test('Recovery never reuses expired location input',async()=>{
    const h=harness();await h.run({pause:61200});h.fire();const n=h.requests.length;
    assert.match(await h.run({input:'31.67\n34.57\n2026-10-21T09:00:00Z'}),/SHORTCUT_LOCATION_AGE/);
    assert.equal(h.requests.length,n);assert.equal(h.retryCount(),1);assert.equal(h.writes.length,0);
  });
  await test('No active regular schedule means immediate failure alert and no recovery scheduling',async()=>{
    const h=harness();h.stop();assert.match(await h.run({pause:61200}),/לא הושלם/);assert.equal(h.retryCount(),0);assert.equal(h.pending.length,0);
  });
  await test('Uncertain notification registration is removed and cannot hide the failure',async()=>{
    const h=harness();assert.match(await h.run({pause:61200,scheduleFailure:true}),/לא הושלם/);
    assert.equal(h.pending.length,1);assert.equal(h.pending[0],tick);assert.equal(h.report().alert,'requested');
    await h.run({pause:61200});assert.equal(h.retryCount(),1);
  });
  await test('Stop during recovery registration removes the extra tick and returns failure',async()=>{
    const h=harness();assert.match(await h.run({pause:61200,stopDuringSchedule:true}),/לא הושלם/);assert.equal(h.pending.length,0);
  });
  await test('SQLite unavailable fails closed with an immediate safe error, never a retry',async()=>{
    const h=harness();assert.match(await h.run({sqlFailure:true}),/LOCK_UNAVAILABLE/);assert.equal(h.retryCount(),0);
  });
  await test('Invalid input, corrupt bytes, and network errors are immediate and preserve the old map',async()=>{
    for(const options of [{input:'bad'},{corrupt:true},{networkFailure:true}]){
      const h=harness();assert.match(await h.run(options),/לא הושלם/);assert.equal(h.retryCount(),0);assert.deepEqual(h.files.get(target),bytes);
    }
  });
  await test('Publication failure rolls back and is never retried automatically',async()=>{
    const h=harness();assert.match(await h.run({writeFailure:true}),/לא הושלם/);assert.equal(h.retryCount(),0);
    assert.deepEqual(h.files.get(target),bytes);assert.match(h.notifications[0].body,/יש לבדוק/);
  });
  await test('Two concurrent recovery reservations cannot both schedule, using real SQLite uniqueness',async()=>{
    const h=harness(),r=h.modules().load('recovery'),outcome={ok:false,code:'UPDATE_TIME',publicationStarted:false,message:'safe'};
    const results=await Promise.all([r.requestRecovery(outcome),r.requestRecovery(outcome)]);
    assert(results.filter(r=>r==='queued').length<=1);assert(h.retryCount()<=1);
    assert.equal(h.db.prepare('SELECT COUNT(*) n FROM map_recovery_v1').get().n,1);
  });
  await test('Status recognizes a one-off retry; stopping cancels both kinds of tick',async()=>{
    const h=harness();await h.run({pause:61200});h.scripting.Script.env='index';const s=h.modules().load('scheduler');
    assert.match(await s.scheduleStatus(),/חד־פעמי/);await s.stopRecurring();assert.equal(h.pending.length,0);
  });
  await test('Success and queued recovery are silent under the existing Shortcut condition; final failure alerts',async()=>{
    const h=harness(),shown=[];for(const mode of [{},{pause:61200},{pause:61200}]){
      const result=await h.run(mode);if(result.includes('לא הושלם'))shown.push(result);h.fire();
    }
    assert.equal(shown.length,1);assert.match(shown[0],/UPDATE_TIME/);
  });
  console.log(checks+' recovery checks passed; actual iOS notification -> automation delivery still needs device observation.');
})().catch(e=>{console.error(e);process.exitCode=1});
