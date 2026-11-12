import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {BridgeError,privateHeaders} from '../lib/calendar-bridge/security.js';
import {monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {monthProviderWindow,monthViewEntry} from '../lib/calendar-bridge/month-provider-window.js';
import {yearProviderWindow,yearPreparedDaysFor} from '../lib/calendar-bridge/year-provider-window.js';
import {preparedDaysFor} from '../lib/calendar-bridge/prepared-days.js';
import {createResilientEvents} from '../lib/calendar-bridge/resilient-events.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {widgyFields} from '../lib/calendar-bridge/widgy-fields.js';
import {sourceZone,sourceTimeFields} from '../lib/calendar-bridge/source-timezones.js';
import {flightProfiles,presentAgenda,agendaPresentationFields} from '../lib/calendar-bridge/agenda-presentation.js';
const code=readFileSync(new URL('../api/calendar-widget.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'')
 .replace('export default async function handler','async function handler').replace('export function clientMaxAge','function clientMaxAge');
let time=Date.parse('2026-11-12T06:00:00Z'),reads=0,renders=0,fail=false;
const remote=new Map(),tasks=[],logs=[];
const state={zone:'Asia/Jerusalem',sources:[{provider:'google',id:'PRIVATE_SOURCE',color:2},{provider:'icloud',id:'PRIVATE_ICAL',color:1}]};
const events=Array.from({length:8},(_,i)=>({uid:String(i),source:'PRIVATE_SOURCE',title:'PRIVATE_TITLE '+i,location:'PRIVATE_LOCATION',
 color:i%4,start:'2026-11-12T08:00:00Z',end:'2026-11-12T09:00:00Z'}));
class Clock extends Date {constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
const resilientEvents=createResilientEvents({now:()=>time,background:p=>tasks.push(p),read:async s=>{
 reads++;if(fail&&s.sources[0].provider==='icloud')throw new BridgeError('icloud_connection_failed',502);
 return s.sources[0].provider==='google'?events:[];
},remote:()=>({get:async k=>remote.get(k),set:async(k,v)=>remote.set(k,v)})});
const handler=vm.runInNewContext(code+'\nhandler',{Date:Clock,URL,performance,createHash,BridgeError,privateHeaders,
 console:{info:s=>logs.push(JSON.parse(s))},origin:()=> 'https://example.invalid',monthWindow,monthProviderWindow,monthViewEntry,
 yearProviderWindow,yearPreparedDaysFor,preparedDaysFor,resilientEvents,widgetSnapshot,widgyFields,sourceZone,sourceTimeFields,
 flightProfiles,presentAgenda,agendaPresentationFields,
 unseal:async token=>{if(token==='bad')throw new BridgeError('unauthorized',401);return state;},
 renderDots:async(...args)=>{renders++;return renderDots(...args);}
});
async function request(query='',token='PRIVATE_TOKEN',method='GET'){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},send(b){this.body=b;return this;},end(){return this;}};
 await handler({method,url:'/api/calendar-widget?token='+token+'&'+query},res);return res;
}
const q='view=dots&bounds=grid&reuse=year-v2';
const first=await request(q);assert.equal(first.code,200);assert.equal(first.headers['Content-Type'],'image/png');
assert.equal(first.headers['CDN-Cache-Control'],'no-store');assert.equal(reads,2);
assert.equal((await request(q)).body,first.body);assert.equal(renders,1);
const metadata=await request('view=today&format=widgy&metadata=native-v1&presentation=agenda-v2');
assert.equal(metadata.code,200);assert.equal(reads,2,'Metadata shares the same source reads with dots');
const pair=JSON.parse(decodeURIComponent(metadata.body.encoded));assert.equal(pair.version,1);
assert.equal(pair.raw.rows.length,8);assert.equal(pair.raw.generatedAt,pair.presented.generatedAt);
assert.equal(pair.raw.date,pair.presented.date);assert.equal(pair.raw.total,8);
await Promise.all(tasks);time+=120000;fail=true;
const retained=await request(q);assert.equal(retained.code,200);assert.equal(retained.headers['X-Calendar-Data-State'],'refreshing');
assert.equal(retained.headers['Cache-Control'],'private, no-store');assert.equal(renders,1);
await Promise.all(tasks);
const after=await request(q);assert.equal(after.headers['X-Calendar-Data-State'],'refresh-failed');assert.equal(after.body,first.body);
const partial=await request(q,'fresh-link');assert.equal(partial.code,200);assert.equal(partial.headers['X-Calendar-Data-State'],'partial');
assert.equal(partial.headers['X-Calendar-Missing-Sources'],'1');assert.equal(partial.headers['Cache-Control'],'private, no-store');
assert.equal((await request('view=today&metadata=native-v1&format=widgy','fresh-link')).code,502);
const before=reads;
for(const [query,token,method,code] of [[q,'bad','GET',401],[q+'&offset=13','PRIVATE_TOKEN','GET',400],[q+'&day_zone=bad','PRIVATE_TOKEN','GET',400],[q,'PRIVATE_TOKEN','POST',405]]){
 assert.equal((await request(query,token,method)).code,code);
}
assert.equal(reads,before,'Validation/auth before all cached data');
assert.equal((await request(q+'&flights=malformed&presentation=agenda-v2')).code,200,'Dots do not depend on unused flight profiles');
assert.equal((await request(q,'PRIVATE_TOKEN','HEAD')).body,undefined);
assert(!JSON.stringify(logs).includes('PRIVATE_'),'Operational logs never contain token, source or event data');
await Promise.all(tasks);
console.log('PASS: actual handler PNG/cache reuse, shared dots+metadata reads, atomic 8-row metadata, retained and partial headers, strict metadata failure, auth/zone/range/method validation, HEAD and log privacy.');
