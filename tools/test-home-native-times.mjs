import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeProjection} from '../lib/calendar-bridge/native-projection.js';
import {monthWindow,eventsByDay} from '../lib/calendar-bridge/dots.js';
import {widgetSnapshot} from '../lib/calendar-bridge/widget-data.js';
import {presentAgenda} from '../lib/calendar-bridge/agenda-presentation.js';

function fixture(events,zone='UTC') {
  const now=new Date(events[0].start),w=monthWindow({now,zone}),days=eventsByDay(events,w);
  const raw=widgetSnapshot(events,w,now,days),presented=presentAgenda(raw,days,[],true);
  const input=new URLSearchParams({day_zone:zone,native_date:raw.date,native_count:String(raw.rows.length),native_hour:'0',native_minute:'0'});
  raw.rows.slice(0,4).forEach((r,i)=>['title','location','start','end'].forEach(k=>input.set(`n${i+1}_${k}`,r[k]??'')));
  return {input,encoded:encodeURIComponent(JSON.stringify({version:1,raw,presented}))};
}
function event(title,start,end,extra={}) {return {title,start,end,location:'',allDay:false,color:1,uid:title,...extra};}
test('native text receives independently checked airport clocks across phone zones, DST and midnight',()=>{
  const examples=[
    [event('Flight from AUH to TLV (XX 101)','2027-02-17T04:50:00Z','2027-02-17T08:20:00Z'),'08:50','10:20','AUH','TLV'],
    [event('Flight from JFK to LHR (XX 202)','2027-03-15T23:00:00Z','2027-03-16T06:00:00Z'),'19:00','06:00','JFK','LHR +1d'],
    [event('Flight from KTM to DEL (XX 303)','2027-02-17T04:50:00Z','2027-02-17T06:20:00Z'),'10:35','11:50','KTM','DEL'],
    [event('Flight from NRT to LAX (XX 404)','2027-07-19T01:00:00Z','2027-07-19T06:00:00Z'),'10:00','23:00','NRT','LAX -1d']
  ];
  for(const [e,start,end,departure,arrival] of examples)for(const zone of ['UTC','Asia/Dubai','Asia/Kolkata']){
    const {input,encoded}=fixture([e],zone),r=nativeProjection(input,encoded).home_times.row1;
    assert.deepEqual(r,{kind:'flight',text:'',start,end,departure,arrival});
  }
});
test('flight data failure clears clocks instead of falling back to phone time',()=>{
  const {input,encoded}=fixture([event('Flight from AUH to TLV','2027-02-17T04:50:00Z','2027-02-17T08:20:00Z')]);
  assert.equal(nativeProjection(input,encoded).home_times.row1.kind,'flight');
  for(const missing of ['', 'corrupt']){
    const r=nativeProjection(input,missing).home_times.row1;
    assert.deepEqual(r,{kind:'unavailable',text:'FLIGHT TIMES UNAVAILABLE',start:'',end:'',departure:'',arrival:''});
  }
  input.set('n1_location','different');assert.equal(nativeProjection(input,encoded).home_times.row1.kind,'unavailable');
  input.set('native_date','${widgy.not_ready}');assert.equal(nativeProjection(input,encoded).home_times.row1.start,'');
});
test('ordinary, all-day and unused rows have complete scalar values without image transport',()=>{
  for(const [e,kind] of [
    [event('Appointment','2027-02-17T04:50:00Z','2027-02-17T08:20:00Z'),'event'],
    [event('Conference','2027-02-17','2027-02-18',{allDay:true}),'all-day']
  ]){
    const {input,encoded}=fixture([e]),r=nativeProjection(input,encoded).home_times;
    assert.equal(r.row1.kind,kind);
    assert.deepEqual(Object.keys(r),['row1','row2','row3','row4']);
    for(const row of Object.values(r))assert(Object.values(row).every(v=>typeof v==='string'));
    assert.equal(r.row2.kind,'unavailable');assert.equal(r.row2.start,'');
  }
});
