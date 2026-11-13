import {automaticFlight} from './flight-route.js';
import native from './native-calendar.cjs';

// Shared contract for native Widgy text and legacy PNG clients.
// Only identity-matched evidence may supply airport-local clocks.
export function homeTimeForRow(input,p,index) {
  const row=p.rows[index];
  const unavailable={kind:'unavailable',text:'TIMES UNAVAILABLE'};
  if(p.ready!==1 || !Number.isInteger(index) || index<0 || !row || index>=Number(input.get('native_count')))return unavailable;
  const event=Object.fromEntries(['title','location','start','end'].map(k=>[k,input.get(`n${index+1}_${k}`)||'']));
  if(!native.clean(event.title).trim())return unavailable;
  if(row.flight===1)return {kind:'flight',start:row.flight_start,end:row.flight_end,departure:row.start_label,arrival:row.end_label};
  if(row.all_day===1)return {kind:'all-day',text:'ALL DAY'};
  // Without an identity/evidence match, phone clocks must never masquerade as
  // local departure/arrival clocks. Unknown routes remain explicitly unknown.
  if(automaticFlight(event))return {kind:'unavailable',text:'FLIGHT TIMES UNAVAILABLE'};
  const a=native.clock(event.start),b=native.clock(event.end);
  if(a===null || b===null)return unavailable;
  const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  return {kind:'event',start:hhmm(a),end:hhmm(b)};
}
