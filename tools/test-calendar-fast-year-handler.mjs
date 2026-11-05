import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {BridgeError,privateHeaders} from '../lib/calendar-bridge/security.js';
import {monthWindow,icalEvents,renderDots} from '../lib/calendar-bridge/dots.js';
import {monthProviderWindow,monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {yearProviderWindow,yearPreparedDaysFor,createYearRangeReader} from '../lib/calendar-bridge/year-provider-window.js';
import {createProviderCache} from '../lib/calendar-bridge/provider-cache.js';
import {createAnnualProviderCache} from '../lib/calendar-bridge/annual-provider-cache.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {homeAgenda,homeAgendaFields} from '../lib/calendar-bridge/home-agenda.js';
const code=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8')
 .replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler').replace('export function clientMaxAge','function clientMaxAge');
const tick=()=>new Promise(r=>setTimeout(r,0));
let time=Date.parse('2026-11-05T08:00:00Z'),calls=0,renders=0,revision=0,mode='ok',gate;
const tasks=[],remote=new Map();
const options={now:()=>time,background:p=>tasks.push(p),ioMs:5,remote:()=>({get:async k=>structuredClone(remote.get(k)),set:async(k,v)=>remote.set(k,structuredClone(v))})};
class Clock extends Date {constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
function event(uid,title,hour){return ['BEGIN:VEVENT','UID:'+uid,'SUMMARY:'+title,'DTSTART:20241005T'+hour+'0000Z','DTEND:20241005T'+hour+'3000Z','RRULE:FREQ=MONTHLY;COUNT=60','END:VEVENT'];}
function fixture() {
 const main=revision===2?[]:event('original',revision?'Updated':'Original','10');
 const added=revision?event('added','New event','12'):[];
 return ['BEGIN:VCALENDAR','VERSION:2.0',...main,...added,'END:VCALENDAR'].join('\r\n');
}
function instance(){
 return vm.runInNewContext(code+'\nhandler',{Date:Clock,URL,performance,createHash,BridgeError,console:{info(){}},
  origin:()=> 'https://example.invalid',privateHeaders,monthWindow,monthProviderWindow,monthViewEntry,
  yearProviderWindow,yearPreparedDaysFor,readYearRange:createYearRangeReader({now:()=>time}),
  cachedEvents:createProviderCache(options),cachedAnnualEvents:createAnnualProviderCache(options),
  preparedDaysFor,widgetSnapshot,widgyFields,homeAgenda,homeAgendaFields,
  unseal:async token=>{if(token==='bad')throw new BridgeError('unauthorized',401);return {zone:'Asia/Jerusalem',sources:[{provider:'icloud',id:'fixture',color:revision%4}],token};},
  readEvents:async(state,window)=>{calls++;if(gate)await gate;
   if(mode==='failure')throw new BridgeError('icloud_connection_failed',502);
   if(mode==='capacity' && window.end.diff(window.start,'days').days>49)throw new BridgeError('event_limit',502);
   if(mode==='empty')return [];
   const events=icalEvents([{data:fixture()}],state.sources[0],window);
   if(mode==='invalid')events[0].start='not-a-date';
   return events;},
  renderDots:async(...args)=>{renders++;return renderDots(...args);}});
}
async function request(handler,{token='one',offset=0,view='dots',reuse='year-v2',method='GET'}={}) {
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},send(b){this.body=b;return this;},end(){this.ended=true;return this;}};
 await handler({method,url:`/api/calendar-widget?token=${token}&offset=${offset}&view=${view}&bounds=${view==='dots'?'grid':'full'}&format=widgy&agenda=home-v1${reuse?'&reuse='+reuse:''}`},res);return res;
}
const one=instance(),offsets=Array.from({length:12},(_,i)=>i-10);
assert.equal((await request(one,{token:'bad'})).code,401);assert.equal(calls,0);
const first=await Promise.all(offsets.map(offset=>request(one,{offset})));assert.equal(calls,1);assert.equal(renders,12);
const legacy=await request(one,{reuse:'year-v1'});assert(first[10].body.equals(legacy.body));
const initialCalls=calls,initialRenders=renders;
await Promise.all(tasks);time+=60000;
let release;gate=new Promise(r=>release=r);
const stale=await request(one);assert.equal(stale.code,200);assert.equal(stale.headers['X-Calendar-Data-State'],'refreshing');
assert.equal(stale.headers['Cache-Control'],'private, no-store');assert(stale.body.equals(first[10].body));
await tick();assert.equal(calls,initialCalls+1);
let todayDone=false;const waiting=request(one,{view:'today'}).then(r=>{todayDone=true;return r;});
for(const offset of offsets)await request(one,{offset});
assert.equal(todayDone,false);assert.equal(calls,initialCalls+1);assert.equal(renders,initialRenders);
release();gate=null;const today=await waiting;assert.equal(today.code,200);assert.equal(today.headers['X-Calendar-Data-State'],'current');
await Promise.all(tasks);
for(const offset of offsets)await request(one,{offset});assert.equal(renders,initialRenders,'Unchanged refresh preserves every month PNG');
const fields=JSON.parse(readFileSync(new URL('./widget-tab-selectors.json',import.meta.url)));for(const key of fields)assert(key in today.body,key);

// A changed complete snapshot invalidates all month views together.
time+=60000;revision=1;
const edited=await request(one,{view:'today'});assert.equal(edited.body.calendar_remaining_today,2);assert.equal(edited.body.calendar_event_1_title,'Updated');
const changed=await Promise.all(offsets.map(offset=>request(one,{offset})));
for(let i=0;i<12;i++)assert(!changed[i].body.equals(first[i].body));
assert.equal(renders,initialRenders+12);
time+=60000;revision=2;
const deleted=await request(one,{view:'today'});assert.equal(deleted.body.calendar_remaining_today,1);assert.equal(deleted.body.calendar_event_1_title,'New event');

// Outage and invalid provider data retain the prior full result, clearly marked
// as stale/no-store, and never become a successful empty calendar.
time+=60000;mode='failure';
let failed=await request(one,{view:'today'});assert.equal(failed.code,200);assert.equal(failed.body.calendar_remaining_today,1);
assert.equal(failed.headers['X-Calendar-Data-State'],'refresh-failed');assert.equal(failed.headers['Cache-Control'],'private, no-store');
time+=15000;mode='invalid';
failed=await request(one,{view:'today'});assert.equal(failed.body.calendar_remaining_today,1);assert.equal(failed.headers['X-Calendar-Data-State'],'refresh-failed');
time+=15000;mode='empty';
const empty=await request(one,{view:'today'});assert.equal(empty.body.calendar_remaining_today,0);assert.equal(empty.headers['X-Calendar-Data-State'],'current');
assert.equal(empty.body.calendar_home_title,'No events today');
time+=900000;mode='failure';
const expired=await request(one,{view:'today'});assert.equal(expired.code,502);assert.equal(expired.body.calendar_remaining_today,-1);
assert.equal(expired.body.calendar_home_title,'Calendar unavailable');
assert.equal((await request(one,{token:'cold-failure',view:'today'})).code,502);
mode='capacity';const capStart=calls;
assert.equal((await request(one,{token:'dense',view:'today'})).code,200);assert.equal(calls,capStart+2);
assert.equal((await request(one,{token:'dense',offset:1})).code,200);assert.equal(calls,capStart+3);
mode='ok';const prior=calls;
assert.equal((await request(one,{token:'bad'})).code,401);assert.equal((await request(one,{offset:13})).code,400);
assert.equal((await request(one,{method:'POST'})).code,405);assert.equal(calls,prior);
const head=await request(one,{token:'head',method:'HEAD'});assert.equal(head.code,200);assert(head.ended);assert.equal(head.body,undefined);
await Promise.all(tasks);
console.log('PASS: annual background refresh, no wait for cached months, TODAY waits, unchanged refresh avoids 12 PNG renders, exact legacy pixels, edits/additions/deletions, invalid/outage retention, honest expiry errors, capacity fallback, auth, 37 fields and HEAD.');
