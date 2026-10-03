import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {DateTime} from 'luxon';
import {COLORS,dayDots,icalEvents,monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {BridgeError,ORIGIN,SESSION_COOKIE,checkPost,seal,unseal,setSession} from '../lib/calendar-bridge/security.js';
import {GOOGLE_SCOPES,assertICloudURL,googlePages,iCloudFetch,iCloudCalendars,readEvents} from '../lib/calendar-bridge/providers.js';
import bridge from '../api/calendar-bridge.js';
import dotsHandler from '../api/calendar-dots.js';
import {personalizedWidget} from './calendar-connect-widget.js';

// Synthetic credentials only. No real account is accessed by this suite.
process.env.CALENDAR_SEAL_KEY='1'.repeat(64);
process.env.CALENDAR_SETUP_KEY='test-only-'.repeat(6);
process.env.CALENDAR_GOOGLE_CLIENT_ID='test-client';
process.env.CALENDAR_GOOGLE_CLIENT_SECRET='test-secret';
const october=monthWindow({now:new Date('2026-10-03T09:00:00Z')});
const source={provider:'icloud',id:'https://p01-caldav.icloud.com/test/home/',color:1};
const ics=lines=>`BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${lines.join('\r\n')}\r\nEND:VCALENDAR\r\n`;
const vevent=lines=>['BEGIN:VEVENT',...lines,'END:VEVENT'];
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.statusCode=c;return this;},json(v){this.data=v;return this;},send(v){this.data=v;return this;},end(){return this;}};}
const request=(op,body,cookie,method=body===undefined?'GET':'POST')=>({method,url:`/api/calendar-bridge?op=${op}`,body,
  headers:{origin:ORIGIN,'content-type':'application/json',...(cookie?{cookie}:{})}});
async function call(op,body,cookie){const res=response();await bridge(request(op,body,cookie),res);return res;}

test('encrypted tokens resist tampering, audience confusion, expiry and version revocation',async()=>{
  const secret={password:'synthetic-credential'};
  const token=await seal(secret,'calendar-render');
  assert(!token.includes(secret.password));assert.deepEqual(await unseal(token,'calendar-render'),secret);
  await assert.rejects(unseal(token,'calendar-setup'),{code:'unauthorized'});
  const parts=token.split('.');parts[3]=`${parts[3][0]==='A'?'B':'A'}${parts[3].slice(1)}`;
  await assert.rejects(unseal(parts.join('.'),'calendar-render'),{code:'unauthorized'});
  await assert.rejects(unseal(await seal(secret,'calendar-render','-1s'),'calendar-render'));
  process.env.CALENDAR_TOKEN_VERSION='2';await assert.rejects(unseal(token,'calendar-render'));delete process.env.CALENDAR_TOKEN_VERSION;
  const res=response();await setSession(res,secret);
  assert.match(res.headers['set-cookie'],/Secure; HttpOnly; SameSite=Lax/);
  await assert.rejects(setSession(res,{value:'x'.repeat(5000)}),{code:'selection_too_large'});
});

test('setup fails closed; missing login and cross-origin writes cannot read or configure accounts',async()=>{
  const key=process.env.CALENDAR_SEAL_KEY;delete process.env.CALENDAR_SEAL_KEY;
  assert.equal((await call('login',{key:process.env.CALENDAR_SETUP_KEY})).statusCode,503);
  process.env.CALENDAR_SEAL_KEY=key;
  assert.equal((await call('calendars')).statusCode,401);
  assert.equal((await call('export',{})).statusCode,401);
  assert.throws(()=>checkPost({method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'}}),{code:'invalid_origin'});
  assert.equal((await call('login',{key:'wrong'})).statusCode,401);
});

test('month grids cover 4/5/6-week months and reject invalid offsets',()=>{
  assert.equal(monthWindow({now:new Date('2026-02-15T12:00:00Z')}).weeks,4);
  assert.equal(october.weeks,5);
  assert.equal(monthWindow({now:new Date('2026-08-15T12:00:00Z')}).weeks,6);
  assert.equal(october.start.toISODate(),'2026-09-27');assert.equal(october.end.toISODate(),'2026-11-01');
  assert.throws(()=>monthWindow({offset:13}),{code:'invalid_month'});
});

test('date overlap uses local calendar days, exclusive ends, DST and duplicate invitation IDs',()=>{
  const events=[
    {uid:'all',color:0,start:'2026-10-03',end:'2026-10-05'},
    {uid:'midnight',color:1,start:'2026-10-05T20:00:00+03:00',end:'2026-10-06T00:00:00+03:00'},
    {uid:'dst',color:2,start:'2026-10-24T23:30:00+03:00',end:'2026-10-25T02:30:00+02:00'},
    {uid:'zero',color:3,start:'2026-10-27T13:00:00+02:00',end:'2026-10-27T13:00:00+02:00'}
  ];
  const map=Object.fromEntries(dayDots([...events,{...events[0],source:'copy'}],october).map(d=>[d.date,d]));
  assert.equal(map['2026-10-03'].count,1);assert.equal(map['2026-10-04'].count,1);
  assert.deepEqual(map['2026-10-05'].dots,[1]);assert.equal(map['2026-10-06'].count,0);
  assert.deepEqual(map['2026-10-24'].dots,[2]);assert.deepEqual(map['2026-10-25'].dots,[2]);
  assert.deepEqual(map['2026-10-27'].dots,[3]);
  assert.equal(dayDots(Array.from({length:6},(_,i)=>({...events[0],uid:`e${i}`,color:i%4})),october).find(d=>d.date==='2026-10-03').dots.length,4);
});

test('ICS recurrence, excluded dates, moved/cancelled exceptions and expanded-only responses',()=>{
  const data=ics([
    ...vevent(['UID:weekly','DTSTART:20261001T090000Z','DTEND:20261001T100000Z','RRULE:FREQ=WEEKLY;COUNT=5','EXDATE:20261008T090000Z']),
    ...vevent(['UID:weekly','RECURRENCE-ID:20261015T090000Z','DTSTART:20261016T090000Z','DTEND:20261016T100000Z']),
    ...vevent(['UID:weekly','RECURRENCE-ID:20261022T090000Z','DTSTART:20261022T090000Z','DTEND:20261022T100000Z','STATUS:CANCELLED']),
    ...vevent(['UID:expanded','RECURRENCE-ID:20261004T090000Z','DTSTART:20261004T090000Z','DTEND:20261004T100000Z'])
  ]);
  const dates=dayDots(icalEvents([{data}],source,october),october).filter(d=>d.count).map(d=>d.date);
  assert.deepEqual(dates,['2026-10-01','2026-10-04','2026-10-16','2026-10-29']);
});

test('floating and IANA timezone dates are local; unknown zones fail visibly',()=>{
  const data=ics(vevent(['UID:floating','DTSTART:20261005T233000','DTEND:20261005T235959']));
  assert.deepEqual(dayDots(icalEvents([{data}],source,october),october).filter(d=>d.count).map(d=>d.date),['2026-10-05']);
  const zoned=ics(vevent(['UID:local','DTSTART;TZID=Asia/Jerusalem:20261005T233000','DTEND;TZID=Asia/Jerusalem:20261005T235959']));
  assert.equal(icalEvents([{data:zoned}],source,october)[0].start,'2026-10-05T23:30:00.000+03:00');
  const bad=ics(vevent(['UID:bad','DTSTART;TZID=Unknown/Moon:20261005T233000','DTEND;TZID=Unknown/Moon:20261005T235959']));
  assert.throws(()=>icalEvents([{data:bad}],source,october),{code:'invalid_calendar_data'});
});

test('PNG pixels use fixed palette with transparency and the approved grid geometry',async()=>{
  const day='2026-10-04';
  const events=COLORS.map((_,color)=>({uid:`color${color}`,color,start:day,end:'2026-10-05'}));
  const png=await renderDots(events,october), {data,info}=await sharp(png).raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,2270);assert.equal(info.height,2368);assert.equal(info.channels,4);assert.equal(data[3],0);
  const i=dayDots(events,october).findIndex(d=>d.date===day);
  for(let j=0;j<4;j++){
    const x=Math.round(2*(48+(i%7+.5)*554/7+(j-1.5)*11));
    const y=Math.round(2*(423+(Math.floor(i/7)+.5)*560/5+42));
    const offset=(y*info.width+x)*4;
    assert.equal(`#${data.subarray(offset,offset+3).toString('hex')}`.toUpperCase(),COLORS[j]);assert.equal(data[offset+3],255);
  }
});

test('Google pagination is complete and provider failures are not silently empty',async()=>{
  let requests=0;
  const items=await googlePages('users/me/calendarList',{},'fake',async(url,init)=>{
    requests++;assert.equal(init.headers.Authorization,'Bearer fake');
    return Response.json(url.searchParams.get('pageToken') ? {items:[{id:'two'}]} : {items:[{id:'one'}],nextPageToken:'next'});
  });
  assert.deepEqual(items.map(x=>x.id),['one','two']);assert.equal(requests,2);
  await assert.rejects(googlePages('users/me/calendarList',{},'fake',async()=>new Response('',{status:403})),{code:'google_read_failed'});
});

test('CalDAV requests reject non-Apple targets, unexpected redirects and all write methods',async()=>{
  for(const url of ['http://caldav.icloud.com/','https://127.0.0.1/','https://caldav.icloud.com.evil.example/','https://icloud.com/','https://u:p@caldav.icloud.com/'])assert.throws(()=>assertICloudURL(url));
  await assert.rejects(iCloudFetch(source.id,{method:'PUT'}),{code:'calendar_write_blocked'});
  let calls=0;
  await assert.rejects(iCloudFetch(source.id,{method:'PROPFIND'},async()=>{calls++;return new Response('',{status:302,headers:{location:'https://evil.example/'}});}),{code:'invalid_calendar_url'});
  assert.equal(calls,1);
});

test('Google login → OAuth → selection → real renderer using synthetic provider responses',async()=>{
  const originalFetch=globalThis.fetch;
  let oauthRequests=0, eventRequests=0;
  try{
    globalThis.fetch=async(input,init)=>{
      const url=new URL(input);
      if(url.hostname==='oauth2.googleapis.com'){
        oauthRequests++;const body=new URLSearchParams(init.body);
        assert.equal(body.get('client_secret'),'test-secret');
        if(body.get('grant_type')==='authorization_code'){
          assert(body.get('code_verifier'));return Response.json({access_token:'test-access',refresh_token:'test-refresh',scope:GOOGLE_SCOPES.join(' ')});
        }
        return Response.json({access_token:'test-access'});
      }
      assert.equal(url.hostname,'www.googleapis.com');
      assert.equal(init.headers.Authorization,'Bearer test-access');
      if(url.pathname.endsWith('/calendarList'))return Response.json({items:[{id:'test@example.test',summary:'Test'}]});
      assert.equal(url.searchParams.get('singleEvents'),'true');eventRequests++;
      const start=DateTime.now().setZone('Asia/Jerusalem').startOf('month');
      return Response.json({items:[{id:'event',iCalUID:'example',start:{date:start.toISODate()},end:{date:start.plus({days:1}).toISODate()}}]});
    };
    let result=await call('login',{key:process.env.CALENDAR_SETUP_KEY});assert.equal(result.statusCode,200);
    let cookie=result.headers['set-cookie'].split(';')[0];
    result=await call('google',{},cookie);assert.equal(result.statusCode,200);
    cookie=result.headers['set-cookie'].split(';')[0];
    const authorization=new URL(result.data.url);assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');
    const bad=response();await bridge({...request('google-callback',undefined,cookie),url:'/api/calendar-bridge?op=google-callback&code=fake&state=wrong'},bad);
    assert.equal(bad.statusCode,401);assert.equal(oauthRequests,0);
    const callback=response();await bridge({...request('google-callback',undefined,cookie),url:`/api/calendar-bridge?op=google-callback&code=fake&state=${authorization.searchParams.get('state')}`},callback);
    assert.equal(callback.statusCode,303);assert.equal(callback.headers.location,'/tools/calendar-connect.html#connected');
    cookie=callback.headers['set-cookie'].split(';')[0];
    const listing=await call('calendars',undefined,cookie);assert.equal(listing.data.calendars.filter(c=>c.provider==='google').length,1);
    result=await call('select',{zone:'Asia/Jerusalem',sources:[{provider:'google',id:'test@example.test',color:2}]},cookie);assert.equal(result.statusCode,200);
    cookie=result.headers['set-cookie'].split(';')[0];
    result=await call('export',{},cookie);assert.equal(result.statusCode,200);assert.equal(result.data.daysWithEvents,1);
    assert(!JSON.stringify(result.data).includes('test-refresh'));
    const url=new URL(result.data.endpoint),render=response();await dotsHandler({method:'GET',url:url.pathname+url.search,headers:{}},render);
    assert.equal(render.statusCode,200);assert.equal(render.headers['content-type'],'image/png');
    assert.match(render.headers['cache-control'],/no-store/);assert.equal((await sharp(render.data).metadata()).width,2270);assert(eventRequests>=2);
    const renderCookie=`${SESSION_COOKIE}=${url.searchParams.get('token')}`;
    assert.equal((await call('calendars',undefined,renderCookie)).statusCode,401);
  }finally{globalThis.fetch=originalFetch;}
});

test('iCloud discovery and expanded REPORT pass through the real DAV parser with read-only methods',async()=>{
  const originalFetch=globalThis.fetch;
  const multi=(href,props)=>new Response(`<?xml version="1.0"?><d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:response><d:href>${href}</d:href><d:propstat><d:prop>${props}</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response></d:multistatus>`,{status:207,headers:{'content-type':'application/xml'}});
  const data=ics(vevent(['UID:dav-test','RECURRENCE-ID:20261003T090000Z','DTSTART:20261003T090000Z','DTEND:20261003T100000Z']));
  let reports=0,discoveryComplete=false;
  try{
    globalThis.fetch=async(input,init)=>{
      assert(['GET','PROPFIND','REPORT'].includes(init.method));
      if(discoveryComplete){assert.equal(init.method,'REPORT');assert.equal(new URL(input).href,source.id);}
      const url=new URL(input),body=String(init.body || '');
      if(url.pathname.includes('.well-known'))return new Response('',{status:301,headers:{location:'https://p01-caldav.icloud.com/'}});
      if(body.includes('current-user-principal'))return multi('/','<d:current-user-principal><d:href>/test/principal/</d:href></d:current-user-principal>');
      if(body.includes('calendar-home-set'))return multi('/test/principal/','<c:calendar-home-set><d:href>/test/</d:href></c:calendar-home-set>');
      if(body.includes('supported-report-set'))return multi('/test/home/','<d:supported-report-set/>');
      if(init.method==='REPORT'){
        reports++;assert(body.includes('expand'));assert(body.includes('time-range'));
        return multi('/test/home/test.ics',`<d:getetag>test-etag</d:getetag><c:calendar-data><![CDATA[${data}]]></c:calendar-data>`);
      }
      return multi('/test/home/','<d:displayname>Home</d:displayname><d:resourcetype><d:collection/><c:calendar/></d:resourcetype><c:supported-calendar-component-set><c:comp name="VEVENT"/></c:supported-calendar-component-set>');
    };
    const credentials={username:'example@example.test',password:'abcd-efgh-ijkl-mnop'};
    const calendars=await iCloudCalendars(credentials);assert.equal(calendars.length,1);assert.equal(calendars[0].id,source.id);
    discoveryComplete=true;
    const events=await readEvents({icloud:credentials,sources:[source]},october);
    assert.equal(events.length,1);assert.equal(reports,1);assert.equal(dayDots(events,october).find(d=>d.date==='2026-10-03').dots[0],1);
  }finally{globalThis.fetch=originalFetch;}
});

test('personalization changes only 25 image overlays/URL variables, 75 indicator sources and descriptive metadata',()=>{
  const original=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
  const widget=personalizedWidget(original,`${ORIGIN}/api/calendar-dots?token=synthetic-test-token`);
  const originals=new Map();function walk(nodes,fn){for(const n of nodes){fn(n);if(n.z==='13')walk(n['1'],fn);}}
  walk(original['1'],n=>originals.set(n.d0,n));
  const images=[];walk(widget['1'],n=>{if(n.s==='Calendar · Browser Event Dots')images.push(n);});
  assert.equal(images.length,25);assert.equal(new Set(images.map(n=>n['2'])).size,25);
  assert.equal(widget['36'].filter(v=>/^calendar_dots_url_/.test(v['1'])).length,25);
  let native=0;
  function restore(nodes){return nodes.filter(n=>n.s!=='Calendar · Browser Event Dots').map(n=>{
    if(n.z==='13')n['1']=restore(n['1']);
    if(n.z==='10'){const old=originals.get(n.d0);assert(!('53' in n));assert(!('54' in n));for(const k of ['53','54'])if(k in old)n[k]=old[k];native++;}
    return n;
  });}
  const restored=structuredClone(widget);restored['1']=restore(restored['1']);for(const k of ['3','4','a2'])restored[k]=original[k];
  restored['36']=restored['36'].filter(v=>!/^calendar_dots_url_/.test(v['1']));
  assert.equal(native,75);assert.deepEqual(restored,original);
});
