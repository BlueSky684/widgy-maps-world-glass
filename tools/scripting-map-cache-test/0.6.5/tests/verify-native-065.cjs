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
  const notifications=[],requests=[],writes=[];
  class Clock extends Date {constructor(...a){super(...(a.length?a:[now]))}static now(){return now}}
  const scripting={Script:{env:'intent',directory:'/script'},AbortController,UUID:{string:()=>`11111111-2222-4333-8444-${String(++seq).padStart(12,'0')}`},
    TimeIntervalNotificationTrigger:class{constructor(p){Object.assign(this,p)}},
    SQLite:{open:()=>{if(mode.sqlFailure)throw Error('SECRET SQL');return {
      execute:async(sql,args=[])=>db.prepare(sql).run(...args),fetchAll:async(sql,args=[])=>db.prepare(sql).all(...args)}}},
    FileManager:{appGroupDocumentsDirectory:'/group',documentsDirectory:'/docs',exists:async p=>files.has(p),
      readAsString:async p=>files.get(p),writeAsString:async(p,s)=>files.set(p,s),readAsStringSync:()=>JSON.stringify({mapAccessKey:'synthetic-private-key-'.repeat(3)}),
      readAsBytes:async p=>{if(mode.readPause&&p.startsWith('/temp/')){now+=mode.readPause;mode.readPause=0}return files.get(p).slice()},
      writeAsBytes:async(p,b)=>{writes.push(p);files.set(p,b.slice());if(mode.writePause&&p.endsWith('candidate.tmp')){now+=mode.writePause;mode.writePause=0}
        if(mode.writeFailure&&p===target){mode.writeFailure=false;files.set(p,b.slice(0,25));throw Error('SECRET WRITE')}},remove:async p=>files.delete(p)},
    Data:{fromUint8Array:b=>b},UIImage:{fromData:()=>{if(mode.pause){now+=mode.pause;mode.pause=0}return{width:2400,height:1131}}},
    Notification:{getAllPendingsOfCurrentScript:async()=>pending.slice(),removePendings:async ids=>{if(mode.cancelFailure)throw Error('SECRET CANCEL');pending=pending.filter(r=>!ids.includes(r.identifier))},
      removeAllPendingsOfCurrentScript:async()=>{pending=[]},schedule:async content=>{notifications.push(content);if(content.trigger){pending.push({identifier:`n-${++seq}`,content,trigger:content.trigger});
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
  return{db,files,requests,writes,notifications,scripting,modules,input,run,advance:ms=>{now+=ms},stop:()=>{pending=[]},get pending(){return pending},
    begin:options=>run('NATIVE2400\n'+input(),[],options),report:()=>JSON.parse(files.get(reportPath)),
    row:()=>db.prepare('SELECT * FROM map_native_runs ORDER BY seq DESC LIMIT 1').get(),
    downloaded(url,tokenOverride){const token=tokenOverride||new URL(url).searchParams.get('transfer_id'),file='/temp/download.png';files.set(file,new Uint8Array(tagNativePNG(base,token)));return[file]},
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
  for(const [name,advance,options] of [['late HTTP',20000,{}],['native decode pause',0,{pause:61200}],['file read pause',0,{readPause:21000}],['stage I/O pause',0,{writePause:21000}],['clock moved backward',-1000,{}]])await test(name+' cannot start a current overwrite',async()=>{
    const h=harness(),u=await h.begin(),f=h.downloaded(u);h.advance(advance);assert.match(await h.run(u,f,options),/לא הושלם/);assert(!h.writes.includes(target));assert.deepEqual(h.files.get(target),bytes);
  });
  await test('No completion -> later automation reports incomplete, does not fetch; next regular attempt can recover',async()=>{
    const h=harness(),u=await h.begin();h.fire();assert.match(await h.begin(),/NATIVE_INCOMPLETE/);assert.equal(h.row().state,'failed');assert.equal(h.requests.length,0);assert.equal(h.notifications.length,1);
    h.advance(900000);const next=await h.begin();assert.notEqual(next,u);assert.equal(await h.run(next,h.downloaded(next)),'');assert.equal(h.report().ok,true);
    const history=await h.modules().load('native-transfer').nativeHistory();assert.match(history,/NATIVE_INCOMPLETE/);assert.match(history,/הצליח/);
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
  console.log(checks+' native handoff checks passed. Real Shortcuts file coercion and locked-device automation remain unverified.');
})().catch(e=>{console.error(e);process.exitCode=1});
