import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {BridgeError,privateHeaders} from '../lib/calendar-bridge/security.js';
import {monthWindow,icalEvents,renderDots} from '../lib/calendar-bridge/dots.js';
import {monthProviderWindow,monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {yearProviderWindow,yearPreparedDaysFor,createYearRangeReader} from '../lib/calendar-bridge/year-provider-window.js';
import {createProviderCache} from '../lib/calendar-bridge/provider-cache.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {homeAgenda,homeAgendaFields} from '../lib/calendar-bridge/home-agenda.js';
const code=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8')
 .replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler').replace('export function clientMaxAge','function clientMaxAge');
const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:monthly','SUMMARY:Monthly fixture','DTSTART:20241005T100000Z','DTEND:20241005T110000Z','RRULE:FREQ=MONTHLY;COUNT=60','END:VEVENT','END:VCALENDAR'].join('\r\n');
let time=Date.parse('2026-11-05T08:00:00Z'),calls=0,cacheReads=0,renders=0,revision=0;
const tasks=[],remote=new Map();
const cacheOptions={now:()=>time,background:p=>tasks.push(p),remote:()=>({get:async k=>{cacheReads++;return remote.get(k);},set:async(k,v)=>remote.set(k,v)})};
class Clock extends Date {constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
function instance(){
 const cachedEvents=createProviderCache(cacheOptions),readYearRange=createYearRangeReader({now:()=>time});
 return vm.runInNewContext(code+'\nhandler',{Date:Clock,URL,performance,createHash,BridgeError,console:{info(){}},
  origin:()=> 'https://example.invalid',privateHeaders,monthWindow,monthProviderWindow,monthViewEntry,
  yearProviderWindow,yearPreparedDaysFor,readYearRange,cachedEvents,preparedDaysFor,widgetSnapshot,widgyFields,homeAgenda,homeAgendaFields,
  unseal:async token=>{if(token==='bad')throw new BridgeError('unauthorized',401);return {zone:'Asia/Jerusalem',sources:[{provider:'icloud',id:'fixture',color:revision%4}],token};},
  readEvents:async(state,window)=>{calls++;
   if(state.token==='provider-error')throw new BridgeError('icloud_connection_failed',502);
   if(state.token==='dense' && window.end.diff(window.start,'days').days>49)throw new BridgeError('event_limit',502);
   return icalEvents([{data:ics}],state.sources[0],window);},
  renderDots:async(...args)=>{renders++;return renderDots(...args);}});
}
const one=instance();
async function request(handler,{token='one',offset=0,view='dots',reuse='year-v1',bounds='grid',method='GET'}={}) {
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},send(b){this.body=b;return this;},end(){this.ended=true;return this;}};
 await handler({method,url:`/api/calendar-widget?token=${token}&offset=${offset}&view=${view}&bounds=${view==='dots'?bounds:'full'}&format=widgy&agenda=home-v1${reuse?'&reuse='+reuse:''}`},res);return res;
}
assert.equal((await request(one,{token:'bad'})).code,401);assert.equal(calls,0);assert.equal(cacheReads,0);
const offsets=Array.from({length:12},(_,i)=>i-10);
const yearly=await Promise.all(offsets.map(offset=>request(one,{offset})));
assert.equal(calls,1,'All 12 months share one pending annual provider read');assert.equal(renders,12);
for(let i=0;i<12;i++) {
 const expected=await request(one,{offset:offsets[i],reuse:''});
 assert.equal(yearly[i].code,200);assert(yearly[i].body.equals(expected.body));
 assert.equal(yearly[i].headers['X-Calendar-Generated-For'],`2026-${String(i+1).padStart(2,'0')}`);
 assert.equal(yearly[i].headers['CDN-Cache-Control'],'no-store');
}
assert.equal(calls,13);const rendered=renders;
for(const offset of offsets.toReversed())await request(one,{offset});
assert.equal(renders,rendered,'All 12 PNGs are reusable, not evicted after 3');
const today=await request(one,{view:'today'}),legacy=await request(one,{view:'today',reuse:''});
assert.deepEqual(JSON.parse(JSON.stringify(today.body)),JSON.parse(JSON.stringify(legacy.body)));
const fields=JSON.parse(readFileSync(new URL('./widget-tab-selectors.json',import.meta.url)));for(const name of fields)assert(name in today.body,name);
const head=await request(one,{offset:1,method:'HEAD'});assert.equal(head.code,200);assert(head.ended);assert.equal(head.body,undefined);
await Promise.all(tasks);const two=instance(),prior=calls;
assert.equal((await request(two,{offset:-8})).headers['X-Calendar-Provider-Cache'],'SHARED');assert.equal(calls,prior);
const allStart=calls;
for(let offset=-12;offset<=12;offset++)assert.equal((await request(one,{token:'range',offset})).code,200);
assert.equal(calls-allStart,3,'Existing 25 visible offsets span 3 calendar years');
await request(one,{token:'other-account'});assert.equal(calls-allStart,4);

// Hits do not extend the annual snapshot. After expiry, a new event revision
// replaces all months together rather than retaining sibling PNGs/day indexes.
time+=59000;await request(one,{offset:1});const beforeExpiry=calls;
time+=1000;revision++;
const refreshed=await Promise.all(offsets.map(offset=>request(one,{offset})));
assert.equal(calls,beforeExpiry+1);
for(let i=0;i<12;i++)assert(!refreshed[i].body.equals(yearly[i].body),'Every month sees the new annual event revision');

const denseStart=calls;
assert.equal((await request(one,{token:'dense',offset:0})).code,200);assert.equal(calls,denseStart+2);
assert.equal((await request(one,{token:'dense',offset:1})).code,200);assert.equal(calls,denseStart+3,'No second rejected annual read during cooldown');
const outageStart=calls;assert.equal((await request(one,{token:'provider-error'})).code,502);assert.equal(calls,outageStart+1);
const validation=calls,reads=cacheReads;
assert.equal((await request(one,{token:'bad'})).code,401);
assert.equal((await request(one,{offset:13})).code,400);
assert.equal((await request(one,{method:'POST'})).code,405);
assert.equal(calls,validation);assert.equal(cacheReads,reads);
const oldStart=calls;for(const offset of [-1,0,1])await request(one,{token:'old-three',offset,reuse:'months-v1'});assert.equal(calls,oldStart+1,'Existing three-month URLs still work');
time=Date.parse('2027-01-01T00:30:00Z');assert.equal((await request(one)).headers['X-Calendar-Generated-For'],'2027-01');
assert.equal((await request(one,{offset:-1})).headers['X-Calendar-Generated-For'],'2026-12');
await Promise.all(tasks);
console.log('PASS: 12 concurrent months -> 1 provider read, 25 offsets -> 3 years, exact legacy PNG/JSON, 12 cached PNGs, whole-year refresh, shared reuse, isolation, dense fallback/cooldown, error/auth/HEAD and rollover.');
