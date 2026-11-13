import test from 'node:test';
import assert from 'node:assert/strict';
import {createWidgetContext} from '../lib/widget-context.js';
import {fixture,flight,meeting,allDay} from './test-unified-agenda.mjs';

export async function flatResponse(events,{at='2026-11-13T12:58:00Z',zone='Asia/Jerusalem',failure=false,method='GET',legacy=false,mutate=x=>x}={}) {
  const {agenda,now}=fixture(events,at,zone);const logs=[];
  const calendarBody={encoded:'legacy-private-metadata-'.repeat(1000),agenda:mutate(agenda)};
  const res={headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v},status(c){this.statusCode=c;return this},json(b){this.body=JSON.parse(JSON.stringify(b))},end(){this.ended=true}};
  await createWidgetContext({clock:()=>+now,log:x=>logs.push(x),
    calendar:async()=>(req,res)=>{if(failure)throw Error('private');res.json(calendarBody)},
    weather:async()=>(req,res)=>res.json({icon_status:'Clear',temperature:'25°C',status:'Sunny'}),
    location:async()=>(req,res)=>res.json({text:'Example'})})({method,url:'/?context=home-v1&agenda=unified-v1&day_zone='+encodeURIComponent(zone)+(legacy?'':'&display=flat-v1')},res);
  return {res,logs,calendarBody,agenda};
}
test('flat agenda is opt-in, shallow, smaller, and preserves H10/legacy contracts',async()=>{
  const {res,calendarBody,logs}=await flatResponse([flight]);
  assert.equal(res.body.agenda.display_code,3);assert.equal(res.body.agenda.message,'No more events today');
  assert(!('calendar' in res.body));assert(!JSON.stringify(res.body).includes('legacy-private'));
  assert.equal(res.body.weather.temperature,'25°C');assert.equal(res.body.location.text,'Example');
  assert.equal(res.headers['X-Widget-Context-Revision'],'agenda-flat-v1');
  assert.equal(res.headers['Vercel-CDN-Cache-Control'],'no-store');assert.equal(logs[0].agendaState,'finished');assert.equal(logs[0].displayMode,'flat-v1');
  assert.equal(calendarBody.encoded.length,24000);assert.equal(calendarBody.agenda.fields.state,'finished');
  const legacy=await flatResponse([flight],{legacy:true});
  assert(legacy.res.body.calendar.encoded);assert(!('agenda' in legacy.res.body));
  assert.equal(legacy.res.body.calendar.agenda.fields.state,'finished');
  assert(JSON.stringify(res.body).length<JSON.stringify(legacy.res.body).length/2);
});
test('one code distinguishes remaining, genuinely empty, finished and unavailable',async()=>{
  for(const [events,opts,expected] of [
    [[],{},2],[[flight],{},3],[[flight,meeting],{},1],[[flight,allDay],{},1],
    [[],{failure:true},0],[[],{mutate:x=>({...x,zone:'Asia/Dubai'})},0],
    [[],{mutate:x=>({...x,validUntil:0})},0],
    [[],{mutate:x=>({...x,fields:{...x.fields,home_title:undefined}})},0]]) {
    const {res}=await flatResponse(events,opts);assert.equal(res.body.agenda.display_code,expected);
    if(expected===0)assert.equal(res.body.agenda.ready,0);
  }
});
test('flight clocks, multi-event selection and airport date offsets survive flat transport',async()=>{
  const {res,agenda}=await flatResponse([flight],{at:'2026-11-13T07:00:00Z'});
  for(const [key,value]of Object.entries(agenda.fields))assert.deepEqual(res.body.agenda[key],value);
  assert.equal(res.body.agenda.home_flight_start,'08:50');assert.equal(res.body.agenda.home_flight_end,'10:20');
  const mixed=await flatResponse([flight,allDay,meeting]);assert.equal(mixed.res.body.agenda.home_title,'Meeting');assert.equal(mixed.res.body.agenda.count,2);
});
test('HEAD suppresses only outer body and flat projection does not mutate shared calendar response',async()=>{
  const {res,calendarBody,logs}=await flatResponse([flight],{method:'HEAD'});
  assert.equal(res.body,undefined);assert(res.ended);assert(calendarBody.encoded);assert(!calendarBody.agenda.fields.display_code);assert.equal(logs[0].method,'HEAD');
});
