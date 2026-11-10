import {DateTime} from 'luxon';
import {BridgeError} from './security.js';
import {sourceZone} from './source-timezones.js';

// Owner-confirmed flight facts live in the private widget request, never in a
// public title/airport heuristic. Bind each confirmation to both exact event
// instants and the full title so it cannot turn a later meeting into a flight.
export function flightProfiles(encoded) {
  if(!encoded)return [];
  try {
    if(encoded.length>6000 || !/^[A-Za-z0-9_-]+$/.test(encoded))throw Error();
    const values=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
    if(!Array.isArray(values) || values.length>8)throw Error();
    return values.map(value=>{
      if(!value || typeof value.title!=='string' || !value.title.trim() || value.title.length>500)throw Error();
      const instant=iso=>typeof iso==='string' && /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso)?DateTime.fromISO(iso,{setZone:true}):null;
      const start=instant(value.start),end=instant(value.end);
      if(!start?.isValid || !end?.isValid || end<=start)throw Error();
      for(const side of ['departure','arrival'])if(!sourceZone(value[side]?.zone) || !/^[A-Z]{3}$/.test(value[side]?.airport || ''))throw Error();
      return {title:value.title.trim(),startMs:start.toMillis(),endMs:end.toMillis(),
        departure:{zone:value.departure.zone,airport:value.departure.airport},
        arrival:{zone:value.arrival.zone,airport:value.arrival.airport}};
    });
  }catch {throw new BridgeError('invalid_flight_profile');}
}

export function presentAgenda(snapshot,preparedDays,profiles=[]) {
  const events=preparedDays.find(day=>day.date===snapshot.date)?.events || [];
  return {...snapshot,rows:snapshot.rows.map((row,index)=>{
    const event=events[index];
    if(!event || event.allDay)return {...row,start:'',end:'',flight:0,startLabel:'',endLabel:''};
    const start=DateTime.fromISO(event.start,{zone:snapshot.zone});
    const end=DateTime.fromISO(event.end,{zone:snapshot.zone});
    const flight=profiles.find(profile=>profile.title===event.title && profile.startMs===start.toMillis() && profile.endMs===end.toMillis());
    if(!flight)return {...row,start:start.toFormat('HH:mm'),end:end.toFormat('HH:mm'),flight:0,startLabel:'START',endLabel:'END'};
    const departure=start.setZone(flight.departure.zone),arrival=end.setZone(flight.arrival.zone);
    // Compare civil date labels, not elapsed hours (DST / date-line travel).
    const dateOffset=Math.round(DateTime.fromISO(arrival.toISODate(),{zone:'UTC'}).diff(DateTime.fromISO(departure.toISODate(),{zone:'UTC'}),'days').days);
    return {...row,start:departure.toFormat('HH:mm'),end:arrival.toFormat('HH:mm'),flight:1,
      startLabel:flight.departure.airport,endLabel:flight.arrival.airport+(dateOffset?` ${dateOffset>0?'+':''}${dateOffset}d`:''),
      departureZone:flight.departure.zone,arrivalZone:flight.arrival.zone};
  })};
}

export function confirmedDeparture(event,profiles=[]) {
  if(!profiles.length || !event || event.allDay)return '';
  const start=DateTime.fromISO(event.start,{setZone:true}),end=DateTime.fromISO(event.end,{setZone:true});
  const flight=profiles.find(profile=>profile.title===event.title && profile.startMs===start.toMillis() && profile.endMs===end.toMillis());
  return flight?start.setZone(flight.departure.zone).toFormat('HH:mm'):'';
}

export function agendaPresentationFields(snapshot) {
  const fields={calendar_agenda_date:snapshot?.date || '',calendar_agenda_zone:snapshot?.zone || ''};
  for(let index=0;index<4;index++){
    const row=snapshot?.rows?.[index],prefix=`calendar_event_${index+1}_`;
    fields[prefix+'flight']=row?.flight || 0;
    fields[prefix+'start_label']=row?.startLabel || '';
    fields[prefix+'end_label']=row?.endLabel || '';
  }
  return fields;
}
