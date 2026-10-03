import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {appleHolidayEvents,listCalendars,readEvents} from '../lib/calendar-bridge/providers.js';
import {monthWindow,dayDots} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {ORIGIN,setSession,unseal} from '../lib/calendar-bridge/security.js';
import bridge from '../api/calendar-bridge.js';

const source={provider:'apple-holidays',id:'il_he',color:0};
const now=new Date('2026-10-03T12:00:00Z'),window=monthWindow({now});
// Public entries verified against Apple's live il_he.ics and the owner's phone.
// Apple omits DTEND: each DATE entry must still occupy one whole day.
const fixture=[
  'BEGIN:VCALENDAR','VERSION:2.0','X-WR-CALNAME:חגים בישראל',
  'BEGIN:VEVENT','UID:2dad93cf-80d6-3c96-ac24-92c1770e29f3','DTSTART;VALUE=DATE:20261003',
  'SUMMARY;LANGUAGE=he:שמחת תורה','TRANSP:TRANSPARENT','END:VEVENT',
  'BEGIN:VEVENT','UID:a30f6408-20aa-3697-8646-d8b01c31ebd8','DTSTART;VALUE=DATE:20261003',
  'SUMMARY;LANGUAGE=he:שמיני עצרת','TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR',''
].join('\r\n');
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.statusCode=c;return this;},json(v){this.data=v;return this;},end(){return this;}};}

test('Apple plain and gzip feeds preserve both Hebrew holidays and their matching dots',async()=>{
  for(const content of [fixture,gzipSync(fixture)]){
    const events=await appleHolidayEvents(source,window,async(url,options)=>{
      assert.equal(url,'https://calendars.icloud.com/holidays/il_he.ics');
      assert.equal(options.redirect,'error');assert.equal(options.headers,undefined);
      return new Response(content);
    });
    assert.equal(events.length,2);assert(events.every(e=>e.allDay && e.end==='2026-10-04'));
    const combined=[...events,{provider:'google',source:'google-holidays',uid:'different-publisher',color:2,
      title:'Shemini Atzeret / Simchat Torah',start:'2026-10-03',end:'2026-10-04',allDay:true}];
    const today=widgetSnapshot(combined,window,now);
    assert.deepEqual(today.rows.map(r=>r.title),['Shemini Atzeret / Simchat Torah','שמחת תורה','שמיני עצרת']);
    assert.equal(today.total,3);
    assert.deepEqual(today.rows.map(r=>r.color),[2,0,0]);
    assert.deepEqual(dayDots(combined,window).find(d=>d.date==='2026-10-03').dots,[2,0,0]);
    assert.equal(dayDots(combined,window).find(d=>d.date==='2026-10-04').count,0);
  }
});

test('Apple feed failures are explicit and an arbitrary URL can never be fetched',async()=>{
  for(const fetcher of [async()=>new Response('unavailable',{status:503}),async()=>new Response('<html>error</html>'),async()=>{throw Error('network');}]){
    await assert.rejects(()=>appleHolidayEvents(source,window,fetcher),{code:'apple_holidays_read_failed'});
  }
  let called=false;
  await assert.rejects(()=>appleHolidayEvents({...source,id:'https://example.test/feed.ics'},window,async()=>{called=true;}),{code:'invalid_selection'});
  assert.equal(called,false);
});

test('an existing account-free session can list, select and export Apple holidays without credentials',async()=>{
  process.env.CALENDAR_SEAL_KEY='3'.repeat(64);process.env.CALENDAR_SETUP_KEY='test-only-'.repeat(6);
  const originalFetch=globalThis.fetch;
  try{
    let reads=0;globalThis.fetch=async(url,options)=>{
      reads++;assert.equal(String(url),'https://calendars.icloud.com/holidays/il_he.ics');
      assert.equal(options.headers,undefined);return new Response(fixture);
    };
    assert.deepEqual((await listCalendars({})).calendars,[{provider:'apple-holidays',id:'il_he',name:'חגים בישראל'}]);
    assert.equal(reads,0);
    assert.equal((await readEvents({sources:[source]},window)).length,2);
    const saved=response();await setSession(saved,{sources:[],zone:'Asia/Jerusalem'});
    let cookie=saved.headers['set-cookie'].split(';')[0];
    const request=async(op,body)=>{
      const res=response();await bridge({method:'POST',url:`/api/calendar-bridge?op=${op}`,body,
        headers:{origin:ORIGIN,'content-type':'application/json',cookie}},res);return res;
    };
    const invalid=await request('select',{sources:[{...source,id:'unapproved'}]});assert.equal(invalid.statusCode,400);
    const selected=await request('select',{sources:[source],zone:'Asia/Jerusalem'});assert.equal(selected.statusCode,200);
    cookie=selected.headers['set-cookie'].split(';')[0];
    const exported=await request('export',{version:2});assert.equal(exported.statusCode,200);
    const capability=await unseal(new URL(exported.data.widgetEndpoint).searchParams.get('token'),'calendar-widget');
    assert.deepEqual(capability,{sources:[source],zone:'Asia/Jerusalem'});
    assert.equal(exported.data.sources[0].provider,'apple-holidays');
  }finally{globalThis.fetch=originalFetch;}
});
