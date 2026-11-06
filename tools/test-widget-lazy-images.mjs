import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('cold Home JSON and TODAY imports avoid image engine and weather artwork',()=>{
  const output=execFileSync(process.execPath,['--input-type=module','-e',`
    import assert from 'node:assert/strict';
    import {registerHooks} from 'node:module';
    const imageImports=[];
    registerHooks({resolve(s,c,next){
      if(s==='sharp'||s.endsWith('/render.js'))imageImports.push(s);
      return next(s,c);
    }});
    const {default:weather}=await import('./lib/weather/handler.js');
    await import('./api/calendar-widget.js');
    const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){return this;}});
    const json=await weather({method:'GET',url:'/api/weather-panel?format=json&view=home-v1'},response());
    assert.equal(json.code,200);assert.equal(json.body.state,'location');
    assert.deepEqual(imageImports,[],'Neither text route initializes image code');
    const png=await weather({method:'GET',url:'/api/weather-panel?v=15'},response());
    assert.equal(png.code,200);assert(Buffer.isBuffer(png.body));
    assert.equal(png.body.subarray(1,4).toString(),'PNG');
    assert(imageImports.includes('./render.js'));assert(imageImports.includes('sharp'));
    const {renderDots,monthWindow}=await import('./lib/calendar-bridge/dots.js');
    const dots=await renderDots([],monthWindow({now:new Date('2026-11-06T12:00:00Z')}),{bounds:'grid'});
    assert.equal(dots.subarray(1,4).toString(),'PNG');
    console.log('PASS lazy image imports and both PNG contracts');
  `],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
  assert(output.includes('PASS lazy image imports and both PNG contracts'));
});

test('provider diagnostics preserve results and errors without private payloads',async()=>{
  const {readEvents}=await import('../lib/calendar-bridge/providers.js');
  const {monthWindow}=await import('../lib/calendar-bridge/dots.js');
  const originalFetch=globalThis.fetch,originalLog=console.info,rows=[];
  const state={google:{refresh:'PRIVATE_REFRESH_DIAGNOSTIC'},sources:[{provider:'google',id:'PRIVATE_CALENDAR',color:0}]};
  let failed=false;
  console.info=line=>rows.push(JSON.parse(line));
  globalThis.fetch=async input=>{
    const url=new URL(input);
    if(url.hostname==='oauth2.googleapis.com')return Response.json({access_token:'PRIVATE_ACCESS',expires_in:3600});
    if(failed)return new Response('PRIVATE_ERROR',{status:503});
    return Response.json({items:[{id:'PRIVATE_ID',summary:'PRIVATE_TITLE',start:{date:'2026-11-06'},end:{date:'2026-11-07'}}]});
  };
  try {
    const window=monthWindow({now:new Date('2026-11-06T12:00:00Z')});
    const events=await readEvents(state,window);assert.equal(events[0].title,'PRIVATE_TITLE');
    failed=true;await assert.rejects(readEvents(state,window),e=>e.code==='google_read_failed');
    assert.equal(rows.length,4);assert.equal(rows.at(-1).ok,false);
    assert(!JSON.stringify(rows).includes('PRIVATE_'));
    for(const row of rows){
      assert.deepEqual(Object.keys(row).sort(),['elapsedMs','event','ok','provider','stage'].sort());
      assert(Number.isFinite(row.elapsedMs)&&row.elapsedMs>=0);
    }
    console.info=()=>{throw Error('logger unavailable');};failed=false;
    assert.equal((await readEvents(state,window))[0].title,'PRIVATE_TITLE');
  } finally {globalThis.fetch=originalFetch;console.info=originalLog;}
});
