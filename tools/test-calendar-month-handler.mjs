import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {BridgeError,privateHeaders} from '../lib/calendar-bridge/security.js';
import {monthWindow,icalEvents,renderDots} from '../lib/calendar-bridge/dots.js';
import {monthProviderWindow,monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {createProviderCache} from '../lib/calendar-bridge/provider-cache.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {homeAgenda,homeAgendaFields} from '../lib/calendar-bridge/home-agenda.js';
const code=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8')
 .replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler').replace('export function clientMaxAge','function clientMaxAge');
const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:monthly','SUMMARY:Monthly fixture','DTSTART:20241005T100000Z','DTEND:20241005T110000Z','RRULE:FREQ=MONTHLY;COUNT=60','END:VEVENT','END:VCALENDAR'].join('\r\n');
let time=Date.parse('2026-11-05T08:00:00Z'),calls=0,cacheReads=0,renders=0;
const tasks=[],remote=new Map(),reads=[];
const cacheOptions={now:()=>time,background:p=>tasks.push(p),remote:()=>({get:async k=>{cacheReads++;return remote.get(k);},set:async(k,v)=>remote.set(k,v)})};
class Clock extends Date {constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
function instance(){
 const cachedEvents=createProviderCache(cacheOptions);
 return vm.runInNewContext(code+'\nhandler',{Date:Clock,URL,performance,createHash,BridgeError,console:{info(){}},
  origin:()=> 'https://example.invalid',privateHeaders,monthWindow,monthProviderWindow,monthViewEntry,cachedEvents,preparedDaysFor,widgetSnapshot,widgyFields,homeAgenda,homeAgendaFields,
  unseal:async token=>{if(token==='bad')throw new BridgeError('unauthorized',401);return {zone:'Asia/Jerusalem',sources:[{provider:'icloud',id:'fixture',color:1}],token};},
  readEvents:async(state,window)=>{calls++;reads.push([state.token,window.start.toISO(),window.end.toISO()]);
   if(state.token==='provider-error')throw new BridgeError('icloud_connection_failed',502);
   if(state.token==='dense' && window.end.diff(window.start,'days').days>49)throw new BridgeError('event_limit',502);
   return icalEvents([{data:ics}],state.sources[0],window);},
  renderDots:async(...args)=>{renders++;return renderDots(...args);}});
}
const one=instance();
async function request(handler,{token='one',offset=0,view='dots',reuse=true,bounds='grid',method='GET'}={}) {
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},send(b){this.body=b;return this;},end(){this.ended=true;return this;}};
 await handler({method,url:`/api/calendar-widget?token=${token}&offset=${offset}&view=${view}&bounds=${view==='dots'?bounds:'full'}&format=widgy&agenda=home-v1${reuse?'&reuse=months-v1':''}`},res);return res;
}
const bad=await request(one,{token:'bad'});assert.equal(bad.code,401);assert.equal(calls,0);assert.equal(cacheReads,0);
// Cold concurrent navigation into each of the three neighbouring months shares
// one pending provider request, yet produces three correctly isolated PNGs.
const pooled=await Promise.all([-1,0,1].map(offset=>request(one,{offset})));
assert.equal(calls,1);assert.equal(renders,3);
for(let i=0;i<3;i++) {
 const offset=i-1,a=pooled[i],b=await request(one,{offset,reuse:false});
 assert.equal(a.code,200);assert.equal(b.code,200);assert(a.body.equals(b.body),'Exact legacy PNG bytes');
 assert.equal(a.headers['X-Calendar-Generated-For'],b.headers['X-Calendar-Generated-For']);
 assert.equal(a.headers['CDN-Cache-Control'],'no-store');assert.match(a.headers['Cache-Control'],/^private, max-age=30, must-revalidate$/);
}
assert.equal(calls,4,'One pooled plus three legacy reads');
const count=renders;for(const offset of [1,0,-1])await request(one,{offset});assert.equal(renders,count,'Reuse each month PNG, never a sibling PNG');
const a=await request(one,{view:'today'}),b=await request(one,{view:'today',reuse:false});assert.deepEqual(JSON.parse(JSON.stringify(a.body)),JSON.parse(JSON.stringify(b.body)));assert.equal(calls,4);
const fields=JSON.parse(readFileSync(new URL('./widget-tab-selectors.json',import.meta.url)));for(const name of fields)assert(name in a.body,name);
const head=await request(one,{offset:1,method:'HEAD'});assert.equal(head.code,200);assert(head.ended);assert.equal(head.body,undefined);
await Promise.all(tasks);const separate=instance(),before=calls;
const shared=await request(separate,{offset:1});assert.equal(shared.headers['X-Calendar-Provider-Cache'],'SHARED');assert.equal(calls,before);assert(shared.body.equals(pooled[2].body));
const start=calls;
for(let offset=-12;offset<=12;offset++)assert.equal((await request(one,{token:'all-months',offset})).code,200);
assert.equal(calls-start,9,'25 displayed months -> 9 provider reads in one freshness window');
await request(one,{token:'different-account'});assert.equal(calls-start,10);
const expiring=calls;time+=60000;await request(one);assert.equal(calls,expiring+1,'Hits cannot renew provider TTL');
const denseBefore=calls;assert.equal((await request(one,{token:'dense'})).code,200);assert.equal(calls,denseBefore+2,'Capacity-only fallback uses original monthly range');
const failed=calls;assert.equal((await request(one,{token:'provider-error'})).code,502);assert.equal(calls,failed+1,'Do not retry general provider errors');
const validation=calls;assert.equal((await request(one,{offset:13})).code,400);assert.equal((await request(one,{method:'POST'})).code,405);assert.equal(calls,validation);
time=Date.parse('2027-01-01T00:30:00Z');const rollover=await request(one,{offset:0});assert.equal(rollover.headers['X-Calendar-Generated-For'],'2027-01');
await Promise.all(tasks);
console.log('PASS: concurrent adjacent months 3 -> 1 provider read, 25 months -> 9 reads, exact legacy PNG/JSON, separate PNG caches, shared-instance reuse, account/month isolation, expiry, capacity fallback, auth, HEAD and rollover.');
