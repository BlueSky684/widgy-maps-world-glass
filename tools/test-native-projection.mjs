import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeProjection} from '../lib/calendar-bridge/native-projection.js';
import {monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {presentAgenda} from '../lib/calendar-bridge/agenda-presentation.js';
import {createWidgetContext} from '../lib/widget-context.js';

const flight={title:'Flight to Tel Aviv (XX 987)',location:'Abu Dhabi AUH',start:'2027-02-17T04:50:00Z',end:'2027-02-17T08:20:00Z',allDay:false,color:2,uid:'test'};
function fixture(events=[flight],zone='Asia/Kolkata') {
 const now=new Date('2027-02-17T03:00:00Z'),w=monthWindow({now,zone}),days=eventsByDay(events,w);
 const raw=widgetSnapshot(events,w,now,days),presented=presentAgenda(raw,days,[],true);
 return {raw,presented};
}
function query(pair,rows=pair.raw.rows) {
 const q=new URLSearchParams({context:'home-v1',native:'v2',day_zone:pair.raw.zone,native_date:pair.raw.date,native_count:String(rows.length),native_hour:'8',native_minute:'30',token:'PRIVATE_TOKEN',location_key:'PRIVATE_KEY'});
 rows.slice(0,4).forEach((r,i)=>['title','location','start','end'].forEach(k=>q.set(`n${i+1}_${k}`,r[k]??'')));
 return q;
}
const encode=pair=>encodeURIComponent(JSON.stringify({version:1,...pair}));
test('direct scalar projection matches native identity and local airport clocks',()=>{
 const pair=fixture(),r=nativeProjection(query(pair),encode(pair));
 assert.equal(r.status,'flight-matched');assert.equal(r.spacious,1);
 assert.equal(r.fields.calendar_event_1_flight,1);
 assert.equal(r.fields.calendar_event_1_flight_start,'08:50');assert.equal(r.fields.calendar_event_1_flight_end,'10:20');
 assert.equal(r.fields.calendar_event_1_start_label,'AUH');assert.equal(r.fields.calendar_event_1_end_label,'TLV');
 assert.deepEqual(JSON.parse(decodeURIComponent(r.bundle)).rows,r.rows);
});
test('native ordering is authoritative, with no transfer to other event rows',()=>{
 const pair=fixture([{...flight,uid:'meeting',title:'Meeting',start:'2027-02-17T03:30:00Z',end:'2027-02-17T04:00:00Z'},flight]);
 const rows=[...pair.raw.rows].reverse(),r=nativeProjection(query(pair,rows),encode(pair));
 assert.equal(r.rows[0].flight,1);assert.equal(r.rows[1].flight,0);assert.equal(r.spacious,1);
 for(const field of ['title','location','start','end']) {
  const changed=structuredClone(rows);changed[0][field]+=' changed';
  assert.equal(nativeProjection(query(pair,changed),encode(pair)).rows[0].flight,0);
 }
});
test('missing, stale, duplicate or corrupt metadata keeps native fallback and hides flight design',()=>{
 const p=fixture(),q=query(p);
 for(const encoded of ['', 'bad',encode({...p,raw:{...p.raw,date:'2027-02-18'}}),encode({...p,raw:{...p.raw,rows:[...p.raw.rows,...p.raw.rows]}})]) {
  const r=nativeProjection(q,encoded);assert.equal(r.rows[0].flight,0);assert.equal(r.spacious,0);assert.match(r.home,/Flight to Tel Aviv/);
 }
 const changed=structuredClone(p);changed.presented.rows[0].start='10:20';assert.equal(nativeProjection(q,encode(changed)).rows[0].flight,0);
 q.set('native_date','${widgy.unresolved}');assert.equal(nativeProjection(q,encode(p)).status,'invalid-native-input');
});
test('ordinary, all-day, Hebrew and four-row layouts retain their own metadata',()=>{
 const p=fixture([{...flight,title:'טיסה מאבו דאבי לתל אביב',location:''},{...flight,uid:'a',title:'Meeting'},{...flight,uid:'b',title:'Conference'},{...flight,uid:'c',title:'Hotel'}]);
 const r=nativeProjection(query(p),encode(p));assert.equal(r.spacious,0);assert.equal(r.rows.filter(x=>x.flight).length,1);
 assert.equal(r.rows.find(x=>x.flight).title_layout,2);
 const all=fixture([{...flight,title:'All day',allDay:true,start:'2027-02-17',end:'2027-02-18'}]);assert.equal(nativeProjection(query(all),encode(all)).rows[0].all_day,1);
});
test('native query text is not forwarded to weather/location or logged; cached body is not mutated',async()=>{
 const p=fixture(),q=query(p),original={encoded:encode(p)},seen=[],logs=[];
 const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(b){this.body=b;return this;},end(){return this;}});
 const context=createWidgetContext({calendar:async()=>async(req,res)=>{seen.push(req.url);res.json(original);},weather:async()=>async(req,res)=>{seen.push(req.url);res.json({icon_status:'Clear'});},location:async()=>async(req,res)=>{seen.push(req.url);res.json({text:'Test'});},log:x=>logs.push(x)});
 const r=response();await context({method:'GET',url:'/?'+q},r);
 assert.equal(r.body.calendar.native.rows[0].flight,1);assert.equal(original.native,undefined);
 assert(seen.every(url=>!url.includes('n1_')));assert(!JSON.stringify(logs).includes('PRIVATE_'));assert(!JSON.stringify(logs).includes(flight.title));
 assert.equal(logs[0].nativeStatus,'flight-matched');
});
