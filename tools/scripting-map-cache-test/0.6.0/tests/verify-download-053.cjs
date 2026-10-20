const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const root=__dirname+'/..';
class SafeMapError extends Error {}
function load(file,names,globals={}) {
  const js=stripTypeScriptTypes(fs.readFileSync(root+'/'+file,'utf8'),{mode:'transform'})
    .replace(/^import .*\n/gm,'').replace(/^export \{.*\} from .*\n/gm,'').replace(/\bexport /g,'');
  const context=vm.createContext({Uint8Array,Date,Promise,SafeMapError,...globals});
  vm.runInContext(js+'\nthis.result={'+names.join(',')+'}',context);return context.result;
}
const core=load('core.ts',['preparePublisher','MAX_BYTES','checkPNG']);
const png=new Uint8Array(fs.readFileSync(__dirname+'/test-fixture.png'));
function harness(options={}) {
  let now=1800000000000,id=0,aborts=0,bodyCalls=0,converts=0,unlocks=0;
  const timers=new Map(),writes=[],files=new Map([['current',png.slice()]]);
  class Clock extends Date {static now(){return now}}
  const globals={Date:Clock,setTimeout:(fn,ms)=>{const n=++id;timers.set(n,{fn,at:now+ms});return n},clearTimeout:n=>timers.delete(n)};
  const jump=ms=>{now+=ms};
  const advance=ms=>{const end=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;timers.delete(due[0]);now=due[1].at;due[1].fn()}now=end};
  const traceTypes={...load('download-trace.ts',['DownloadTrace','DownloadError'],globals),...load('operation-trace.ts',['OperationTrace'],globals)};
  const response={status:options.status||200,headers:{get(name){return ({'x-map-service':'vercel-file-v1','content-type':options.mime||'image/png','content-length':String(png.length),'server-timing':'map;dur=825.4','x-map-rendered-at':'2026-10-20T02:00:00.000Z','x-map-request-id':'4fa5d1e2-c81d-468e-9006-eee4b90c60ac',...options.headers})[name]||null}},
    async data(){bodyCalls++;if(options.body)await options.body({jump,advance});return {size:png.length,toUint8Array(){converts++;jump(options.convertMs||0);return png}}}};
  class Controller{signal={};abort(){aborts++}}
  const bridge=load('bridge.ts',['downloadForPublication'],{...globals,...traceTypes,...core,api:n=>({AbortController:Controller,fetch:async()=>{if(options.fetch)await options.fetch({jump,advance,response});return response}})[n]});
  const trace=new traceTypes.DownloadTrace();
  const alias=p=>p.endsWith('/candidate.tmp')?'stage':p.endsWith('/previous-map.bin')?'backup':p.endsWith('/current')?'current':p;
  const io={async exists(p){return files.has(alias(p))},async read(p){return files.get(alias(p)).slice()},async write(p,b){p=alias(p);writes.push(p);files.set(p,b.slice());if(p===options.pauseWrite)jump(66000);if(p===options.slowWrite)advance(26600);if(p===options.failWrite)throw Error('SECRET native file path')},async remove(p){if(options.cleanupMs)jump(options.cleanupMs);files.delete(alias(p))}};
  const timing=load('timing.ts',['UpdateTiming'],globals);
  const parser=load('shortcut-location.ts',['shortcutLocation','shortcutTimingSummary'],globals);
  const binding={schema:2,bookmarkName:'map',folderId:'11111111-1111-1111-1111-111111111111'};
  const native={Script:{env:'intent'},UUID:{string:()=> 'owner'},FileManager:{appGroupDocumentsDirectory:'/group',async readAsString(p){return p.endsWith('writer.json')?JSON.stringify(binding):binding.folderId}},SQLite:{open:()=>({async execute(sql){if(sql.startsWith('DELETE')){unlocks++;jump(options.releaseMs||0);if(options.failRelease)throw Error('SECRET release')}}})}};
  const lock=load('lock.ts',['withMapLock'],{...globals,api:n=>native[n]});
  const writer=load('writer.ts',['runShortcutUpdate'],{...globals,...traceTypes,...timing,...parser,...lock,
    api:n=>native[n],bookmarkedMap:async()=>{advance(options.setupMs||0);return '/map/current'},
    preparePublisher:(wrapped,paths)=>core.preparePublisher(wrapped,paths),disk:()=>io,
    liveMapURL:()=> 'https://local.invalid/?location_key=SECRET',accessKey:()=> 'SECRET',
    downloadForPublication:bridge.downloadForPublication,decode:async()=>{jump(options.decodeMs||0)}
  });
  return {trace,timers,writes,files,advance,jump,response,
    download:()=>bridge.downloadForPublication('https://local.invalid/?location_key=SECRET',20000,trace),
    write:()=>writer.runShortcutUpdate('0\n0\n'+new Date(now).toISOString()),
    get aborts(){return aborts},get bodyCalls(){return bodyCalls},get converts(){return converts},get unlocks(){return unlocks}};
}
let count=0;
async function test(name,fn){await fn();count++;console.log('PASS '+name)}
(async()=>{
  await test('Healthy full pipeline publishes original bytes and stops every timer',async()=>{
    const h=harness({fetch:async({advance})=>advance(2500),body:async({advance})=>advance(800)});
    const out=await h.write();assert.match(out,/עדכון המפה הצליח/);assert.match(out,/HTTP: 2.5.*BODY: 0.8/);
    assert.match(out,/0.83 ש׳/);assert.match(out,/0.5 ש׳/);assert.equal(h.timers.size,0);assert.equal(h.unlocks,1);
    assert.deepEqual(h.writes,['stage','backup','current']);assert.deepEqual(h.files.get('current'),png);
  });
  await test('Wrong or missing deployment marker never reads or publishes the PNG',async()=>{
    for(const service of [null,'cloud-run-trial-v1']) {
      const h=harness({headers:{'x-map-service':service}}),out=await h.write();
      assert.match(out,/DOWNLOAD_SERVICE/);assert.equal(h.bodyCalls,0);assert.equal(h.writes.length,0);assert.equal(h.timers.size,0);
    }
  });
  for(const ms of [65800,248700]) await test(`Late HTTP continuation at ${ms}ms, with timers suspended, cannot read body or publish`,async()=>{
    const h=harness({fetch:async({jump})=>jump(ms)}),out=await h.write();
    assert.match(out,/DOWNLOAD_LATE_HTTP/);assert.match(out,/שלב: הורדת המפה/);assert.equal(h.bodyCalls,0);
    assert.equal(h.writes.length,0);assert.deepEqual(h.files.get('current'),png);assert.equal(h.unlocks,1);assert.equal(h.timers.size,0);assert.ok(h.aborts);
  });
  await test('Late body completion cannot convert, decode, or publish',async()=>{
    const h=harness({body:async({jump})=>jump(66000)}),out=await h.write();
    assert.match(out,/DOWNLOAD_LATE_BODY/);assert.equal(h.converts,0);assert.equal(h.writes.length,0);assert.equal(h.timers.size,0);
  });
  await test('Synchronous conversion crossing deadline cannot publish',async()=>{
    const h=harness({convertMs:66000}),out=await h.write();assert.match(out,/DOWNLOAD_LATE_CONVERT/);assert.equal(h.writes.length,0);
  });
  await test('Slow native decode cannot begin temporary writes',async()=>{
    const h=harness({decodeMs:66000}),out=await h.write();assert.match(out,/UPDATE_TIME/);assert.equal(h.writes.length,0);
  });
  for(const pauseWrite of ['stage','backup']) await test(`Suspension during ${pauseWrite} write cannot begin current-file overwrite`,async()=>{
    const h=harness({pauseWrite}),out=await h.write();assert.match(out,/UPDATE_TIME/);
    assert.ok(!h.writes.includes('current'));assert.deepEqual(h.files.get('current'),png);assert.equal(h.files.has('stage'),false);assert.equal(h.unlocks,1);
  });
  await test('Live event loop times out at budget and late fetch cannot mutate report or read body',async()=>{
    let resume;const h=harness({fetch:()=>new Promise(resolve=>{resume=resolve})});
    const p=h.download();h.advance(20000);await assert.rejects(p,/DOWNLOAD_TIMEOUT/);
    const summary=h.trace.summary(),compact=h.trace.compactSummary();assert.match(summary,/איחור טיימר העצירה: 0.0/);assert.equal(h.timers.size,0);
    resume();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(h.bodyCalls,0);assert.equal(h.trace.summary(),summary);assert.equal(h.trace.compactSummary(),compact);assert.equal(h.timers.size,0);
  });
  await test('Overdue timeout records callback lag when timer runs first after pause',async()=>{
    const h=harness({fetch:()=>new Promise(()=>{})}),p=h.download();h.jump(66000);
    const timeout=[...h.timers.values()].sort((a,b)=>b.at-a.at)[0];timeout.fn();
    await assert.rejects(p,/DOWNLOAD_TIMEOUT/);assert.match(h.trace.summary(),/איחור טיימר העצירה: 46.0/);
    assert.match(h.trace.summary(),/66.0 ש׳/);assert.equal(h.timers.size,0);
  });
  await test('Native network error is sanitized; credentials never reach returned diagnostics',async()=>{
    const h=harness({fetch:async()=>{throw Error('https://private/?location_key=SECRET')}}),out=await h.write();
    assert.match(out,/DOWNLOAD_NETWORK/);assert.ok(!out.includes('SECRET'));assert.equal(h.writes.length,0);assert.equal(h.timers.size,0);
  });
  await test('Late native error reports exceeded deadline rather than an unqualified network failure',async()=>{
    const h=harness({fetch:async({jump})=>{jump(66000);throw Error('SECRET')}}),out=await h.write();
    assert.match(out,/DOWNLOAD_LATE_HTTP/);assert.ok(!out.includes('SECRET'));assert.equal(h.writes.length,0);
  });
  await test('HTTP failure, wrong MIME and truncated lengths fail before publication',async()=>{
    for(const opts of [{status:503},{mime:'text/html'},{headers:{'content-length':'123'}}]){
      const h=harness(opts),out=await h.write();assert.match(out,/לא הושלם/);assert.equal(h.writes.length,0);assert.equal(h.timers.size,0);
    }
  });
  await test('Untrusted response header text is excluded from reports',async()=>{
    const h=harness({headers:{'server-timing':'SECRET','x-map-rendered-at':'SECRET','x-map-request-id':'SECRET'}});
    await h.download();assert.ok(!h.trace.summary().includes('SECRET'));assert.equal(h.timers.size,0);
  });
  await test('Backward clock change stops publication',async()=>{
    const h=harness({fetch:async({jump})=>jump(-1000)}),out=await h.write();assert.match(out,/CLOCK_CHANGED/);assert.equal(h.writes.length,0);
  });
  await test('31.9 second reproduction identifies slow file I/O with responsive timers and keeps code at top',async()=>{
    const h=harness({setupMs:200,fetch:async({advance})=>advance(1600),body:async({advance})=>advance(3300),decodeMs:200,slowWrite:'stage'});
    const out=await h.write(),top=out.split('\n').slice(0,5).join('\n');
    assert.match(top,/UPDATE_TIME/);assert.match(top,/31.9 שניות/);assert.match(top,/כתיבת זמני · 26.6/);
    assert.match(top,/פער מרבי במדידות ההרצה: 0.5/);assert.match(top,/לא התחילה החלפת המפה/);
    assert.ok(!h.writes.includes('current'));assert.equal(h.timers.size,0);
  });
  await test('Paused file continuation records a large runtime gap',async()=>{
    const h=harness({pauseWrite:'stage'}),out=await h.write();
    assert.match(out,/כתיבת זמני · 66.0/);assert.match(out,/פער מרבי במדידות ההרצה: 66.0/);
    assert.ok(!h.writes.includes('current'));assert.equal(h.timers.size,0);
  });
  await test('Native file error remains distinguishable from elapsed-budget rejection',async()=>{
    const h=harness({failWrite:'stage'}),out=await h.write();
    assert.match(out.split('\n')[1],/FILE_IO/);assert.match(out,/פעולה שדיווחה שגיאה: כתיבת זמני/);
    assert.ok(!out.includes('SECRET'));assert.ok(!h.writes.includes('current'));assert.equal(h.timers.size,0);
  });
  await test('A slow successful lock release is identified separately after a valid publication',async()=>{
    const h=harness({releaseMs:26600}),out=await h.write();
    assert.match(out,/עדכון המפה הצליח/);assert.match(out,/שחרור נעילה · 26.6/);
    assert.ok(h.writes.includes('current'));assert.equal(h.timers.size,0);
  });
  await test('Lock release failure shows code and publication state before verbose details',async()=>{
    const h=harness({releaseMs:26600,failRelease:true}),out=await h.write();
    assert.match(out.split('\n')[1],/LOCK_RELEASE/);assert.match(out.split('\n')[2],/החלה החלפת מפה/);
    assert.match(out,/שחרור נעילה · 26.6/);assert.ok(!out.includes('SECRET'));assert.equal(h.timers.size,0);
  });
  await test('Late cleanup is measured independently of temporary/backup writes',async()=>{
    const h=harness({cleanupMs:26600}),out=await h.write();
    assert.match(out,/ניקוי זמני · 26.6/);assert.match(out,/עדכון המפה הצליח/);assert.equal(h.timers.size,0);
  });
  await test('Clipped fetch-timeout notification preserves phase, missing response and timer evidence',async()=>{
    let entered,resume;const started=new Promise(resolve=>{entered=resolve});
    const h=harness({fetch:()=>{entered();return new Promise(resolve=>{resume=resolve})}});
    const pending=h.write();await started;h.advance(20000);const out=await pending,top=out.slice(0,320);
    assert.match(top,/DOWNLOAD_TIMEOUT/);assert.match(top,/לא התחילה החלפת המפה/);
    assert.match(top,/שלב הורדה: HTTP · תשובת HTTP: טרם נצפתה/);
    assert.match(top,/HTTP: 20.0/);assert.match(top,/פער הורדה: 0.5/);assert.match(top,/איחור עצירה: 0.0/);
    assert.equal(h.writes.length,0);assert.deepEqual(h.files.get('current'),png);assert.equal(h.unlocks,1);assert.equal(h.timers.size,0);
    resume();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.bodyCalls,0);assert.equal(h.writes.length,0);
  });
  await test('Body timeout distinguishes received HTTP 200 from incomplete data within clipped text',async()=>{
    let entered,resume;const started=new Promise(resolve=>{entered=resolve});
    const h=harness({fetch:async({advance})=>advance(3500),body:()=>{entered();return new Promise(resolve=>{resume=resolve})}});
    const pending=h.write();await started;h.advance(16500);const out=await pending,top=out.slice(0,320);
    assert.match(top,/DOWNLOAD_TIMEOUT/);assert.match(top,/שלב הורדה: BODY · תשובת HTTP: 200/);
    assert.match(top,/HTTP: 3.5 · BODY: 16.5/);assert.match(top,/פער הורדה: 0.5/);
    assert.equal(h.writes.length,0);assert.equal(h.converts,0);assert.equal(h.unlocks,1);assert.equal(h.timers.size,0);
    resume();await new Promise(resolve=>setImmediate(resolve));assert.equal(h.converts,0);assert.equal(h.writes.length,0);
  });
  await test('An observed late response is not mislabeled as missing HTTP response',async()=>{
    const h=harness({fetch:async({jump})=>jump(66000)}),out=await h.write(),top=out.slice(0,320);
    assert.match(top,/DOWNLOAD_LATE_HTTP/);assert.match(top,/תשובת HTTP: 200/);assert.match(top,/HTTP: 66.0/);
    assert.equal(h.bodyCalls,0);assert.equal(h.writes.length,0);
  });
  await test('HTTP service error status is visible near the top without leaking arbitrary headers',async()=>{
    const h=harness({status:503,headers:{'server-timing':'SECRET','x-map-rendered-at':'SECRET','x-map-request-id':'SECRET'}}),out=await h.write();
    assert.match(out.slice(0,320),/DOWNLOAD_HTTP/);assert.match(out.slice(0,320),/תשובת HTTP: 503/);
    assert.ok(!out.includes('SECRET'));assert.equal(h.bodyCalls,0);assert.equal(h.writes.length,0);assert.equal(h.timers.size,0);
  });
  await test('No fabricated download evidence exists before a download starts',async()=>{
    const h=harness();assert.equal(h.trace.compactSummary(),'');assert.equal(h.timers.size,0);
  });
  console.log(count+' focused failure checks passed. Mocked clock/native APIs; not an iPhone background execution test.');
})().catch(e=>{console.error(e);process.exit(1)});
