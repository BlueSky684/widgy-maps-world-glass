import airports from './airport-data.js';
import {sourceZone} from './source-timezones.js';

const norm=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const byCode=new Map(),byPlace=new Map();
function add(key,airport){if(!key)return;const rows=byPlace.get(key)||[];rows.push(airport);byPlace.set(key,rows);}
let indexed=false;
function indexAirports(){
if(indexed)return;indexed=true;
const checked=new Map();
const countries=new Intl.DisplayNames(['en'],{type:'region'});
for(const [code,zone,city,country,name,commercial] of airports){
  if(!checked.has(zone))checked.set(zone,Boolean(sourceZone(zone)));
  if(!checked.get(zone))continue;
  const airport={code,zone,city,country};
  const codes=byCode.get(code)||[];codes.push(airport);byCode.set(code,codes);
  add(norm(name),airport);
  if(commercial){
    add(norm(city),airport);add(norm(city+' '+country),airport);
    add(norm(city+' '+countries.of(country)),airport);
  }
}
// Alternate city spellings, independent of flight number, date or user.
for(const [alias,city] of [['tel aviv yafo','tel aviv'],['תל אביב','tel aviv'],['אבו דאבי','abu dhabi'],['bengaluru','bangalore']])
  if(byPlace.has(city)&&!byPlace.has(alias))byPlace.set(alias,byPlace.get(city));

}
export function airportPlace(value){
  indexAirports();
  const text=String(value||'').trim();if(!text)return null;
  const exact=byCode.get(text.toUpperCase());
  const tokens=[...new Set(text.match(/\b[A-Z]{3}\b/g)||[])].filter(code=>byCode.has(code));
  // A list of several airport codes is not one endpoint.
  if(tokens.length>1)return null;
  const rows=exact || (tokens.length===1?byCode.get(tokens[0]):byPlace.get(norm(text)));
  if(!rows?.length || new Set(rows.map(r=>r.zone)).size!==1)return null;
  const codes=[...new Set(rows.map(r=>r.code))];
  return {zone:rows[0].zone,airport:codes.length===1?codes[0]:'',
    label:codes.length===1?codes[0]:rows[0].city.slice(0,12),
    basis:exact||tokens.length?'airport-code':codes.length===1?'airport-place':'city-zone'};
}

// Recognize conventional itinerary titles, not "flight planning meeting" or
// every fromGmail event. Airport zones never come from the device or calendar.
export function automaticFlight(event){
  if(!event || event.allDay)return null;
  let title=String(event.title||'').trim().replace(/^[✈️\s]+/u,'');
  title=title.replace(/\s*\([A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?\)\s*$/,'').trim();
  const fromTo=title.match(/^Flight\s+from\s+(.+?)\s+to\s+(.+)$/i) || title.match(/^טיסה\s+מ[־-]?\s*(.+?)\s+ל[־-]?\s*(.+)$/);
  const to=title.match(/^(?:Flight\s+to\s+|טיסה\s+ל[־-]?\s*)(.+)$/i);
  const route=title.replace(/^(?:Flight|טיסה)\s*:?\s*/i,'').replace(/^[A-Z0-9]{2,3}\s?\d{1,4}[A-Z]?\s*[:·-]?\s*/,'')
    .match(/^([A-Z]{3})\s*(?:→|➜|->|[-–—]|\bto\b)\s*([A-Z]{3})$/);
  const cityRoute=title.match(/^(?:Flight|טיסה)\s+(.+?)\s*(?:→|➜|->)\s*(.+)$/i);
  if(!route && !fromTo && !cityRoute && !to)return null;
  const departure=airportPlace(route?.[1] || fromTo?.[1] || cityRoute?.[1] || event.location);
  const arrival=airportPlace(route?.[2] || fromTo?.[2] || cityRoute?.[2] || to?.[1]);
  return {departure,arrival};
}
