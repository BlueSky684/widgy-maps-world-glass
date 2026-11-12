import {DateTime} from 'luxon';
import {BridgeError} from './security.js';
import {sourceZone} from './source-timezones.js';
import {automaticFlight} from './flight-route.js';

// Backward compatibility for explicit flight profiles in older clients.
// Automatic clients send flight_mode=auto-v1 without individual profiles.
// Legacy confirmations remain bound to the full title and both instants.
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

export function presentAgenda(snapshot,preparedDays,profiles=[],automatic=false) {
  const events=preparedDays.find(day=>day.date===snapshot.date)?.events || [];
  return {...snapshot,rows:snapshot.rows.map((row,index)=>{
    const event=events[index];
    if(!event || event.allDay)return {...row,start:'',end:'',flight:0,startLabel:'',endLabel:''};
    const start=DateTime.fromISO(event.start,{zone:snapshot.zone});
    const end=DateTime.fromISO(event.end,{zone:snapshot.zone});
    const flight=profiles.find(profile=>profile.title===event.title && profile.startMs===start.toMillis() && profile.endMs===end.toMillis()) || (automatic?automaticFlight(event):null);
    if(!flight)return {...row,start:start.toFormat('HH:mm'),end:end.toFormat('HH:mm'),flight:0,startLabel:'START',endLabel:'END'};
    const departure=flight.departure?start.setZone(flight.departure.zone):null;
    const arrival=flight.arrival?end.setZone(flight.arrival.zone):null;
    const dateOffset=departure && arrival?Math.round(DateTime.fromISO(arrival.toISODate(),{zone:'UTC'}).diff(DateTime.fromISO(departure.toISODate(),{zone:'UTC'}),'days').days):0;
    const startLabel=flight.departure?.label || flight.departure?.airport || 'DEPART';
    const endLabel=flight.arrival?.label || flight.arrival?.airport || 'ARRIVE';
    return {...row,start:departure?.toFormat('HH:mm') || '—',end:arrival?.toFormat('HH:mm') || '—',flight:1,
      startLabel,endLabel:endLabel+(dateOffset?` ${dateOffset>0?'+':''}${dateOffset}d`:''),
      departureZone:flight.departure?.zone || '',arrivalZone:flight.arrival?.zone || '',
      ...(automatic?{flightEvidence:{version:1,start:start.toUTC().toISO(),end:end.toUTC().toISO(),
        departure:flight.departure?{zone:flight.departure.zone,label:startLabel}:null,
        arrival:flight.arrival?{zone:flight.arrival.zone,label:endLabel}:null,
        status:departure && arrival?'resolved':'route-incomplete'}}:{})};
  })};
}

export function confirmedDeparture(event,profiles=[],automatic=false) {
  if(!event || event.allDay)return '';
  const start=DateTime.fromISO(event.start,{setZone:true}),end=DateTime.fromISO(event.end,{setZone:true});
  const flight=profiles.find(profile=>profile.title===event.title && profile.startMs===start.toMillis() && profile.endMs===end.toMillis()) || (automatic?automaticFlight(event):null);
  return flight?(flight.departure?start.setZone(flight.departure.zone).toFormat('HH:mm'):'—'):'';
}

export function agendaPresentationFields(snapshot) {
  const fields={calendar_agenda_date:snapshot?.date || '',calendar_agenda_zone:snapshot?.zone || ''};
  for(let index=0;index<4;index++){
    const row=snapshot?.rows?.[index],prefix=`calendar_event_${index+1}_`;
    fields[prefix+'flight']=row?.flight || 0;
    fields[prefix+'start_label']=row?.startLabel || '';
    fields[prefix+'end_label']=row?.endLabel || '';
    // Split a flight number only after the row is classified as a flight.
    const title=row?.flight ? String(row.title || '') : '';
    const match=title.match(/\s*\(([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)\)\s*$/);
    const leading=!match?title.match(/^([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)\s+[:·-]?\s*/):null;
    fields[prefix+'flight_title']=match ? title.slice(0,match.index).trim() : leading?title.slice(leading[0].length).trim():title;
    fields[prefix+'flight_number']=match ? match[1] : leading?leading[1]:'';
  }
  return fields;
}

