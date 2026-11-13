import {createWidgetContext} from '../lib/widget-context.js';
import {unifiedAgenda} from '../lib/calendar-bridge/unified-agenda.js';
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
let time=Date.parse('2026-11-12T06:00:00Z'),reads=0,renders=0,fail=false,rejectRender=false,indexBuilds=0;
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
 yearProviderWindow,yearPreparedDaysFor:(entry,...args)=>{if(!entry.dayIndex)indexBuilds++;return yearPreparedDaysFor(entry,...args);},preparedDaysFor,resilientEvents,widgetSnapshot,widgyFields,sourceZone,sourceTimeFields,
 flightProfiles,presentAgenda,agendaPresentationFields,unifiedAgenda,
 unseal:async token=>{if(token==='bad')throw new BridgeError('unauthorized',401);return state;},
 renderDots:async(...args)=>{renders++;if(rejectRender){rejectRender=false;throw Error('synthetic render failure');}return renderDots(...args);}
});
async function request(query='',token='PRIVATE_TOKEN',method='GET'){
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},send(b){this.body=b;return this;},end(){return this;}};
 await handler({method,url:'/api/calendar-widget?token='+token+'&'+query},res);return res;
}
const q='view=dots&bounds=grid&reuse=year-v2';
const burst=await Promise.all(Array.from({length:20},()=>request(q)));
const first=burst[0];assert.equal(first.code,200);
assert.equal(renders,1,'A cold burst renders the same month only once');
assert.equal(indexBuilds,1,'Cold concurrent readers build the shared year index only once');
for(const result of burst)assert.equal(result.body,first.body,'Cold concurrent readers share the PNG buffer');assert.equal(first.headers['Content-Type'],'image/png');
assert.equal(first.headers['CDN-Cache-Control'],'no-store');assert.equal(reads,2);
assert.equal((await request(q)).body,first.body);assert.equal(renders,1);
const metadata=await request('view=today&format=widgy&metadata=native-v1&presentation=agenda-v2');
assert.equal(metadata.code,200);assert.equal(reads,2,'Metadata shares the same source reads with dots');
const pair=JSON.parse(decodeURIComponent(metadata.body.encoded));assert.equal(pair.version,1);
assert.equal(pair.raw.rows.length,8);assert.equal(pair.raw.generatedAt,pair.presented.generatedAt);
assert.equal(pair.raw.date,pair.presented.date);assert.equal(pair.raw.total,8);
// Unified path exercised through the actual handler, complete source cache,
// prepared day index and serialization, before/at/after expiry.
const unifiedQuery='view=today&agenda=unified-v1&presentation=agenda-v2&flight_mode=auto-v1&day_zone=Asia%2FJerusalem';
const unified=await request(unifiedQuery);assert.equal(unified.code,200);
assert.equal(unified.body.agenda.fields.count,8);assert.equal(unified.body.agenda.fields.event_1_title,'PRIVATE_TITLE 0');
time=Date.parse('2026-11-12T09:00:00Z');
const ended=await request(unifiedQuery);assert.equal(ended.body.agenda.fields.state,'finished');assert.equal(ended.body.agenda.fields.home_visible,0);
assert.equal(ended.body.agenda.fields.message,'No more events today');
assert.equal((await request(unifiedQuery,'bad')).code,401);
assert.equal((await request(unifiedQuery,'PRIVATE_TOKEN','HEAD')).body,undefined);
const outer=createWidgetContext({calendar:async()=>handler,clock:()=>time,log:x=>logs.push(x),weather:async()=>(req,res)=>res.json({icon_status:'Clear'}),location:async()=>(req,res)=>res.json({text:'Test'})});
const response={headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(b){this.body=JSON.parse(JSON.stringify(b))},end(){}};
await outer({method:'GET',url:'/api/calendar-widget?context=home-v1&agenda=unified-v1&token=PRIVATE_TOKEN&day_zone=Asia%2FJerusalem&flight_mode=auto-v1'},response);
assert.equal(response.body.calendar.agenda.fields.ready,1);assert.equal(response.body.calendar.agenda.fields.message,'No more events today');
assert.equal(response.body.calendar.agenda.fields.event_1_title,'');assert.equal(response.body.weather.icon_status,'Clear');
await outer({method:'GET',url:'/api/calendar-widget?context=home-v1&agenda=unified-v1&display=flat-v1&token=PRIVATE_TOKEN&day_zone=Asia%2FJerusalem&flight_mode=auto-v1'},response);
assert.equal(response.body.agenda.display_code,3);assert.equal(response.body.agenda.message,'No more events today');
assert(!('calendar' in response.body));assert.equal(response.body.weather.icon_status,'Clear');
fail=true;time+=120000;
assert.equal((await request(unifiedQuery,'isolated-new-key')).code,502,'one missing provider cannot become a complete empty/finished agenda');
assert(!JSON.stringify(logs).includes('PRIVATE_'));
console.log('PASS: unified actual handler, provider merge, complete snapshot, expiration, 8 rows, auth, HEAD, partial failure and private logs');
