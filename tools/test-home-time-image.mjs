import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {homeTimeModel,renderHomeTime,homeTimeImage,homeTimeSVG} from '../lib/calendar-bridge/home-time-image.js';
import {monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {presentAgenda} from '../lib/calendar-bridge/agenda-presentation.js';
const flight={title:'Flight to Tel Aviv (XX 987)',location:'Abu Dhabi AUH',start:'2027-02-17T04:50:00Z',end:'2027-02-17T08:20:00Z',allDay:false,color:2,uid:'test'};
function fixture(events=[flight],zone='Asia/Kolkata',now=new Date('2027-02-17T03:00:00Z')){
 const w=monthWindow({now,zone}),days=eventsByDay(events,w),raw=widgetSnapshot(events,w,now,days),presented=presentAgenda(raw,days,[],true);
 return {raw,presented};
}
function query(pair,rows=pair.raw.rows){
 const q=new URLSearchParams({context:'home-v1',render:'home-time-v1',row:'1',native:'v2',day_zone:pair.raw.zone,native_date:pair.raw.date,native_count:String(rows.length),native_hour:'8',native_minute:'30',token:'PRIVATE_TOKEN'});
 rows.slice(0,4).forEach((r,i)=>['title','location','start','end'].forEach(k=>q.set(`n${i+1}_${k}`,r[k]??'')));
 return q;
}
const encode=p=>encodeURIComponent(JSON.stringify({version:1,...p}));
const response=()=>({headers:{},code:200,setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(c){this.code=c;return this;},json(body){this.body=body;return this;},end(body){this.body=body;return this;}});
test('airport clocks are independent from phone zone and row order',()=>{
 const pair=fixture([flight,{...flight,uid:'meeting',title:'Meeting'}]),q=query(pair,[pair.raw.rows.find(r=>r.title==='Meeting'),pair.raw.rows.find(r=>r.title===flight.title)]);
 assert.deepEqual(homeTimeModel(q,encode(pair)),{kind:'event',start:'10:20',end:'13:50'});
 q.set('row','2');assert.deepEqual(homeTimeModel(q,encode(pair)),{kind:'flight',start:'08:50',end:'10:20',departure:'AUH',arrival:'TLV'});
});
test('no metadata, stale date, altered evidence or ambiguous identity never uses phone flight clocks',()=>{
 const p=fixture(),q=query(p),altered=structuredClone(p);altered.presented.rows[0].start='10:20';
 for(const encoded of ['', 'bad',encode({...p,raw:{...p.raw,date:'2027-02-18'}}),encode(altered),encode({...p,raw:{...p.raw,rows:[...p.raw.rows,...p.raw.rows]}})])assert.deepEqual(homeTimeModel(q,encoded),{kind:'unavailable',text:'FLIGHT TIMES UNAVAILABLE'});
 q.set('native_date','${widgy.missing}');assert.equal(homeTimeModel(q,encode(p)).kind,'unavailable');
});
test('ordinary appointments, all-day and missing clocks have explicit outcomes',()=>{
 const p=fixture([{...flight,title:'Meeting'}]),q=query(p);
 assert.deepEqual(homeTimeModel(q,''),{kind:'event',start:'10:20',end:'13:50'});
 q.set('n1_start','10:20 AM');q.set('n1_end','1:50 PM');assert.equal(homeTimeModel(q,'').end,'13:50');
 q.set('n1_start','');assert.equal(homeTimeModel(q,'').kind,'unavailable');
 const all=fixture([{...flight,title:'Conference',allDay:true,start:'2027-02-17',end:'2027-02-18'}]);assert.equal(homeTimeModel(query(all),encode(all)).text,'ALL DAY');
});
test('other airports and dates, DST and date-line labels are inherited from verified evidence',()=>{
 for(const e of [
  {...flight,title:'Flight from JFK to LHR (XX 12)',location:'',start:'2027-03-15T23:00:00Z',end:'2027-03-16T06:00:00Z'},
  {...flight,title:'Flight from NRT to LAX (XX 14)',location:'',start:'2027-07-19T10:00:00Z',end:'2027-07-19T20:00:00Z'},
  {...flight,title:'Flight from KTM to DEL (XX 15)',location:'',start:'2027-02-17T04:50:00Z',end:'2027-02-17T06:20:00Z'},
 ]){
  const p=fixture([e],'UTC',new Date(e.start)),m=homeTimeModel(query(p),encode(p)),r=p.presented.rows[0];
  assert.equal(m.kind,'flight');assert.equal(m.start,r.start);assert.equal(m.end,r.end);assert.equal(m.arrival,r.endLabel);
 }
});
test('PNG is transparent, deterministic and font-independent with actual icon and text paths',async()=>{
 const p=fixture(),m=homeTimeModel(query(p),encode(p));
 const png=await renderHomeTime(m),meta=await sharp(png).metadata();
 assert.equal(meta.format,'png');assert.equal(meta.width,1348);assert.equal(meta.height,100);assert.equal(meta.hasAlpha,true);
 const {data}=await sharp(png).raw().toBuffer({resolveWithObject:true});
 let visible=0,transparent=0;for(let i=3;i<data.length;i+=4){if(data[i])visible++;else transparent++;}assert(visible>1000&&transparent>10000);
 const svg=homeTimeSVG(m);assert(!svg.includes('<text'));assert(svg.includes('rotate(-25)')&&svg.includes('rotate(25)')&&svg.includes('stroke-width="1.5"'));
 assert(png.equals(await renderHomeTime(m)));
});
test('adapter preserves auth, strips identity/coordinates from child request, HEAD suppresses PNG',async()=>{
 const p=fixture(),q=query(p);q.set('lat','1');q.set('location_key','PRIVATE_LOCATION');
 let url;const adapter=homeTimeImage(async(req,res)=>{url=req.url;res.json({encoded:encode(p)});});
 const get=response();await adapter({method:'GET',url:'/?'+q},get);
 assert.equal(get.code,200);assert(Buffer.isBuffer(get.body));assert.equal(get.headers['content-type'],'image/png');assert.match(get.headers['cache-control'],/no-store/);
 const child=new URL(url,'https://example.test');assert.equal(child.searchParams.get('token'),'PRIVATE_TOKEN');
 for(const key of ['context','render','row','n1_title','native_date','lat','location_key'])assert(!child.searchParams.has(key));
 const head=response();await adapter({method:'HEAD',url:'/?'+q},head);assert.equal(head.body,undefined);assert.equal(head.headers['content-length'],get.headers['content-length']);
 for(const code of [401,403,429,500]){let rendered=false;const r=response();await homeTimeImage(async(req,res)=>res.status(code).json({error:'PRIVATE_ERROR'}),{render:()=>{rendered=true;}})({method:'GET',url:'/?'+q},r);assert.equal(r.code,code===500?502:code);assert(!rendered);assert(!JSON.stringify(r).includes('PRIVATE'));}
});
test('bad inputs and methods never invoke provider; timeout and rendering failures are bounded',async()=>{
 const q=query(fixture());let called=false;const adapter=homeTimeImage(async()=>{called=true;});
 for(const suffix of ['&row=2','&token=other']){const r=response();await adapter({method:'GET',url:'/?'+q+suffix},r);assert.equal(r.code,400);}
 for(const row of ['0','5','14','x','']){const input=new URLSearchParams(q);input.set('row',row);const r=response();await adapter({method:'GET',url:'/?'+input},r);assert.equal(r.code,400);}
 const method=response();await adapter({method:'POST',url:'/?'+q},method);assert.equal(method.code,405);assert(!called);
 let deferred=false;const timeout=response();await homeTimeImage(()=>new Promise(()=>{}),{budgetMs:5,defer:()=>{deferred=true;}})({method:'GET',url:'/?'+q},timeout);assert.equal(timeout.code,504);assert(deferred);
 const failure=response();await homeTimeImage(async(req,res)=>res.json({encoded:''}),{render:async()=>{throw Error('PRIVATE');}})({method:'GET',url:'/?'+q},failure);assert.equal(failure.code,502);assert(!JSON.stringify(failure).includes('PRIVATE'));
});
