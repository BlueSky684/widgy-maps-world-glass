// Real module graph, PNG parser/publisher and SQLite. iOS boundary calls mocked.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),zlib=require('node:zlib');
const ts=require(process.argv[2]||'typescript'),root=path.resolve(__dirname,'..'),compiled={};
for(const f of fs.readdirSync(root).filter(n=>/\.tsx?$/.test(n))){const r=ts.transpileModule(fs.readFileSync(path.join(root,f),'utf8'),{fileName:f,reportDiagnostics:true,
  compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,jsxFactory:'UI.createElement'}});
  assert.equal(r.diagnostics.length,0,f);compiled[f.replace(/\.tsx?$/,'')]=r.outputText}
function crc(b){let c=0xffffffff;for(const x of b){c^=x;for(let n=0;n<8;n++)c=(c>>>1)^(c&1?0xedb88320:0)}return(c^0xffffffff)>>>0}
function chunk(t,b){const v=Buffer.alloc(b.length+12);v.writeUInt32BE(b.length);v.write(t,4);b.copy(v,8);v.writeUInt32BE(crc(v.subarray(4,v.length-4)),v.length-4);return v}
const header=Buffer.alloc(13);header.writeUInt32BE(2400);header.writeUInt32BE(1131,4);header[8]=8;header[9]=6;
const base=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(Buffer.alloc((2400*4+1)*1131))),chunk('IEND',Buffer.alloc(0))]);
const bytes=new Uint8Array(base),target='/docs/MapCacheTest/map-current.png',reportPath='/group/MapCacheTest-last-update.json';
const tick={identifier:'regular',content:{title:'World Glass Map Tick',userInfo:{purpose:'world-glass-map-recurring',intervalMinutes:15}}};
let tagNativePNG;
function harness(){
  const db=new DatabaseSync(':memory:');let now=Date.parse('2026-10-22T09:00:00Z'),seq=0,mode={},pending=[tick];
  const files=new Map([[target,bytes.slice()],['/group/MapCacheTest-writer.json',JSON.stringify({schema:2,bookmarkName:'existing',folderId:'11111111-1111-1111-1111-111111111111'})],
    ['/docs/MapCacheTest/map-cache-folder-id.txt','11111111-1111-1111-1111-111111111111']]);
  const notifications=[],requests=[],writes=[],reads=[];
  class Clock extends Date {constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
  const scripting={Script:{env:'intent',directory:'/script'},AbortController,UUID:{string:()=>`11111111-2222-4333-8444-${String(++seq).padStart(12,'0')}`},
    TimeIntervalNotificationTrigger:class{constructor(p){Object.assign(this,p)}},
    SQLite:{open:()=>{if(mode.sqlFailure)throw Error('SECRET SQL');return {
      execute:async(sql,args=[])=>{if(mode.ackFailure&&sql.includes("SET state='done'"))throw Error('SECRET ACK');
        if(mode.releaseFailure&&sql.startsWith('DELETE FROM map_writer'))throw Error('SECRET RELEASE');
        if(mode.candidateFailure&&sql.startsWith('INSERT OR REPLACE INTO map_native_candidates'))throw Error('SECRET CANDIDATE');
        return db.prepare(sql).run(...args)},fetchAll:async(sql,args=[])=>db.prepare(sql).all(...args)}}},
    FileManager:{appGroupDocumentsDirectory:'/group',documentsDirectory:'/docs',exists:async p=>files.has(p),
      readAsString:async p=>files.get(p),writeAsString:async(p,s)=>{if(mode.reportFailure&&p===reportPath)throw Error('SECRET REPORT');files.set(p,s)},readAsStringSync:()=>JSON.stringify({mapAccessKey:'synthetic-private-key-'.repeat(3)}),
      readAsBytes:async p=>{reads.push(p);if(mode.readPause&&p.startsWith('/temp/')){now+=mode.readPause;mode.readPause=0}return files.get(p).slice()},
      writeAsBytes:async(p,b)=>{writes.push(p);if(mode.writeHang&&p===target){files.set(p,b.slice(0,25));await new Promise(()=>{})}files.set(p,b.slice());if(mode.writePause&&p.endsWith('candidate.tmp')){now+=mode.writePause;mode.writePause=0}
        if(mode.writeFailure&&p===target){mode.writeFailure=false;files.set(p,b.slice(0,25));throw Error('SECRET WRITE')}},remove:async p=>files.delete(p)},
    Data:{fromUint8Array:b=>b},UIImage:{fromData:()=>{if(mode.pause){now+=mode.pause;mode.pause=0}return{width:2400,height:1131}}},
    Notification:{getAllPendingsOfCurrentScript:async()=>pending.slice(),removePendings:async ids=>{if(mode.cancelFailure)throw Error('SECRET CANCEL');pending=pending.filter(r=>!ids.includes(r.identifier))},
      removeAllPendingsOfCurrentScript:async()=>{pending=[]},schedule:async content=>{notifications.push(content);if(content.trigger){pending.push({identifier:`n-${++seq}`,content,trigger:content.trigger,due:now+content.trigger.timeInterval*1000});
        if(mode.stopDuringSchedule)pending=pending.filter(r=>r!==tick);if(mode.schedulePause)now+=mode.schedulePause;if(mode.scheduleFailure)throw Error('SECRET SCHEDULE')}}},
    fetch:async url=>{requests.push(url);return{status:200,headers:{get:k=>({'x-map-service':'vercel-file-v1','content-type':'image/png','content-length':String(bytes.length)})[k]??null},
      data:async()=>({size:bytes.length,toUint8Array:()=>bytes.slice()})}}};
  function modules(){const context=vm.createContext({Uint8Array,Date:Clock,Promise,Error,console,setTimeout,clearTimeout}),cache={};
    function load(name){if(name==='scripting')return scripting;name=name.replace(/^\.\//,'');if(name==='probe')return{bookmarkedMap:async()=>target};if(cache[name])return cache[name].exports;
      const module=cache[name]={exports:{}};assert(compiled[name],name);vm.runInContext('(function(require,module,exports){'+compiled[name].replace('void main();','globalThis.finished = main();')+'\n})',context,{filename:name})(load,module,module.exports);return module.exports}
    return{load,context}}
  const input=()=>`31.67\n34.57\n${new Clock().toISOString()}\n${new Clock().toISOString()}`;
  async function run(value,files=[],options={}){mode={...options};const exits=[];scripting.Script.env='intent';scripting.Script.exit=v=>exits.push(v);
    scripting.Intent={shortcutParameter:{type:'text',value},fileURLsParameter:files,text:value=>({type:'text',value})};
    const m=modules();m.load('intent');await m.context.finished;assert.equal(exits.length,1);return exits[0].value}
  return{db,files,requests,writes,reads,notifications,scripting,modules,input,run,advance:ms=>{now+=ms},stop:()=>{pending=[]},get pending(){return pending},
    begin:options=>run('NATIVE2400\n'+input(),[],options),report:()=>JSON.parse(files.get(reportPath)),
    row:()=>db.prepare('SELECT * FROM map_native_runs ORDER BY seq DESC LIMIT 1').get(),
    downloaded(url,tokenOverride){const token=tokenOverride||new URL(url).searchParams.get('transfer_id'),file='/temp/download.png';files.set(file,new Uint8Array(tagNativePNG(base,token)));return[file]},
    async deliverDue(){const due=pending.filter(r=>r.due<=now);pending=pending.filter(r=>!due.includes(r));const results=[];
      for(const r of due)if(r.content.title===tick.content.title)results.push(await run('NATIVE2400\n'+input()));return results},
    fire(){pending=pending.filter(r=>r===tick);now+=120000}
  }
}
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS '+name)}
(async()=>{
  ({tagNativePNG}=await import('../../../../lib/native-map-file.js'));
  await test('Prepare returns authenticated native URL, stores private-free state, releases writer lock, no JS download',async()=>{
    const h=harness(),u=await h.begin();assert.match(u,/^https:\/\//);assert.equal(new URL(u).searchParams.get('width'),'2400');assert.equal(h.requests.length,0);assert.equal(h.writes.length,0);
    assert.equal(h.row().state,'waiting');assert.equal(h.db.prepare('SELECT count(*) n FROM map_writer').get().n,0);assert.equal(h.pending.length,2);
    const watch=h.pending.find(r=>r!==tick);assert.equal(watch.trigger.timeInterval,120);assert.equal(watch.trigger.repeats,false);assert.equal(watch.content.title,tick.content.title);
    assert.doesNotMatch(JSON.stringify([h.row(),watch]),/synthetic-private|https:\/\/|31\.67|34\.57|\/docs/);
  });
  await test('Native handoff preserves exact tagged bytes, validates/readbacks current, quiet success, cancels only own watch',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.advance(4000);const expected=h.files.get(f[0]).slice();assert.equal(await h.run(u,f),'');
    assert.deepEqual(h.files.get(target),expected);assert.equal(h.report().ok,true);assert.match(h.report().message,/מסלול: הורדה בקיצורים/);assert.equal(h.row().state,'done');assert.equal(h.pending.length,1);assert.equal(h.pending[0],tick);
  });
  for(const kind of ['corrupt','html','missing','wrong-token','untagged','oversize'])await test(kind+' file is rejected without changing current',async()=>{
    const h=harness(),u=await h.begin();let f=h.downloaded(u);
    if(kind==='corrupt')h.files.get(f[0])[40]^=1;
    if(kind==='html')h.files.set(f[0],new Uint8Array(Buffer.from('<html>error</html>')));
    if(kind==='missing')f=[];
    if(kind==='wrong-token')f=h.downloaded(u,'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    if(kind==='untagged')h.files.set(f[0],bytes.slice());
    if(kind==='oversize')h.files.set(f[0],new Uint8Array(6*1024*1024+1));
    assert.match(await h.run(u,f),/לא הושלם/);assert.deepEqual(h.files.get(target),bytes);assert.equal(h.writes.length,0);assert.equal(h.row().state,'failed');assert.equal(h.pending.length,1);
  });
  for(const delay of [20000,35500,119000])await test('Valid handoff after '+delay+' ms is checked, published and measured separately',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.advance(delay);assert.equal(await h.run(u,f),'');
    assert.deepEqual(h.files.get(target),h.files.get(f[0]));assert.equal(h.row().state,'done');
    const timing=JSON.parse(h.db.prepare('SELECT detail FROM map_native_timing').get().detail);
    assert.equal(timing.beforeSaveMs,delay);assert.equal(timing.saveMs,0);assert.equal(timing.phase,'הושלם');
    assert.match(await h.modules().load('native-transfer').nativeHistory(),/בתוך שלב השמירה/);
  });
  for(const [name,advance,options] of [['expired HTTP',120000,{}],['native decode pause',0,{pause:61200}],['file read pause',0,{readPause:21000}],['stage I/O pause',0,{writePause:21000}],['clock moved backward',-1000,{}]])await test(name+' cannot start a current overwrite',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.advance(advance);assert.equal(await h.run(u,f,options),'');assert.equal(h.report().alert,'retry-queued');assert.equal(h.report().ok,false);assert(!h.writes.includes(target));assert.deepEqual(h.files.get(target),bytes);
  });
  await test('The same 35.5 seconds spent INSIDE finalization still fails closed with stage diagnostics',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);
    assert.equal(await h.run(u,f,{readPause:35500}),'');const result=h.report().message;assert.match(result,/NATIVE_SAVE_LATE/);assert.match(result,/קריאת הקובץ שהורד/);
    assert(!h.writes.includes(target));const timing=JSON.parse(h.db.prepare('SELECT detail FROM map_native_timing').get().detail);
    assert.equal(timing.beforeSaveMs,0);assert.equal(timing.saveMs,35500);assert.equal(h.row().state,'failed');
  });
  await test('A delayed handoff does not extend the two-minute deadline during validation',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.advance(119000);
    assert.equal(await h.run(u,f,{readPause:1000}),'');assert.match(h.report().message,/NATIVE_EXPIRED/);assert(!h.writes.includes(target));
  });
  await test('Location age is independently preserved even when transfer itself is younger than two minutes',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);
    h.db.prepare('UPDATE map_native_runs SET requested=requested-110000').run();h.advance(15000);
    assert.equal(await h.run(u,f),'');assert.match(h.report().message,/NATIVE_LOCATION_AGE/);assert(!h.writes.includes(target));
  });
  await test('Existing 0.6.5 rows survive additive timing-table creation and old history remains visible',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.db.exec('DROP TABLE map_native_timing');
    h.advance(35500);assert.equal(await h.run(u,f),'');assert.equal(h.row().state,'done');
    h.db.prepare("INSERT INTO map_native_runs(token,started,requested,state,ended,code,baseline) VALUES ('previous',1,1,'failed',35501,'NATIVE_LATE','old')").run();
    const history=await h.modules().load('native-transfer').nativeHistory();assert.match(history,/NATIVE_LATE/);assert.match(history,/35.5/);
  });
  await test('Corrupt late data is still rejected instead of passing because the transfer window is longer',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.files.get(f[0])[40]^=1;h.advance(35500);
    assert.match(await h.run(u,f),/NATIVE_PNG/);assert(!h.writes.includes(target));
  });
  await test('Missing native GET -> one fresh watched recovery; second missing GET only alerts',async()=>{
    const h=harness(),first=await h.begin();h.advance(120000);const next=(await h.deliverDue())[0];
    assert.match(next,/^https:\/\//);assert.notEqual(next,first);assert.equal(h.requests.length,0);
    assert.equal(h.row().monitor,'scheduled-alert');assert.equal(h.pending.length,2);
    const alert=h.pending.find(r=>r!==tick);assert.notEqual(alert.content.title,tick.content.title);
    h.advance(120000);assert.deepEqual(await h.deliverDue(),[]);assert.equal(h.pending.length,1);
    assert.match(await h.modules().load('native-transfer').nativeHistory(),/NATIVE_INCOMPLETE/);
  });
  await test('Old continuation cannot overwrite or change the newer pending attempt',async()=>{
    const h=harness(),old=await h.begin(),oldFile=h.downloaded(old);h.fire();await h.begin();h.advance(900000);const next=await h.begin();
    assert.equal(await h.run(old,oldFile),'');assert.equal(h.writes.length,0);assert.equal(h.row().token,new URL(next).searchParams.get('transfer_id'));assert.equal(h.row().state,'waiting');
  });
  await test('Overlapping preparation and duplicate completion are harmless',async()=>{
    const h=harness(),u=await h.begin();assert.equal(await h.begin(),'');assert.equal(h.pending.length,2);const f=h.downloaded(u);await h.run(u,f);const count=h.writes.length;assert.equal(await h.run(u,f),'');assert.equal(h.writes.length,count);
  });
  await test('Stopped scheduler permits manual test but does not silently enable monitoring',async()=>{
    const h=harness();h.stop();const u=await h.begin();assert.equal(h.pending.length,0);assert.equal(h.row().monitor,'manual');await h.run(u,h.downloaded(u));assert.match(h.report().message,/התזמון כבוי/);
  });
  for(const options of [{scheduleFailure:true},{stopDuringSchedule:true},{schedulePause:6000}])await test('Uncertain or late watch registration fails closed and removes its own request '+JSON.stringify(options),async()=>{
    const h=harness();assert.match(await h.begin(options),/לא הושלם/);assert.equal(h.requests.length,0);assert.equal(h.writes.length,0);assert(h.pending.every(r=>r===tick));assert.equal(h.row().state,'failed');
  });
  await test('Changed current while download in flight is preserved',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);const other=new Uint8Array(tagNativePNG(base,'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'));h.files.set(target,other);
    assert.match(await h.run(u,f),/NATIVE_SUPERSEDED/);assert.deepEqual(h.files.get(target),other);assert.equal(h.writes.length,0);
  });
  await test('Caught publication failure restores previous bytes and reports failure',async()=>{
    const h=harness(),u=await h.begin();assert.match(await h.run(u,h.downloaded(u),{writeFailure:true}),/לא הושלם/);assert.deepEqual(h.files.get(target),bytes);assert.equal(h.row().state,'failed');
  });
  await test('Interrupted publication record blocks a new request; retained writer lock is never stolen',async()=>{
    const h=harness();await h.begin();h.db.prepare("UPDATE map_native_runs SET state='publishing'").run();h.advance(999999);assert.match(await h.begin(),/NATIVE_UNCONFIRMED_WRITE/);
    h.db.prepare("INSERT INTO map_writer VALUES(1,'killed-writer')").run();assert.match(await h.begin(),/MAP_BUSY/);assert.equal(h.db.prepare('SELECT owner FROM map_writer').get().owner,'killed-writer');
  });
  await test('Valid local file URL is supported; remote file input and malformed request URL are rejected',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);assert.equal(await h.run(u,['file://localhost'+f[0]]),'');
    const k=harness(),v=await k.begin();assert.match(await k.run(v,['https://invalid/file']),/NATIVE_FILE_INPUT/);assert.match(await k.run('https://wrong.invalid',[]),/NATIVE_TOKEN/);
  });
  await test('Expired input and unavailable SQLite cannot start a download or write',async()=>{
    const h=harness(),input=h.input();h.advance(121000);assert.match(await h.run('NATIVE2400\n'+input),/SHORTCUT_LOCATION_AGE/);assert.equal(h.writes.length,0);
    assert.match(await h.begin({sqlFailure:true}),/LOCK_UNAVAILABLE/);
  });
  await test('Journal is bounded to 64 attempts and contains no URL, location or access key',async()=>{
    const h=harness();for(let n=0;n<66;n++){const u=await h.begin();await h.run(u,[]);h.advance(900000)}
    const rows=h.db.prepare('SELECT * FROM map_native_runs').all();assert.equal(rows.length,64);assert.doesNotMatch(JSON.stringify(rows),/synthetic-private|https:\/\/|31\.67|34\.57/);
    const timings=h.db.prepare('SELECT * FROM map_native_timing').all();assert.equal(timings.length,64);
    assert.doesNotMatch(JSON.stringify(timings),/synthetic-private|https:\/\/|31\.67|34\.57|\/docs|\/temp/);
  });
  await test('Failed cancellation is not called a map failure; next prepare retries cleanup safely',async()=>{
    const h=harness(),u=await h.begin();assert.equal(await h.run(u,h.downloaded(u),{cancelFailure:true}),'');assert.equal(h.report().ok,true);assert.equal(h.pending.length,2);h.advance(900000);assert.match(await h.begin(),/^https:\/\//);assert.equal(h.pending.length,2);
  });
  await test('Menu status recognizes completion watch; explicit stop cancels both future ticks',async()=>{
    const h=harness();await h.begin();h.scripting.Script.env='index';const s=h.modules().load('scheduler');assert.match(await s.scheduleStatus(),/בדיקת השלמה/);await s.stopRecurring();assert.equal(h.pending.length,0);
  });
  await test('Unmodified four-line Shortcut retains legacy route, never claims native handoff',async()=>{
    const h=harness();assert.equal(await h.run(h.input()),'');assert.equal(h.requests.length,1);assert.equal(h.report().ok,true);assert.doesNotMatch(h.report().message,/מסלול: הורדה בקיצורים/);
  });
  await test('Healthy native cycle reuses snapshots: six binary reads, three verified writes',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);assert.equal(await h.run(u,f),'');
    assert.equal(h.reads.length,6);assert.equal(h.writes.length,3);
    assert.equal(h.reads.filter(p=>p===target).length,3); // begin, finalizer baseline, readback
    assert.deepEqual(h.files.get(target),h.files.get(f[0]));
  });
  await test('Missed completion watch never consumes the next regular slot merely reporting',async()=>{
    for(const removeWatch of [false,true]){
      const h=harness(),old=await h.begin();if(removeWatch)h.fire();
      h.advance(removeWatch?780000:900000);const next=await h.begin();
      assert.match(next,/^https:\/\//);assert.notEqual(next,old);assert.equal(h.row().state,'waiting');
      const rows=h.db.prepare('SELECT state,code FROM map_native_runs ORDER BY seq').all();
      assert.deepEqual(rows.map(r=>r.state),['failed','waiting']);assert.equal(rows[0].code,'NATIVE_INCOMPLETE');
    }
  });
  await test('Missed retry completion watch also starts a new request in that same regular invocation',async()=>{
    const h=harness();await h.begin();h.advance(120000);await h.deliverDue();
    h.advance(780000);const regular=await h.begin();assert.match(regular,/^https:\/\//);
    assert.equal(h.row().monitor,'scheduled-alert');assert.equal(h.db.prepare('SELECT count(*) n FROM map_native_runs').get().n,3);
    assert.equal(h.pending.filter(r=>r!==tick&&r.content.title===tick.content.title).length,0);
  });
  await test('Caught timeout queues exactly one 60-second retry; another timeout alerts and cannot loop',async()=>{
    const h=harness(),old=await h.begin();assert.equal(await h.run(old,h.downloaded(old),{readPause:21000}),'');
    assert.equal(h.report().alert,'retry-queued');assert.equal(h.pending.length,2);
    const retry=h.pending.find(r=>r!==tick);assert.equal(retry.trigger.timeInterval,60);assert.equal(retry.trigger.repeats,false);
    h.advance(60000);const next=(await h.deliverDue())[0];assert.notEqual(next,old);
    assert.equal(h.row().requested,h.row().started);assert.equal(h.row().monitor,'scheduled-alert');
    assert.match(await h.run(next,h.downloaded(next),{readPause:21000}),/NATIVE_SAVE_LATE/);
    assert.equal(h.pending.length,1);assert.equal(h.report().alert,'shortcut-result');
    h.advance(900000);const later=await h.begin();assert.equal(h.row().monitor,'scheduled-alert');
    assert.match(await h.run(later,h.downloaded(later),{readPause:21000}),/לא הושלם/);assert.equal(h.pending.length,1);
  });
  await test('Verified success cancels both kinds of watch and rearms one recovery after a prior failure',async()=>{
    const h=harness();await h.begin();h.advance(120000);const retry=(await h.deliverDue())[0];
    assert.equal(await h.run(retry,h.downloaded(retry)),'');assert.equal(h.pending.length,1);
    assert.equal(h.db.prepare('SELECT count(*) n FROM map_recovery_v1').get().n,0);
    h.advance(900000);await h.begin();assert.equal(h.row().monitor,'scheduled-retry');
  });
  await test('Native timeout with scheduling stopped alerts immediately and never recreates a tick',async()=>{
    const h=harness();h.stop();const u=await h.begin();assert.match(await h.run(u,h.downloaded(u),{readPause:21000}),/NATIVE_SAVE_LATE/);
    assert.equal(h.pending.length,0);assert.equal(h.notifications.length,0);
  });
  await test('Stop during an already prepared transfer prevents timeout recovery',async()=>{
    const h=harness(),u=await h.begin();h.stop();assert.match(await h.run(u,h.downloaded(u),{readPause:21000}),/לא הושלם/);
    assert.equal(h.pending.length,0);
  });
  await test('Unverified recovery notification and stop during registration cannot hide the error',async()=>{
    for(const options of [{scheduleFailure:true},{stopDuringSchedule:true},{schedulePause:6000}]){
      const h=harness(),u=await h.begin();assert.match(await h.run(u,h.downloaded(u),{readPause:21000,...options}),/לא הושלם/);
      assert(h.pending.every(r=>r===tick));assert.equal(h.report().alert,'shortcut-result');
    }
  });
  await test('Failure to cancel a native watch prevents a second pending recovery',async()=>{
    const h=harness(),u=await h.begin();assert.match(await h.run(u,h.downloaded(u),{readPause:21000,cancelFailure:true}),/לא הושלם/);
    assert.equal(h.pending.length,2);assert.equal(h.notifications.length,1);
  });
  await test('Recovery never overwrites with the previous invocation or reuses its timestamps',async()=>{
    const h=harness(),old=await h.begin(),f=h.downloaded(old),oldInput=h.input();h.advance(121000);
    assert.match(await h.run('NATIVE2400\n'+oldInput),/SHORTCUT_LOCATION_AGE/);assert.equal(h.row().token,new URL(old).searchParams.get('transfer_id'));
    const next=await h.begin();assert.notEqual(next,old);assert.equal(await h.run(old,f),'');assert.equal(h.writes.length,0);
  });
  await test('Existing 0.6.5 watch gets one fresh invocation without a new automatic retry chain',async()=>{
    const h=harness();await h.begin();h.db.exec('DELETE FROM map_recovery_v1');h.advance(120000);
    const retry=(await h.deliverDue())[0];assert.match(retry,/^https:\/\//);assert.equal(h.row().monitor,'scheduled-alert');
    h.advance(120000);assert.deepEqual(await h.deliverDue(),[]);
  });
  await test('Failed completion UPDATE preserves verified success and reconciles on the next lock owner',async()=>{
    const h=harness(),u=await h.begin(),token=new URL(u).searchParams.get('transfer_id'),f=h.downloaded(u);
    assert.equal(await h.run(u,f,{ackFailure:true}),'');assert.equal(h.report().ok,true);
    assert.match(h.report().message,/NATIVE_ACK_PENDING/);assert.equal(h.row().state,'publishing');assert.deepEqual(h.files.get(target),h.files.get(f[0]));
    h.advance(900000);const next=await h.begin();assert.match(next,/^https:\/\//);
    const row=h.db.prepare('SELECT * FROM map_native_runs WHERE token=?').get(token);assert.equal(row.state,'done');assert.equal(row.code,'OK_RECONCILED');
    assert.equal(h.writes.length,3);assert.equal(h.report().ok,true);
  });
  await test('Repeated acknowledgment SQL failure is reported separately from successful map publication',async()=>{
    const h=harness(),u=await h.begin();await h.run(u,h.downloaded(u),{ackFailure:true});h.advance(900000);
    const result=await h.begin({ackFailure:true});assert.match(result,/NATIVE_ACK_PENDING/);assert.match(result,/המפה השמורה נבדקה ונמצאה תקינה/);
    assert.doesNotMatch(result,/עדכון המפה לא הושלם/);assert.equal(h.row().state,'publishing');assert.equal(h.report().ok,true);assert.equal(h.writes.length,3);
  });
  await test('Reconciliation refuses missing candidate metadata, partial current and a different valid token',async()=>{
    for(const kind of ['no-receipt','partial','different-token']){
      const h=harness(),u=await h.begin();await h.run(u,h.downloaded(u),{ackFailure:true});
      if(kind==='no-receipt')h.db.exec('DELETE FROM map_native_candidates');
      if(kind==='partial')h.files.set(target,bytes.slice(0,25));
      if(kind==='different-token')h.files.set(target,new Uint8Array(tagNativePNG(base,'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')));
      h.advance(900000);assert.match(await h.begin(),/NATIVE_UNCONFIRMED_WRITE/);assert.equal(h.writes.length,3);assert.equal(h.row().state,'publishing');
    }
  });
  await test('Candidate metadata failure occurs before publication and cannot schedule a retry',async()=>{
    const h=harness(),u=await h.begin();assert.match(await h.run(u,h.downloaded(u),{candidateFailure:true}),/לא הושלם/);
    assert.equal(h.writes.length,0);assert.deepEqual(h.files.get(target),bytes);assert.equal(h.pending.length,1);
  });
  await test('Diagnostic report failure still preserves done and silent success',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);assert.equal(await h.run(u,f,{reportFailure:true}),'');
    assert.equal(h.row().state,'done');assert.deepEqual(h.files.get(target),h.files.get(f[0]));
  });
  await test('Lock release failure after verified file is not mislabeled as a failed download',async()=>{
    const h=harness(),u=await h.begin();const result=await h.run(u,h.downloaded(u),{releaseFailure:true});
    assert.match(result,/LOCK_RELEASE/);assert.match(result,/המפה נשמרה ונקראה בחזרה בהצלחה/);assert.equal(h.report().ok,true);
    assert.match(await h.begin(),/MAP_BUSY/);assert.equal(h.writes.length,3);
  });
  await test('Unresolved native overwrite keeps backup and ownership; no timer steals the writer lock',async()=>{
    const h=harness(),u=await h.begin();let resolved=false;h.run(u,h.downloaded(u),{writeHang:true}).then(()=>resolved=true);
    for(let i=0;i<100;i++)await Promise.resolve();assert.equal(resolved,false);
    assert.equal(h.files.get(target).length,25);assert.deepEqual(h.files.get('/docs/MapCacheTest/previous-map.bin'),bytes);
    h.advance(900000);assert.match(await h.begin(),/MAP_BUSY/);assert.equal(h.db.prepare('SELECT count(*) n FROM map_writer').get().n,1);
  });
  await test('Schedule status and stop recognize an alert-only watch without adding automation ticks',async()=>{
    const h=harness();await h.begin();h.advance(120000);await h.deliverDue();h.scripting.Script.env='index';
    const s=h.modules().load('scheduler');assert.match(await s.scheduleStatus(),/בדיקת השלמה/);await s.stopRecurring();assert.equal(h.pending.length,0);
  });
  console.log(checks+' native handoff checks passed. Real Shortcuts file coercion and locked-device automation remain unverified.');
})().catch(e=>{console.error(e);process.exitCode=1});
