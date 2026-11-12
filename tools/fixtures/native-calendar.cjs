/* RC Direct 1t: native rows are authoritative; server metadata is optional.
 * This module is embedded in Widgy JavaScript fields by integrate-native.py.
 * No network access and no evaluation of calendar text as executable code.
 */
function clean(value) {
  const s=String(value == null ? '' : value);
  return /\$\{widgy\./.test(s) ? '' : s;
}
function normalized(value) {
  return clean(value).normalize('NFC').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim();
}
function clock(value) {
  const s=normalized(value).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
  const m=s.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if(!m)return null;
  let h=Number(m[1]),min=Number(m[2]);
  if(min>59 || h>23 || (m[3]&&(h<1||h>12)))return null;
  if(m[3])h=h%12+(m[3].toUpperCase()==='PM'?12:0);
  return h*60+min;
}
function nativeCount(value) {
  const s=normalized(value);
  return /^\d+$/.test(s) ? Number(s) : -1;
}
function countLabel(value) {
  const n=nativeCount(value);
  return n<0?'— events today':n+' '+(n===1?'event':'events')+' today';
}
function nativeStatus(value) {
  const n=nativeCount(value);
  return n<0?'Calendar unavailable':n===0?'No events today':'';
}
function snapshot(encoded,date,zone) {
  try {
    const s=JSON.parse(decodeURIComponent(clean(encoded)));
    if(s.version!==2 || s.ok!==true || s.date!==date || s.zone!==zone || !Array.isArray(s.rows))return null;
    return s;
  }catch(_){return null;}
}
function allDayText(row) {
  return /all[ -]?day|יום שלם|כל היום/i.test(row.start+' '+row.end);
}
function confirmedFlight(row,rawRow,date,zone,profiles) {
  try {
    const parts=(iso,timeZone=zone)=>{
      const list=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso));
      const p={};list.forEach(v=>p[v.type]=v.value);
      return {date:p.year+'-'+p.month+'-'+p.day,time:Number(p.hour)%24*60+Number(p.minute)};
    };
    const e=row.flightEvidence;
    if(e?.version===1){
      const instant=s=>typeof s==='string'&&/(?:Z|[+-]\d{2}:?\d{2})$/.test(s)&&Number.isFinite(Date.parse(s));
      if(!instant(e.start)||!instant(e.end)||Date.parse(e.end)<=Date.parse(e.start))return false;
      const a=parts(e.start),b=parts(e.end);
      if(a.date>date||b.date<date||a.time!==clock(rawRow.start)||b.time!==clock(rawRow.end))return false;
      const departure=e.departure?parts(e.start,e.departure.zone):null,arrival=e.arrival?parts(e.end,e.arrival.zone):null;
      const offset=departure&&arrival?Math.round((Date.parse(arrival.date+'T00:00:00Z')-Date.parse(departure.date+'T00:00:00Z'))/86400000):0;
      const endpoint=(value,time,label,zone,computed,unknown)=>value?
        typeof value.label==='string'&&value.label.length>0&&value.label.length<=12&&value.zone===zone&&computed.time===clock(time)&&label===value.label:
        time==='—'&&label===unknown&&zone==='';
      const suffix=offset?' '+(offset>0?'+':'')+offset+'d':'';
      return (e.status===(departure&&arrival?'resolved':'route-incomplete'))
        && endpoint(e.departure,row.start,row.startLabel,row.departureZone,departure,'DEPART')
        && (!suffix||row.endLabel.endsWith(suffix))
        && endpoint(e.arrival,row.end,suffix?row.endLabel.slice(0,-suffix.length):row.endLabel,row.arrivalZone,arrival,'ARRIVE');
    }
    return (profiles||[]).some(p=>{
      if(normalized(p.title)!==normalized(row.title))return false;
      const a=parts(p.start),b=parts(p.end),departure=parts(p.start,p.departure.zone),arrival=parts(p.end,p.arrival.zone);
      const offset=Math.round((Date.parse(arrival.date+'T00:00:00Z')-Date.parse(departure.date+'T00:00:00Z'))/86400000);
      const arrivalLabel=p.arrival.airport+(offset?' '+(offset>0?'+':'')+offset+'d':'');
      return a.date<=date && b.date>=date && a.time===clock(rawRow.start) && b.time===clock(rawRow.end)
        && p.departure.zone===row.departureZone && p.arrival.zone===row.arrivalZone
        && departure.time===clock(row.start) && arrival.time===clock(row.end)
        && row.startLabel===p.departure.airport && row.endLabel===arrivalLabel;
    });
  }catch(_){return false;}
}
function matchRow(native,raw,presented,profiles) {
  if(!raw || !presented || raw.date!==presented.date || raw.generatedAt!==presented.generatedAt &&
     Math.abs(Date.parse(raw.generatedAt)-Date.parse(presented.generatedAt))>120000)return null;
  const title=normalized(native.title),loc=normalized(native.location);
  if(!title)return null;
  const indices=[];
  raw.rows.forEach((r,i)=>{
    if(normalized(r.title)!==title || normalized(r.location)!==loc)return;
    if(Number(r.allDay)===1){
      if(allDayText(native) || (clock(native.start)===0&&clock(native.end)===0) || (!normalized(native.start)&&!normalized(native.end)))indices.push(i);
    }else if(clock(native.start)!==null && clock(native.start)===clock(r.start) && clock(native.end)===clock(r.end))indices.push(i);
  });
  if(indices.length!==1)return null;
  const index=indices[0],r=raw.rows[index],p=presented.rows[index];
  // Two cached responses can be from different refreshes: never join by index
  // unless the original event identity is still the same in both responses.
  if(!p || normalized(p.title)!==normalized(r.title) || normalized(p.location)!==normalized(r.location) || Number(p.allDay)!==Number(r.allDay))return null;
  if(!p.flight && (clock(p.start)!==clock(r.start) || clock(p.end)!==clock(r.end)) && !r.allDay)return null;
  if(p.flight && !confirmedFlight(p,r,raw.date,raw.zone,profiles))return null;
  return p;
}
function titleLayout(title) {
  const t=clean(title);
  return /[\u0590-\u05ff]/.test(t)?(Array.from(t).length>18||/[\r\n]/.test(t)?2:1):0;
}
function detailIcon(location) {
  const s=normalized(location);
  if(!s)return -1;
  if(/zoom|teams|skype|meet\.google|Google Meet/i.test(s))return 0;
  if(/conference|room|חדר/i.test(s))return 1;
  if(/tel:|phone|טלפון/i.test(s))return 2;
  if(/notes|updates/i.test(s))return 3;
  return 4;
}
function rowField(native,raw,presented,key,profiles,matched) {
  const row=matched===undefined?matchRow(native,raw,presented,profiles):matched;
  const flight=row&&Number(row.flight)===1;
  const title=clean(native.title);
  const suffix=flight?title.match(/\s*\(([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)\)\s*$/):null;
  const prefix=flight&&!suffix?title.match(/^([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?)\s+[:·-]?\s*/):null;
  switch(key){
    case 'color':return row&&Number.isInteger(row.color)&&row.color>=0&&row.color<=3?row.color:-1;
    case 'all_day':return row?Number(row.allDay)===1?1:0:allDayText(native)?1:0;
    case 'title_layout':return titleLayout(title);
    case 'detail_icon':return detailIcon(native.location);
    case 'flight':return flight?1:0;
    case 'start_label':return flight?row.startLabel:'START';
    case 'end_label':return flight?row.endLabel:'END';
    case 'flight_title':return flight?(suffix?title.slice(0,suffix.index).trim():prefix?title.slice(prefix[0].length).trim():title):'';
    case 'flight_number':return suffix?suffix[1]:prefix?prefix[1]:'';
    case 'flight_start':return flight?row.start:'';
    case 'flight_end':return flight?row.end:'';
    default:return '';
  }
}
function homeTitle(rows,count,raw,presented,nowMinutes,profiles) {
  const n=nativeCount(count);
  if(n<0)return 'Calendar unavailable';
  if(n===0)return 'No events today';
  const available=rows.slice(0,Math.min(n,4)).filter(r=>normalized(r.title));
  // Preserve the existing full-day next/active selection beyond four visible
  // rows. A matching native title is used whenever it is in the native window.
  // Home selection is optional server enrichment, never a gate on TODAY.
  if(raw && presented && raw.total===n && raw.home && available.length===Math.min(n,4) && available.every(r=>matchRow(r,raw,presented,profiles))){
    const h=raw.home;
    const matches=available.filter(r=>normalized(r.title)===normalized(h.title));
    if(h.compact===1){
      const time=String(h.time||'').split(/[–—]/)[0].trim();
      if(matches.length===1){
        const p=matchRow(matches[0],raw,presented,profiles);
        return (p&&p.flight?p.start:clean(matches[0].start))+' · '+clean(matches[0].title);
      }
      const candidates=raw.rows.filter(r=>normalized(r.title)===normalized(h.title)&&clock(r.start)===clock(time));
      const enriched=candidates.length===1?matchRow(candidates[0],raw,presented,profiles):null;
      const homeTime=enriched&&enriched.flight?enriched.start:time;
      return (homeTime?homeTime+' · ':'')+clean(h.title);
    }
    if(/ALL DAY/.test(h.label||''))return 'All day · '+(matches.length===1?clean(matches[0].title):clean(h.title));
    return clean(h.title);
  }
  // Native-only fallback. Do not claim that the day is finished when later
  // events may exist outside the four visible native rows.
  const timed=available.filter(r=>!allDayText(r)&&clock(r.start)!==null&&clock(r.end)!==null)
    .filter(r=>clock(r.end)>nowMinutes || clock(r.start)>nowMinutes || clock(r.end)<clock(r.start))
    .sort((a,b)=>clock(a.start)-clock(b.start));
  if(timed.length)return clean(timed[0].start)+' · '+clean(timed[0].title);
  const allDay=available.find(allDayText);
  if(allDay)return 'All day · '+clean(allDay.title);
  if(n<=4 && available.length===n && available.every(r=>clock(r.start)!==null&&clock(r.end)!==null))return 'No more events today';
  return available.length?clean(available[0].title):countLabel(count);
}
// One computation for the entire native agenda. Field variables only select
// a scalar from this URI-encoded result; they never parse server snapshots,
// match events, normalize clocks or calculate flight time zones again.
function nativeBundle(encoded,date,zone,rows,count,nowMinutes,profiles) {
  let raw=null,presented=null;
  try {
    const pair=JSON.parse(decodeURIComponent(clean(encoded)));
    const valid=s=>s&&s.version===2&&s.ok===true&&s.date===date&&s.zone===zone&&Array.isArray(s.rows);
    if(pair.version===1&&valid(pair.raw)&&valid(pair.presented)){
      raw=pair.raw;presented=pair.presented;
    }
  } catch(_){}
  const fields=['color','all_day','title_layout','detail_icon','flight','start_label','end_label','flight_title','flight_number','flight_start','flight_end'];
  const values=rows.map(native=>{
    const matched=matchRow(native,raw,presented,profiles),result={};
    fields.forEach(key=>result[key]=rowField(native,raw,presented,key,profiles,matched));
    return result;
  });
  return encodeURIComponent(JSON.stringify({rows:values,home:homeTitle(rows,count,raw,presented,nowMinutes,profiles)}));
}
if(typeof module!=='undefined')module.exports={nativeBundle,clean,clock,nativeCount,countLabel,nativeStatus,snapshot,matchRow,rowField,titleLayout,detailIcon,homeTitle};
