import assert from 'node:assert/strict';
import {createResilientEvents} from '../lib/calendar-bridge/resilient-events.js';
import {monthWindow,renderDots} from '../lib/calendar-bridge/dots.js';
import {yearProviderWindow} from '../lib/calendar-bridge/year-provider-window.js';
import {BridgeError} from '../lib/calendar-bridge/security.js';
import {iCloudFetch} from '../lib/calendar-bridge/providers.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
let time=Date.parse('2026-11-12T06:00:00Z');
const shared=new Map(),tasks=[],calls=new Map();
const state={zone:'Asia/Jerusalem',sources:[
 {provider:'google',id:'g',color:2},
 {provider:'icloud',id:'h',color:3},
 {provider:'icloud',id:'w',color:1}
]};
const month=monthWindow({now:new Date(time),zone:state.zone});
const range=yearProviderWindow({now:new Date(time),zone:state.zone});
let modes={},block=null;
const fail=()=>new BridgeError('icloud_connection_failed',502);
const read=async(s,r)=>{
 const source=s.sources[0],id=source.id;
 calls.set(id,(calls.get(id)||0)+1);
 if(block)await block;
 if(modes[id]==='fail')throw fail();
 if(modes[id]==='dense' && r.end.diff(r.start,'days').days>49)throw new BridgeError('event_limit',502);
 if(modes[id]==='empty')return [];
 return [{uid:id,source:id,color:source.color,start:'2026-11-12T09:00:00+02:00',end:'2026-11-12T10:00:00+02:00',title:'Fixture '+id}];
};
const create=()=>createResilientEvents({read,now:()=>time,background:p=>tasks.push(p),remote:()=>({
 get:async k=>structuredClone(shared.get(k)),
 set:async(k,v,{ttl})=>{assert(ttl>0&&ttl<=86400);shared.set(k,structuredClone(v));}
})});
let cache=create();
const results=await Promise.all(Array.from({length:12},(_,i)=>cache('account-one',state,monthWindow({offset:i-10,now:new Date(time),zone:state.zone}),range)));
assert.equal([...calls.values()].reduce((a,b)=>a+b,0),3,'One read per source across concurrent months');
assert.equal(results[0].entry.events.length,3);
await Promise.all(tasks);
const initialPNG=await renderDots(results[0].entry.events,month);

// Beyond the former 15m fallback, a NEW instance returns the shared last good
// data immediately while provider I/O is still blocked. No sliding retention.
time+=20*60000;let release;block=new Promise(r=>release=r);cache=create();
const retained=await cache('account-one',state,month,range);
assert.equal(retained.availability,'refreshing');assert.equal(retained.staleSources,3);
assert((await renderDots(retained.entry.events,month)).equals(initialPNG));
modes.h='fail';release();block=null;await Promise.all(tasks);
const recovered=await cache('account-one',state,month,range);
assert.equal(recovered.entry.events.length,3);assert.equal(recovered.staleSources,1);
assert.equal(recovered.availability,'refresh-failed');

// A cold calendar failure does not remove data from healthy calendars. The
// partial response is explicit, and is NOT accepted as complete TODAY metadata.
const partial=await cache('new-link',state,month,range);
assert.equal(partial.missingSources,1);assert.equal(partial.availability,'partial');
assert.equal(partial.entry.events.length,2);
await assert.rejects(cache('new-link',state,month,range,{requireFresh:true}),e=>e.code==='icloud_connection_failed');
assert.equal((await cache('account-one',state,month,range)).entry.events.length,3,'Partial new link cannot poison old link');

// Genuine successful empty reads remove old dots. One source can recover and
// another be empty without merging deleted events back into the result.
time+=60000;modes={g:'empty',h:'empty',w:'empty'};
const empty=await cache('account-one',state,month,range,{requireFresh:true});
assert.equal(empty.entry.events.length,0);assert.equal(empty.availability,'current');
await Promise.all(tasks);
time+=86400001;modes={g:'fail',h:'fail',w:'fail'};
await assert.rejects(create()('account-one',state,month,range),e=>e.code==='icloud_connection_failed');
await assert.rejects(create()('never-seen',state,month,range));

// Dense annual sources fall back independently to the requested month.
modes={h:'dense'};const dense=await create()('dense',state,month,range);
assert.equal(dense.rangeFallback,true);assert.equal(dense.entry.events.length,3);
assert.equal(dense.missingSources,0);

// Narrow, read-only retry: transient 503 recovers once; 401 and unsafe
// redirects neither retry credentials nor leave Apple's validated hosts.
let hits=0;
await iCloudFetch('https://p01-caldav.icloud.com/fixture/',{method:'REPORT'},async()=>{
 hits++;return new Response('fixture',{status:hits===1?503:200});
});assert.equal(hits,2);
hits=0;await assert.rejects(iCloudFetch('https://p01-caldav.icloud.com/fixture/',{method:'REPORT'},async()=>{
 hits++;return new Response('',{status:401});
}),e=>e.providerStatus===401);assert.equal(hits,1);
hits=0;await assert.rejects(iCloudFetch('https://p01-caldav.icloud.com/fixture/',{method:'REPORT'},async()=>{
 hits++;return new Response('',{status:302,headers:{location:'https://example.invalid/'}});
}),e=>e.code==='invalid_calendar_url');assert.equal(hits,1);
await assert.rejects(iCloudFetch('https://p01-caldav.icloud.com/',{method:'DELETE'}),e=>e.code==='calendar_write_blocked');

// Ordinary API consumers keep four rows. Optional matching metadata includes
// other rows so native order/filter differences no longer lose their colors.
const events=Array.from({length:8},(_,i)=>({uid:String(i),source:'x',title:'Event '+i,color:i%4,start:'2026-11-12T08:00:00Z',end:'2026-11-12T09:00:00Z'}));
assert.equal(widgetSnapshot(events,month,new Date('2026-11-12T06:00:00Z')).rows.length,4);
assert.equal(widgetSnapshot(events,month,new Date('2026-11-12T06:00:00Z'),undefined,{rowLimit:256}).rows.length,8);
await Promise.all(tasks);
console.log('PASS: source isolation, 12 concurrent months single-flight, shared cold-start retention >15m, stale PNG pixels preserved, partial state, strict TODAY, deletion/empty replacement, hard 24h expiry, account isolation, capacity fallback, bounded iCloud retry/auth/redirects, extended matching metadata.');
