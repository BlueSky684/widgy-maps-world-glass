import {DateTime} from 'luxon';
import native from './native-calendar.cjs';

// Native rows and the daily count have different lifetimes: Widgy may remove
// a completed row while retaining the day's count. Empty rows are never events.
// Airport clocks are display values, never the clock used to expire a flight.
export function nativeAgendaState(input, encoded, nowMs=Date.now()) {
  const text=v=>native.clean(v).trim();
  const count=native.nativeCount(input.get('native_count'));
  const date=input.get('native_date'),zone=input.get('day_zone');
  const now=DateTime.fromMillis(nowMs,{zone:zone||'invalid'});
  let raw=null,presented=null;
  try {
    const pair=JSON.parse(decodeURIComponent(encoded));
    const valid=s=>s?.version===2&&s.ok===true&&s.date===date&&s.zone===zone&&Array.isArray(s.rows);
    if(pair.version===1&&valid(pair.raw)&&valid(pair.presented)&&now.isValid&&now.toISODate()===date
      && nowMs-Date.parse(pair.raw.generatedAt)>=-60000&&nowMs-Date.parse(pair.raw.generatedAt)<=120000) {
      raw=pair.raw;presented=pair.presented;
    }
  } catch {}
  const rows=Array.from({length:4},(_,i)=>Object.fromEntries(['title','location','start','end'].map(k=>[k,input.get(`n${i+1}_${k}`)||''])));
  const phases=rows.map(row=>{
    if(!text(row.title))return 'absent';
    const match=native.matchRow(row,raw,presented,[]);
    const source=match?raw.rows[presented.rows.indexOf(match)]:null;
    if(source?.allDay===1)return 'all-day';
    if(source){
      const start=Date.parse(source.startAt),end=Date.parse(source.endAt);
      if(Number.isFinite(start)&&Number.isFinite(end)&&end>=start)
        return end<=nowMs?'ended':start>nowMs?'future':'active';
    }
    return 'unknown';
  });
  let state='unknown';
  // All-day events and future events outside the four native slots prevent a
  // false end-of-day conclusion. A count or an empty title alone is not proof.
  if(count===0&&!rows.some(r=>text(r.title)))state='empty';
  else if(raw&&raw.total===count&&raw.rows.length===count&&count>0&&raw.rows.every(r=>
    r.allDay!==1&&Number.isFinite(Date.parse(r.startAt))&&Number.isFinite(Date.parse(r.endAt))
    &&Date.parse(r.endAt)>=Date.parse(r.startAt)&&Date.parse(r.endAt)<=nowMs))state='finished';
  else if(phases.some(p=>['active','future','all-day'].includes(p)))state='remaining';
  return {state,phases};
}
