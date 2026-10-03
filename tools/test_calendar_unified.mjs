import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {DateTime} from 'luxon';
import {COLORS,dayDots,googleEvents,icalEvents,monthWindow} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot,sourceDiagnostics} from '../lib/calendar-bridge/widget-data.js';
import {ORIGIN,seal,setSession,unseal} from '../lib/calendar-bridge/security.js';
import bridge from '../api/calendar-bridge.js';
import widgetHandler from '../api/calendar-widget.js';
import {personalizedWidget} from './calendar-connect-widget.js';
import {fieldCode,snapshotCode,homeFieldCode} from './calendar-connect-today.js';

process.env.CALENDAR_SEAL_KEY='2'.repeat(64);
process.env.CALENDAR_SETUP_KEY='test-only-'.repeat(6);
process.env.CALENDAR_GOOGLE_CLIENT_ID='test-client';
process.env.CALENDAR_GOOGLE_CLIENT_SECRET='test-secret';
const now=new Date('2026-10-03T12:00:00Z'),window=monthWindow({now});
const events=[
  {uid:'holiday',source:'holidays',provider:'google',color:2,title:'חג',allDay:true,start:'2026-10-03',end:'2026-10-04'},
  {uid:'home',source:'home',provider:'icloud',color:1,title:'אירוע בחצות',allDay:false,start:'2026-10-03T00:00:00+03:00',end:'2026-10-03T23:59:00+03:00'},
  {uid:'personal',source:'personal',provider:'google',color:0,title:'Appointment "quoted"',location:'Ashkelon',allDay:false,start:'2026-10-03T09:00:00+03:00',end:'2026-10-03T10:00:00+03:00'},
  {uid:'work',source:'work',provider:'icloud',color:3,title:'Work',allDay:false,start:'2026-10-03T10:00:00+03:00',end:'2026-10-03T11:00:00+03:00'}
];
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.statusCode=c;return this;},json(v){this.data=v;return this;},send(v){this.data=v;return this;},end(){return this;}};}
async function get(token,query='',method='GET'){
  const res=response();await widgetHandler({method,url:`/api/calendar-widget?token=${encodeURIComponent(token)}${query}`},res);return res;
}
function evaluate(code,snapshot){
  const text=code.replaceAll('${widgy.calendar_bridge_snapshot}',encodeURIComponent(JSON.stringify(snapshot)));
  class TestDate extends Date {static now(){return now.getTime();}}
  return vm.runInNewContext(text+';main()',{Date:TestDate});
}

test('TODAY and dots share the exact four events/colors; finished events stay for daily parity',()=>{
  const list=[...events,{...events[0],source:'holiday-copy'}];
  const today=widgetSnapshot(list,window,now),day=dayDots(list,window).find(d=>d.date===today.date);
  assert.equal(today.total,4);assert.deepEqual(today.rows.map(r=>r.color),day.dots);
  assert.deepEqual(day.dots,[0,3,2,1]);assert.equal(today.rows[0].title,events[2].title);
  assert.equal(today.rows[2].allDay,1);assert.equal(today.rows[3].allDay,0);
  assert.equal(today.rows[3].start,'0:00');assert.equal(today.rows[3].end,'23:59');
  const extra={...events[3],uid:'fifth',start:'2026-10-03T20:00:00+03:00',end:'2026-10-03T21:00:00+03:00'};
  const crowded=widgetSnapshot([...list,extra],window,now);
  assert.equal(crowded.total,5);assert.equal(crowded.rows.length,4);
  assert.deepEqual(crowded.rows.map(r=>r.color),dayDots([...list,extra],window).find(d=>d.date===today.date).dots);
});

test('English titles precede Hebrew, retain time order within each group and match the four dots',()=>{
  const item=(uid,title,color,start,end,allDay=false)=>({uid,title,color,start,end,allDay,source:uid,provider:'icloud'});
  const fixtures=[
    item('english-late','✈️ 123 Flight לתל אביב',0,'2026-10-03T20:00:00+03:00','2026-10-03T21:00:00+03:00'),
    item('hebrew-late','✈️ טיסה to London',2,'2026-10-03T09:00:00+03:00','2026-10-03T10:00:00+03:00'),
    item('hebrew-early','שמחת תורה',1,'2026-10-03','2026-10-04',true),
    item('other','123 🎉',3,'2026-10-03','2026-10-04',true),
    item('english-early','(Meeting)',3,'2026-10-03T08:00:00+03:00','2026-10-03T09:00:00+03:00')
  ];
  const input=[...fixtures,{...fixtures[0],source:'duplicate-invitation'}];
  const today=widgetSnapshot(input,window,now);
  assert.equal(today.total,5);
  assert.deepEqual(today.rows.map(row=>row.title),['(Meeting)','✈️ 123 Flight לתל אביב','שמחת תורה','✈️ טיסה to London']);
  assert.deepEqual(today.rows.map(row=>row.color),[3,0,1,2]);
  assert.deepEqual(dayDots(input,window).find(day=>day.date===today.date).dots,[3,0,1,2]);
  assert.deepEqual(widgetSnapshot([...input].reverse(),window,now),today);
});

test('overnight, exclusive all-day ends and DST use the same local day in both panels',()=>{
  const fixtures=[
    {...events[0],start:'2026-10-02',end:'2026-10-03'},
    {...events[1],start:'2026-10-02T23:30:00+03:00',end:'2026-10-03T01:00:00+03:00'},
    {...events[2],start:'2026-10-24T23:30:00+03:00',end:'2026-10-25T02:30:00+02:00'}
  ];
  for(const date of ['2026-10-02','2026-10-03','2026-10-24','2026-10-25','2026-10-26']){
    const at=DateTime.fromISO(date+'T12:00:00',{zone:window.zone}).toJSDate();
    const snapshot=widgetSnapshot(fixtures,window,at),day=dayDots(fixtures,window).find(d=>d.date===date);
    assert.equal(snapshot.total,day.count);assert.deepEqual(snapshot.rows.map(r=>r.color),day.dots);
  }
  assert.deepEqual(widgetSnapshot(fixtures,window,now).rows.map(r=>r.color),[1]);
});

test('both provider adapters preserve Hebrew title, location, source and all-day flag',()=>{
  const google=googleEvents([{id:'one',summary:'פגישה בבית',location:'אשקלון',start:{date:'2026-10-03'},end:{date:'2026-10-04'}}],{provider:'google',id:'personal',color:0})[0];
  assert.equal(google.title,'פגישה בבית');assert.equal(google.location,'אשקלון');assert.equal(google.allDay,true);
  const data='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:private-test\r\nDTSTART:20261003T060000Z\r\nDTEND:20261003T070000Z\r\nSUMMARY:פגישה בעבודה\r\nLOCATION:אשדוד\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
  const apple=icalEvents([{data}],{provider:'icloud',id:'work',color:3},window)[0];
  assert.equal(apple.title,'פגישה בעבודה');assert.equal(apple.location,'אשדוד');assert.equal(apple.provider,'icloud');assert.equal(apple.allDay,false);
});

test('source diagnostics distinguish an empty selected calendar from a missing provider',()=>{
  const sources=[...events.map(e=>({provider:e.provider,id:e.source,color:e.color})),{provider:'icloud',id:'empty',color:3}];
  const result=sourceDiagnostics(events,window,sources,now);
  assert.deepEqual(result.map(s=>s.todayEvents),[1,1,1,1,0]);assert.equal(result[4].daysWithEvents,0);
});

test('Home counts the full day and selects active/upcoming timed events chronologically beyond the four TODAY rows',()=>{
  const at=new Date('2026-10-03T09:00:00Z'); // 12:00 in Jerusalem
  const timed=(uid,title,start,end)=>({uid,title,start:`2026-10-03T${start}+03:00`,end:`2026-10-03T${end}+03:00`,color:0,source:uid,allDay:false});
  const input=[
    timed('finished','Finished meeting','09:00:00','10:00:00'),
    timed('late','English later','17:00:00','18:00:00'),
    timed('early','פגישה מוקדמת','13:00:00','14:00:00'),
    ...Array.from({length:4},(_,i)=>({...events[0],uid:'holiday-'+i,title:'All-day '+i}))
  ];
  let snapshot=widgetSnapshot(input,window,at);
  assert.equal(snapshot.total,7);assert(!snapshot.rows.some(row=>row.title==='פגישה מוקדמת'));
  assert.equal(snapshot.home.title,'פגישה מוקדמת');assert.equal(snapshot.home.label,'NEXT EVENT');
  assert.equal(snapshot.home.time,'1:00 PM – 2:00 PM');assert.equal(snapshot.home.compact,1);
  assert.equal(snapshot.home.validUntil,Date.parse('2026-10-03T13:00:00+03:00'));
  const active=timed('active','Current meeting','11:30:00','12:30:00');
  snapshot=widgetSnapshot([...input,active],window,at);
  assert.equal(snapshot.home.title,'Current meeting');assert.equal(snapshot.home.label,'NOW');
  assert.equal(snapshot.home.validUntil,Date.parse('2026-10-03T12:30:00+03:00'));
  assert.equal(widgetSnapshot([...input,active],window,new Date('2026-10-03T09:30:00Z')).home.title,'פגישה מוקדמת');
  assert.equal(widgetSnapshot(input,window,new Date('2026-10-03T10:00:00Z')).home.label,'NOW');
});

test('Home falls back to English-first all-day events and distinguishes empty from finished days in the chosen timezone',()=>{
  const english={...events[0],uid:'english',title:'English holiday'};
  const snapshot=widgetSnapshot([events[0],english],window,now);
  assert.equal(snapshot.home.title,'English holiday');assert.equal(snapshot.home.label,'TODAY · ALL DAY');
  assert.equal(snapshot.home.time,'');assert.equal(snapshot.home.compact,0);
  assert.equal(snapshot.home.validUntil,snapshot.validUntil);
  assert.equal(widgetSnapshot([],window,now).home.title,'No events today');
  assert.equal(widgetSnapshot([events[2]],window,now).home.title,'No more events today');
  const afterMidnight=new Date('2026-10-03T21:01:00Z');
  const tomorrow=widgetSnapshot([english],window,afterMidnight);
  assert.equal(tomorrow.date,'2026-10-04');assert.equal(tomorrow.total,0);assert.equal(tomorrow.home.title,'No events today');
  const dst=widgetSnapshot([{...events[2],start:'2026-10-25T01:15:00+03:00',end:'2026-10-25T01:45:00+02:00'}],window,new Date('2026-10-24T23:20:00Z'));
  assert.equal(dst.home.label,'NOW');assert.equal(dst.home.validUntil,Date.parse('2026-10-25T01:45:00+02:00'));
});

async function evaluateHome(field,snapshot,fetcher){
  class TestDate extends Date {static now(){return now.getTime();}}
  const code=homeFieldCode(field,'https://example.test/api/calendar-widget?token=synthetic');
  assert(!code.includes('${widgy.calendar_bridge_snapshot}'));
  let requests=0;
  const result=await new Promise(resolve=>vm.runInNewContext(code,{
    Date:TestDate,sendToWidgy:resolve,
    fetch:async url=>{
      requests++;
      assert.equal(new URL(url).searchParams.get('view'),'today');
      assert.equal(new URL(url).searchParams.get('refresh'),String(Math.floor(now.getTime()/60000)));
      if(fetcher)return fetcher();
      await Promise.resolve();
      return {ok:true,status:200,json:async()=>snapshot};
    }
  }));
  assert.equal(requests,1);return result;
}

test('Home fields await their own response without a shared variable, preserve titles and reject stale data',async()=>{
  const snapshot=widgetSnapshot(events,window,now);
  snapshot.home.title='"; throw Error("injected"); // ${widgy.other} פגישה';
  assert.equal(await evaluateHome('title',snapshot),snapshot.home.title);
  assert.equal(await evaluateHome('count',snapshot),'4');
  assert.equal(await evaluateHome('count',widgetSnapshot([],window,now)),'0');
  assert.equal(await evaluateHome('event_word',widgetSnapshot([events[0]],window,now)),'event •');
  const expired={...snapshot,home:{...snapshot.home,validUntil:now.getTime()}};
  assert.equal(await evaluateHome('title',expired),'Updating…');
  assert.equal(await evaluateHome('compact',expired),0);assert.equal(await evaluateHome('time',expired),'');
  assert.equal(await evaluateHome('count',{version:2,ok:false}),'—');
  assert.equal(await evaluateHome('title',{...snapshot,generatedAt:'2026-10-02T12:00:00Z'}),'Calendar unavailable');
  for(const fetcher of [()=>{throw Error('offline');},async()=>({ok:false,status:401}),async()=>({ok:true,status:200,json:async()=>({})})]){
    assert.equal(await evaluateHome('count',null,fetcher),'—');
    assert.equal(await evaluateHome('title',null,fetcher),'Calendar unavailable');
  }
});

test('one Widgy network request supplies every field safely, including quotes and code-like event titles',async()=>{
  const snapshot=widgetSnapshot(events,window,now);
  snapshot.rows[0].title='"; throw Error("injected"); // ${widgy.other} \\ שלום\nMeeting';
  let requests=0,encoded;
  await new Promise((resolve,reject)=>{
    vm.runInNewContext(snapshotCode('https://example.test/private'),{
      fetch:async()=>{requests++;return {ok:true,status:200,json:async()=>snapshot};},
      sendToWidgy:value=>{encoded=value;resolve();}
    });
  });
  assert.deepEqual(JSON.parse(decodeURIComponent(encoded)),snapshot);assert.equal(requests,1);
  assert.equal(evaluate(fieldCode('title',0),snapshot),snapshot.rows[0].title);
  assert.equal(evaluate(fieldCode('total'),snapshot),4);assert.equal(evaluate(fieldCode('count'),snapshot),'4 events today');
  assert.equal(evaluate(fieldCode('ready'),snapshot),1);assert.equal(evaluate(fieldCode('color',0),snapshot),0);
  for(const bad of [{version:2,ok:false},{...snapshot,generatedAt:'2026-10-02T12:00:00Z'},{...snapshot,validUntil:now.getTime()-1}]){
    assert.equal(evaluate(fieldCode('ready'),bad),0);assert.equal(evaluate(fieldCode('total'),bad),-1);
    assert.equal(evaluate(fieldCode('title',0),bad),'');
  }
  assert.equal(evaluate(fieldCode('total'),widgetSnapshot([],window,now)),0);
});

test('snapshot fetch failure is explicit and never converted to a valid empty calendar',async()=>{
  for(const fetcher of [()=>{throw Error('offline');},async()=>({ok:false,status:401}),async()=>({ok:true,status:200,json:async()=>({})})]){
    const encoded=await new Promise(resolve=>vm.runInNewContext(snapshotCode('https://example.test/private'),{fetch:fetcher,sendToWidgy:resolve}));
    assert.deepEqual(JSON.parse(decodeURIComponent(encoded)),{version:2,ok:false});
  }
});

test('new capability returns matching TODAY/PNG, reuses provider read and rejects old dots-only links',async()=>{
  const oldFetch=globalThis.fetch;
  let reads=0;
  const instant=DateTime.now().setZone('Asia/Jerusalem');
  const state={sources:[{provider:'google',id:'synthetic',color:2}],zone:'Asia/Jerusalem',google:{refresh:'synthetic-refresh'}};
  const token=await seal(state,'calendar-widget');
  try{
    globalThis.fetch=async input=>{
      const url=new URL(input);
      if(url.hostname==='oauth2.googleapis.com')return Response.json({access_token:'synthetic-access'});
      reads++;return Response.json({items:[{id:'holiday',summary:'בדיקה',location:'Synthetic location',start:{date:instant.toISODate()},end:{date:instant.plus({days:1}).toISODate()}}]});
    };
    const today=await get(token);assert.equal(today.statusCode,200);assert.equal(today.data.total,1);assert.equal(today.data.rows[0].color,2);
    assert.equal(today.data.rows[0].title,'בדיקה');assert(!JSON.stringify(today.data).includes('synthetic-refresh'));
    assert.match(today.headers['cache-control'],/no-store/);
    const dots=await get(token,'&view=dots&offset=0');assert.equal(dots.statusCode,200);assert.equal(dots.headers['content-type'],'image/png');
    assert.equal((await sharp(dots.data).metadata()).width,2270);assert.equal(reads,1);
    const refreshed=await get(token,'&view=dots&offset=0&render=refresh-1&refresh=12345');
    assert.equal(refreshed.statusCode,200);assert.deepEqual(refreshed.data,dots.data);assert.equal(reads,1);
    assert.equal((await get(await seal(state,'calendar-render'))).statusCode,401);
    assert.equal((await get(token,'&offset=1')).statusCode,400);
    assert.equal((await get(token,'&view=dots&offset=13')).statusCode,400);
    assert.equal((await get(token,'','POST')).statusCode,405);
    assert.equal((await get(token,'&view=dots','HEAD')).data,undefined);
    const res=response();await setSession(res,state);
    const exported=response();await bridge({method:'POST',url:'/api/calendar-bridge?op=export',body:{version:2},
      headers:{origin:ORIGIN,'content-type':'application/json',cookie:res.headers['set-cookie'].split(';')[0]}},exported);
    assert.equal(exported.statusCode,200);assert.equal(exported.data.today.total,1);assert.equal(exported.data.sources[0].todayEvents,1);
    assert.deepEqual(await unseal(new URL(exported.data.widgetEndpoint).searchParams.get('token'),'calendar-widget'),state);
  }finally{globalThis.fetch=oldFetch;}
});

test('unified template preserves other tabs and row geometry while removing native event data and rank colors',()=>{
  const original=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
  const copy=personalizedWidget(original,`${ORIGIN}/api/calendar-dots?token=synthetic`,`${ORIGIN}/api/calendar-widget?token=synthetic-v2`);
  const walk=(nodes,fn)=>nodes.forEach(n=>{fn(n);if(n.z==='13')walk(n['1'],fn);});
  const cal=copy['1'].find(n=>n.s==='CALENDAR'),base=original['1'].find(n=>n.s==='CALENDAR');
  for(const n of copy['1'].filter(n=>n!==cal && n.s!=='HOME'))assert.deepEqual(n,original['1'].find(b=>b.d0===n.d0));
  for(const k of Object.keys(original).filter(k=>!['1','3','4','36','a2'].includes(k)))assert.deepEqual(copy[k],original[k]);
  const byID=new Map();walk(base['1'],n=>byID.set(n.d0,n));
  let overlays=0,bars=0;
  walk(cal['1'],n=>{
    if(n.s==='Calendar · Browser Event Dots'){
      overlays++;
      const name=n['2'].match(/^\$\{widgy\.(calendar_dots_url_[mp]\d+)\}$/)?.[1];
      const variable=copy['36'].find(v=>v['1']===name);assert(variable);
      assert.equal(new URL(vm.runInNewContext(variable['3']['66'][0]['10']+';main()')).pathname,'/api/calendar-widget');
    }
    if(/Source Color [0-3]$/.test(n.s || '')){
      bars++;const rank=Number(n.s.match(/Event (\d)/)[1]);
      let originalBar;walk(base['1'],b=>{if(b.s===`Event ${rank} · Accent`)originalBar=b;});
      for(const k of ['b','c','d','e'])assert.deepEqual(n[k],originalBar[k]);
      const color=Number(n.o1['2']);assert(copy['2'].some(s=>s.startsWith(n.g.slice(0,-4)) && s.includes(COLORS[color].slice(1))));
    }
    for(const source of n['66'] || [])if(source['5']==='Agenda (Today)')assert.equal(source['6'],'Reminder Events Today');
    if(n.z==='1' && byID.has(n.d0)){
      const originalNode=byID.get(n.d0);
      for(const k of ['b','c','d','e','1','f'])assert.deepEqual(n[k],originalNode[k]);
    }
  });
  assert.equal(overlays,25);assert.equal(bars,16);
  assert.equal(copy['36'].filter(v=>v['1']==='calendar_bridge_snapshot').length,1);
  for(const v of copy['36'].filter(v=>/^calendar_(remaining|event_)/.test(v['1'])))assert(!JSON.stringify(v).includes('Agenda (Today)'));
  for(const v of original['36'].filter(v=>!/^calendar_(remaining|event_)/.test(v['1'])))assert.deepEqual(copy['36'].find(c=>c['0']===v['0']),v);
  const ids=[];walk(copy['1'],n=>ids.push(n.d0));assert.equal(ids.length,new Set(ids).size);
  const variableIDs=copy['36'].map(v=>v['0']);assert.equal(variableIDs.length,new Set(variableIDs).size);
});

test('Home replaces sample data with independent async fields and preserves C16 fonts, timed frames and unrelated layers',()=>{
  const original=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
  const copy=personalizedWidget(original,`${ORIGIN}/api/calendar-dots?token=synthetic`,`${ORIGIN}/api/calendar-widget?token=synthetic-v2`);
  const home=copy['1'].find(n=>n.s==='HOME'),base=original['1'].find(n=>n.s==='HOME');
  const changed=new Set(['Events Summary · 1','Events Summary · 2','Events Summary · 3','Next Event Label','Next Event Title','Next Event Time']);
  for(const node of base['1']){
    const actual=home['1'].find(n=>n.d0===node.d0);assert(actual);
    if(!changed.has(node.s)){assert.deepEqual(actual,node);continue;}
    for(const key of new Set([...Object.keys(node),...Object.keys(actual)])){
      if(!['66','o1'].includes(key))assert.deepEqual(actual[key],node[key],node.s+' '+key);
    }
  }
  assert.equal(home['1'].length,base['1'].length+1);
  const full=home['1'].find(n=>n.s==='Next Event Title · Full Row');
  const title=home['1'].find(n=>n.s==='Next Event Title'),time=home['1'].find(n=>n.s==='Next Event Time');
  assert.equal(full.d.a[0].a,time.b.a[0].a+time.d.a[0].a-title.b.a[0].a);
  assert.equal(full['1'],title['1']);assert.deepEqual(full.c,title.c);assert.deepEqual(full.e,title.e);
  assert.equal(full.o1['2'],'0');assert.equal(title.o1['2'],'1');assert.equal(time.o1['2'],'1');
  assert(!JSON.stringify(home).includes('Team Sync'));assert(!JSON.stringify(home).includes('2:00 PM – 2:30 PM'));
  assert.deepEqual(home['1'].find(n=>n.s==='Events Summary · 3')['66'],[{'5':'Agenda (Today)','6':'Reminder Events Today'}]);
  const variables=copy['36'].filter(v=>v['1'].startsWith('calendar_home_'));
  assert.equal(variables.length,6);assert(variables.every(v=>v['3']['66'][0]['6']==='Async + No main()'));
  assert(variables.every(v=>!v['3']['66'][0]['10'].includes('${widgy.calendar_bridge_snapshot}')));
  assert.equal(copy['36'].filter(v=>v['1']==='calendar_bridge_snapshot').length,1);
});

test('every month image gets a new URL on the next minute while retaining its private token and offset',()=>{
  const original=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
  for(const unified of [false,true]){
    const copy=personalizedWidget(original,`${ORIGIN}/api/calendar-dots?token=synthetic`,
      unified ? `${ORIGIN}/api/calendar-widget?token=synthetic-v2` : undefined);
    const variables=copy['36'].filter(v=>/^calendar_dots_url_/.test(v['1']));
    assert.equal(variables.length,25);
    const offsets=[];
    for(const variable of variables){
      const code=variable['3']['66'][0]['10'];
      const run=instant=>vm.runInNewContext(code+';main()',{Date:class extends Date {static now(){return instant;}}});
      const first=run(now.getTime()),sameMinute=run(now.getTime()+30000),nextMinute=run(now.getTime()+60000);
      assert.equal(first,sameMinute);assert.notEqual(first,nextMinute);
      const url=new URL(first),nextURL=new URL(nextMinute);
      assert.equal(url.origin,ORIGIN);assert.equal(url.pathname,unified?'/api/calendar-widget':'/api/calendar-dots');
      assert.equal(url.searchParams.get('token'),unified?'synthetic-v2':'synthetic');
      assert.equal(url.searchParams.get('view'),unified?'dots':null);
      assert.equal(Number(nextURL.searchParams.get('refresh')),Number(url.searchParams.get('refresh'))+1);
      offsets.push(Number(url.searchParams.get('offset')));
      url.searchParams.delete('refresh');nextURL.searchParams.delete('refresh');assert.equal(url.href,nextURL.href);
    }
    assert.deepEqual(offsets.sort((a,b)=>a-b),Array.from({length:25},(_,i)=>i-12));
  }
});
