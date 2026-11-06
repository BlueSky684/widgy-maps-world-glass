// Home's native text and approved conditional icons share the panel's model.
// These compatibility labels select existing artwork; the visible description
// is the exact same label used by Weather, not the compatibility label.
const iconStatus={sun:'Clear',moon:'Clear Night',partly:'Partly Cloudy',night_cloud:'Partly Cloudy Night',cloud:'Cloudy',light_rain:'Rain',heavy_rain:'Heavy Rain',snow:'Snow',storm:'Thunderstorm',fog:'Fog',wind:'Windy'};
// Explicit opt-in projection for the seven weather bindings in the full Home
// tab. AQI remains part of the default JSON and Weather image contracts.
export const HOME_WEATHER_FIELDS=Object.freeze(['temperature','high','low','status','icon_status','sunrise','sunset']);
export function homeWidgyData(data,{state='unavailable'}={}){
  const full=widgyData(data,{state});
  return Object.fromEntries(['source','state','at','timezone',...HOME_WEATHER_FIELDS].map(key=>[key,full[key]]));
}
export function widgyData(data,{aqi=null,state='unavailable'}={}){
  const c=data?.current,d=data?.days?.[0];
  const degrees=v=>Number.isFinite(v)?`${Math.round(v)}°C`:'—';
  return {
    source:'Open-Meteo',state,at:data?.at??null,timezone:data?.zone??null,
    temperature:degrees(c?.temperature),high:degrees(d?.high),low:degrees(d?.low),
    status:c?.label??'—',icon:c?.icon??null,icon_status:iconStatus[c?.icon]??'—',
    wind_speed:Number.isFinite(c?.wind)?c.wind:null,
    sunrise:d?.sunrise??'—',sunset:d?.sunset??'—',
    aqi:Number.isFinite(aqi?.value)?aqi.value:null,aqi_state:aqi?.state??'unavailable',aqi_at:aqi?.at??null,
    current:c??null,hours:data?.hours??[],days:data?.days??[]
  };
}
