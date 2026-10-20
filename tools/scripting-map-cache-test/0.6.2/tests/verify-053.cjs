const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module');
const root=__dirname+'/..';
class SafeMapError extends Error {}
function moduleOf(name,names,globals={}) {
  let js=stripTypeScriptTypes(fs.readFileSync(root+'/'+name,'utf8'),{mode:'transform'});
  js=js.replace(/^import .*\n/gm,'').replace(/^export \{.*\} from .*\n/gm,'').replace(/\bexport /g,'');
  const ctx=vm.createContext({Uint8Array,Date,Promise,SafeMapError,WIDTH:2400,HEIGHT:1131,...globals});
  vm.runInContext(js+'\nthis.result={'+names.join(',')+'}',ctx);
  return ctx.result;
}
const core=moduleOf('core.ts',['checkPNG','preparePublisher','publishCandidate','equalBytes']);
const {DownloadTrace,DownloadError}=moduleOf('download-trace.ts',['DownloadTrace','DownloadError'],{setTimeout,clearTimeout});
const {OperationTrace}=moduleOf('operation-trace.ts',['OperationTrace'],{setTimeout,clearTimeout});
const {UpdateTiming}=moduleOf('timing.ts',['UpdateTiming']);
const bytes=new Uint8Array(fs.readFileSync(__dirname+'/test-fixture.png'));
const paths={current:'current',stage:'stage',backup:'backup'};
function ioFixture(options={}) {
  const files=new Map(options.empty?[]:[['current',bytes.slice()]]), writes=[], reads=[];
  let failCurrent=!!options.failCurrent;
  const io={
    async exists(p){return files.has(p)},
    async read(p){reads.push(p);if(!files.has(p))throw Error('missing');return files.get(p).slice()},
    async write(p,b){writes.push(p);if(options.failStage&&p==='stage')throw Error('write');
      if(options.failBackup&&p==='backup')throw Error('write');
      if(failCurrent&&p==='current'){failCurrent=false;files.set(p,b.subarray(0,40));throw Error('write');}
      files.set(p,b.slice());},
    async remove(p){files.delete(p)}
  };
  return {io,files,writes,reads};
}
let checks=0;
async function test(name,fn){await fn();checks++;console.log('PASS '+name)}
(async()=>{
  await test('2400px PNG fixture validates',async()=>{
    const s=core.checkPNG(bytes);assert.equal(s.width,2400);assert.equal(s.height,1131);
  });
  await test('Prepared publication reads old current once and verifies all writes',async()=>{
    const f=ioFixture();const p=await core.preparePublisher(f.io,paths);assert.equal(p.hasCurrent,true);
    let decoded=0,gated=0;
    await p.publish(bytes,async()=>{decoded++},()=>{gated++});
    assert.equal(decoded,1);assert.equal(gated,1);
    assert.deepEqual(f.writes,['stage','backup','current']);
    assert.deepEqual(f.reads,['current','stage','backup','current']);
    assert.deepEqual(f.files.get('current'),bytes);assert.deepEqual(f.files.get('backup'),bytes);
    assert.equal(f.files.has('stage'),false);
  });
  await test('Truncated or CRC-corrupt downloads cannot write any file',async()=>{
    const corrupt=bytes.slice();corrupt[50]^=1;
    for(const candidate of [bytes.subarray(0,bytes.length-10),corrupt]){
      const f=ioFixture(),p=await core.preparePublisher(f.io,paths);
      await assert.rejects(()=>p.publish(candidate,async()=>{},()=>{}));
      assert.equal(f.writes.length,0);assert.deepEqual(f.files.get('current'),bytes);
    }
  });
  await test('Native decode rejection leaves old map intact',async()=>{
    const f=ioFixture(),p=await core.preparePublisher(f.io,paths);
    await assert.rejects(()=>p.publish(bytes,async()=>{throw Error('decode')},()=>{}));
    assert.equal(f.writes.length,0);
  });
  await test('Candidate arriving after shared deadline cannot begin publication',async()=>{
    let now=0;const timing=new UpdateTiming(()=>now),f=ioFixture(),p=await core.preparePublisher(f.io,paths);
    now=20001;
    await assert.rejects(()=>p.publish(bytes,async()=>{},()=>timing.remaining()),/UPDATE_TIME/);
    assert.equal(f.writes.length,0);assert.deepEqual(f.files.get('current'),bytes);
  });
  await test('Deadline reached during decode cannot begin publication',async()=>{
    let now=19000;const timing=new UpdateTiming(()=>now),f=ioFixture(),p=await core.preparePublisher(f.io,paths);
    now=38000;
    await assert.rejects(()=>p.publish(bytes,async()=>{now=40000},()=>timing.remaining()),/UPDATE_TIME/);
    assert.equal(f.writes.length,0);
  });
  await test('Stage or backup write failure preserves current',async()=>{
    for(const options of [{failStage:true},{failBackup:true}]){
      const f=ioFixture(options),p=await core.preparePublisher(f.io,paths);
      await assert.rejects(()=>p.publish(bytes,async()=>{},()=>{}));
      assert.deepEqual(f.files.get('current'),bytes);assert.equal(f.files.has('stage'),false);
    }
  });
  await test('Interrupted current write restores original map and retains backup',async()=>{
    const f=ioFixture({failCurrent:true}),p=await core.preparePublisher(f.io,paths);
    await assert.rejects(()=>p.publish(bytes,async()=>{},()=>{}));
    assert.deepEqual(f.files.get('current'),bytes);assert.deepEqual(f.files.get('backup'),bytes);
  });
  await test('Prepared snapshot cannot be reused for another publication',async()=>{
    const f=ioFixture(),p=await core.preparePublisher(f.io,paths);
    await p.publish(bytes,async()=>{},()=>{});const n=f.writes.length;
    await assert.rejects(()=>p.publish(bytes,async()=>{},()=>{}));assert.equal(f.writes.length,n);
  });
  await test('Manual publication preserves legacy validation and backup behavior',async()=>{
    const f=ioFixture();await core.publishCandidate(f.io,paths,bytes,async()=>{});
    assert.deepEqual(f.files.get('current'),bytes);assert.deepEqual(f.files.get('backup'),bytes);
  });
  await test('Location and download share one remaining-time budget',async()=>{
    let now=0;const t=new UpdateTiming(()=>now);assert.equal(t.remaining(8000),8000);
    now=7000;assert.equal(t.remaining(),13000);now=19999;assert.equal(t.remaining(),1);
    now=20000;assert.throws(()=>t.remaining(),/UPDATE_TIME/);
  });
  await test('Phase durations and total reflect elapsed time',async()=>{
    let now=0;const t=new UpdateTiming(()=>now);now=1000;t.mark('prep');now=3500;t.mark('location');
    assert.match(t.summary(),/prep: 1.0.*location: 2.5/);assert.equal(t.total(),'3.5');
  });
  // Run the real writer with its real publisher, using mocked native APIs.
  function writerFixture({locationMs=0,downloadMs=0,decodeMs=0}={}){
    const f=ioFixture();let now=0,unlock=0,downloadCalls=0;
    class FakeDate extends Date {static now(){return now}}
    const timing=moduleOf('timing.ts',['UpdateTiming'],{Date:FakeDate}).UpdateTiming;
    const record={schema:2,bookmarkName:'map',folderId:'11111111-1111-1111-1111-111111111111'};
    const native={Script:{env:'intent'},FileManager:{appGroupDocumentsDirectory:'/group',async readAsString(p){
      return p.endsWith('writer.json')?JSON.stringify(record):record.folderId;
    }}};
    const parser=moduleOf('shortcut-location.ts',['shortcutLocation','shortcutTimingSummary'],{Date:FakeDate});
    const raw=moduleOf('writer.ts',['runShortcutUpdate'],{
      Date:FakeDate,OperationTrace,DownloadTrace,UpdateTiming:timing,...parser,api:n=>native[n],
      withMapLock:async work=>{try{return await work()}finally{unlock++}},
      bookmarkedMap:async()=>'/map/current',preparePublisher:async()=>{now+=locationMs;return core.preparePublisher(f.io,paths)},
      disk:()=>f.io,currentLocation:async()=>{throw Error('Native location must never be called')},
      liveMapURL:()=> 'https://local.invalid',accessKey:()=> 'not-a-real-key',
      downloadForPublication:async(url,limit)=>{downloadCalls++;assert.ok(limit<=20000-now);now+=downloadMs;return bytes},
      decode:async()=>{now+=decodeMs}
    });
    const w={runShortcutUpdate:(input='0\n0\n1970-01-01T00:00:00Z')=>raw.runShortcutUpdate(input)};
    return {...f,w,get unlock(){return unlock},get downloadCalls(){return downloadCalls}};
  }
  await test('Actual writer returns success only after verified publication and lock cleanup',async()=>{
    const f=writerFixture({locationMs:3000,downloadMs:6000,decodeMs:1000});const out=await f.w.runShortcutUpdate();
    assert.match(out,/עדכון המפה הצליח/);assert.match(out,/10.0 שניות/);assert.match(out,/מקור המיקום: קיצורים/);
    assert.equal(f.unlock,1);assert.deepEqual(f.files.get('current'),bytes);
  });
  await test('Actual writer rejects late download and releases lock without publication',async()=>{
    const f=writerFixture({locationMs:7000,downloadMs:15000});const out=await f.w.runShortcutUpdate();
    assert.match(out,/לא הושלם/);assert.match(out,/UPDATE_TIME/);assert.equal(f.unlock,1);assert.equal(f.writes.length,0);
  });
  await test('Late preparation does not start a download',async()=>{
    const f=writerFixture({locationMs:21000});const out=await f.w.runShortcutUpdate();
    assert.match(out,/לא הושלם/);assert.equal(f.downloadCalls,0);assert.equal(f.writes.length,0);assert.equal(f.unlock,1);
  });
  await test('Network timer aborts a slow download and ignores a late response',async()=>{
    let timer,aborts=0;
    class Controller {signal={};abort(){aborts++}}
    let finish;const fetchPromise=new Promise(resolve=>{finish=resolve});
    const b=moduleOf('bridge.ts',['downloadForPublication'],{
      DownloadTrace,DownloadError,api:n=>({AbortController:Controller,fetch:()=>fetchPromise})[n],
      setTimeout:fn=>{timer=fn;return 1},clearTimeout:()=>{},MAX_BYTES:6*1024*1024,
      checkPNG:()=>{throw Error('Should validate only in publisher')}
    });
    const result=b.downloadForPublication('https://local.invalid',12000);timer();
    await assert.rejects(()=>result,/DOWNLOAD_TIMEOUT/);assert.ok(aborts>0);
    finish({status:200,headers:{get:k=>k==='content-type'?'image/png':null},data:async()=>({size:bytes.length,toUint8Array:()=>bytes})});
    await Promise.resolve();
  });
  await test('Missing input never accesses disk, network or location',async()=>{
    const f=writerFixture();const out=await f.w.runShortcutUpdate(null);
    assert.match(out,/SHORTCUT_LOCATION_SETUP/);assert.equal(f.unlock,0);assert.equal(f.reads.length,0);assert.equal(f.downloadCalls,0);
  });
  await test('Input parser accepts zero, negative and decimal comma coordinates',async()=>{
    const parse=moduleOf('shortcut-location.ts',['shortcutLocation']).shortcutLocation;
    const now=Date.parse('2026-10-19T20:25:00+03:00');
    const p=parse('0\n-35,12345\n2026-10-19T20:24:50+03:00',now);
    assert.equal(p.latitude,0);assert.equal(p.longitude,-35.12345);assert.equal(now-p.requestedAt,10000);
  });
  await test('Invalid, old, future and ambiguous location input is rejected',async()=>{
    const parse=moduleOf('shortcut-location.ts',['shortcutLocation']).shortcutLocation;
    const now=Date.parse('2026-10-19T20:25:00+03:00');
    for(const value of [null,'','31\n35','91\n35\n2026-10-19T20:25:00+03:00',
      '31units\n35\n2026-10-19T20:25:00+03:00','31\n181\n2026-10-19T20:25:00+03:00',
      '31\n35\n19/10/2026 20:25','31\n35\n2026-10-19T20:22:59+03:00',
      '31\n35\n2026-10-19T20:26:00+03:00','31\n35\n2026-10-19T20:25:00']) {
      assert.throws(()=>parse(value,now));
    }
  });
  await test('Input that expires during preparation cannot download or write',async()=>{
    const f=writerFixture({locationMs:121000});const out=await f.w.runShortcutUpdate();
    assert.match(out,/SHORTCUT_LOCATION_AGE/);assert.equal(f.downloadCalls,0);assert.equal(f.writes.length,0);assert.equal(f.unlock,1);
  });

  const iso=ms=>new Date(ms).toISOString();
  const inputAt=(start,ready)=>'31.78901\n34.78901\n'+iso(start)+(ready===undefined?'':'\n'+iso(ready));
  async function rejectedInput(input,code) {
    const f=writerFixture(),out=await f.w.runShortcutUpdate(input);
    assert.match(out,new RegExp(code));
    assert.equal(f.unlock,0);assert.equal(f.reads.length,0);
    assert.equal(f.writes.length,0);assert.equal(f.downloadCalls,0);
    assert.ok(!out.includes('31.78901'));assert.ok(!out.includes('34.78901'));
    return out;
  }
  await test('Old three-line request reports actual age before any I/O',async()=>{
    const out=await rejectedInput(inputAt(-150000),'SHORTCUT_LOCATION_AGE');
    assert.match(out,/עד Scripting: 150.0/);assert.match(out,/אבחון חלקי/);
    assert.match(out.split('\n').slice(0,6).join('\n'),/המגבלה היא 120/);
  });
  await test('Four-line diagnostics isolate a long pre-location-completion interval',async()=>{
    const out=await rejectedInput(inputAt(-150000,-10000),'SHORTCUT_LOCATION_AGE');
    assert.match(out,/עד סיום המיקום: 140.0.*לסקריפט: 10.0/);
  });
  await test('Four-line diagnostics isolate a long post-location-completion interval',async()=>{
    const out=await rejectedInput(inputAt(-150000,-140000),'SHORTCUT_LOCATION_AGE');
    assert.match(out,/עד סיום המיקום: 10.0.*לסקריפט: 140.0/);
  });
  await test('Future start and future completion have their own code and cannot write',async()=>{
    for(const input of [inputAt(6000),inputAt(-1000,6000)]) {
      const out=await rejectedInput(input,'SHORTCUT_CLOCK_FUTURE');
      assert.ok(!out.includes('SHORTCUT_LOCATION_AGE'));
    }
  });
  await test('Reversed timestamps cannot write',async()=>{
    await rejectedInput(inputAt(-1000,-2000),'SHORTCUT_TIME_ORDER');
  });
  await test('Malformed fourth timestamp and unparseable date cannot write or leak input',async()=>{
    for(const tail of ['SECRET','2026-99-99T99:99:99Z']) {
      const out=await rejectedInput(inputAt(-1000)+'\n'+tail,'SHORTCUT_DATE_');
      assert.ok(!out.includes('SECRET'));assert.ok(!out.includes(tail));
    }
  });
  await test('Fresh completion does not refresh an expired start timestamp',async()=>{
    await rejectedInput(inputAt(-120001,0),'SHORTCUT_LOCATION_AGE');
  });
  await test('Fresh four-line request publishes and retains entry timing after later work',async()=>{
    const f=writerFixture({locationMs:3000,downloadMs:4000});
    const out=await f.w.runShortcutUpdate(inputAt(-2000,-1000));
    assert.match(out,/עדכון המפה הצליח/);assert.match(out,/7.0 שניות/);
    assert.match(out,/עד Scripting: 2.0/);assert.match(out,/עד סיום המיקום: 1.0.*לסקריפט: 1.0/);
    assert.deepEqual(f.writes,['stage','backup','current']);
  });
  await test('120-second and 5-second boundaries retain exact original guards',async()=>{
    const {shortcutLocation:parse}=moduleOf('shortcut-location.ts',['shortcutLocation']);
    parse(inputAt(-120000,0),0);parse(inputAt(5000),0);
    assert.throws(()=>parse(inputAt(-120001,0),0),/SHORTCUT_LOCATION_AGE/);
    assert.throws(()=>parse(inputAt(5001),0),/SHORTCUT_CLOCK_FUTURE/);
  });
  await test('Explicit timezone offsets yield correct stage intervals',async()=>{
    const {shortcutLocation:parse,shortcutTimingSummary:summary}=moduleOf('shortcut-location.ts',['shortcutLocation','shortcutTimingSummary']);
    const now=Date.parse('2026-10-20T07:00:00Z');
    const input='0\n-35,12345\n2026-10-20T09:59:50+03:00\n2026-10-20T08:59:55+0200';
    assert.equal(parse(input,now).longitude,-35.12345);
    assert.match(summary(input,now),/עד Scripting: 10.0/);
    assert.match(summary(input,now),/עד סיום המיקום: 5.0.*לסקריפט: 5.0/);
  });
  console.log(checks+' checks passed. Device timing and native timeout resolution remain unverified.');
})().catch(e=>{console.error(e);process.exit(1)});
