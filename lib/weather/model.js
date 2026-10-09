// Open-Meteo /v1/forecast, SI display units. Unknown values remain unknown.
// Contract: https://open-meteo.com/en/docs (reviewed 2026-10-09).
export function coordinate(value, limit) {
  const s=String(value ?? '').trim().replace(/\u2212/g,'-').replace(',','.');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;
  const n=Number(s);return Number.isFinite(n)&&Math.abs(n)<=limit?n:null;
}
export const number = v => typeof v==='number' && Number.isFinite(v) ? v : null;
const bounded=(v,min,max)=>number(v)!==null && v>=min && v<=max?v:null;
const temperature=v=>bounded(v,-100,70);
export function condition(code,day=1,wind=null){
  code=number(code);
  if(code===null)return {icon:null,label:'—'};
  if([95,96,97,99].includes(code))return {icon:'storm',label:'Thunderstorm'};
  if([71,73,75,77,85,86].includes(code))return {icon:'snow',label:'Snow'};
  if([65,67,82].includes(code))return {icon:'heavy_rain',label:'Heavy Rain'};
  if([51,53,55,56,57,61,63,66,80,81].includes(code))return {icon:'light_rain',label:'Rain'};
  if([45,48].includes(code))return {icon:'fog',label:'Fog'};
  if(code>=0&&code<=3&&number(wind)!==null&&wind>=40)return {icon:'wind',label:'Windy'};
  if(code===3)return {icon:'cloud',label:'Cloudy'};
  if(code===2)return {icon:day===0?'night_cloud':'partly',label:'Partly Cloudy'};
  if(code===0||code===1)return {icon:day===0?'moon':'sun',label:day===0?'Clear Night':code===0?'Sunny':'Mostly Sunny'};
  return {icon:null,label:'—'};
}
export function windDirection(v){
  v=bounded(v,0,360);return v===null?'—':['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(v/22.5)%16];
}
export function uvLevel(v){
  v=bounded(v,0,30);return v===null?'—':v<3?'Low':v<6?'Moderate':v<8?'High':v<11?'Very High':'Extreme';
}
function dateKey(epoch,zone){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(epoch*1000));}
export function normalizeForecast(raw,now=Date.now()){
  if(!raw || typeof raw.timezone!=='string' || !raw.current || !Array.isArray(raw.hourly?.time) || !Array.isArray(raw.daily?.time))throw Error('weather_schema');
  // Throws for an invalid time zone; never silently convert to the server zone.
  const zone=raw.timezone,today=dateKey(now/1000,zone),h=raw.hourly,d=raw.daily,c=raw.current;
  if(number(c.time)===null || Math.abs(c.time*1000-now)>3*3600000)throw Error('weather_age');
  if(!h.time.length||h.time.length>400||d.time.length>16)throw Error('weather_length');
  for(const group of [h,d])for(let i=0;i<group.time.length;i++)if(number(group.time[i])===null || (i&&group.time[i]<=group.time[i-1]))throw Error('weather_time');
  const array=(group,key,i)=>Array.isArray(group[key])?group[key][i]:null;
  const hourFormat=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  // Show the current model hour followed by five real chronological hours,
  // including duplicated/skipped local wall-clock hours at DST transitions.
  let start=h.time.findIndex(t=>t*1000>now)-1;
  if(start===-2)start=h.time.length-1;
  if(start<0)throw Error('weather_hours');
  const hours=h.time.slice(start,start+6).map((time,k)=>{
    const i=start+k;
    const wx=condition(array(h,'weather_code',i),array(h,'is_day',i),array(h,'wind_speed_10m',i));
    return {time,label:hourFormat.format(new Date(time*1000)),temperature:temperature(array(h,'temperature_2m',i)),rain:bounded(array(h,'precipitation_probability',i),0,100),icon:wx.icon,weatherLabel:wx.label};
  });
  const offset=number(raw.utc_offset_seconds)??0;
  // Daily aggregations use the API's fixed response offset, not future DST.
  const dailyDate=t=>new Date((t+offset)*1000).toISOString().slice(0,10);
  const days=d.time.map((time,i)=>{
    const date=dailyDate(time),low=temperature(array(d,'temperature_2m_min',i)),high=temperature(array(d,'temperature_2m_max',i));
    const wx=condition(array(d,'weather_code',i));
    return {date,label:date===today?'TODAY':new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')).toUpperCase(),low:low!==null&&high!==null&&low>high?null:low,high:low!==null&&high!==null&&low>high?null:high,rain:bounded(array(d,'precipitation_probability_max',i),0,100),icon:wx.icon,weatherLabel:wx.label};
  }).filter(v=>v.date>=today).slice(0,5);
  if(hours.length!==6||days.length!==5||days[0].date!==today)throw Error('weather_coverage');
  return {zone,at:c.time*1000,hours,days,current:{temperature:temperature(c.temperature_2m),feels:temperature(c.apparent_temperature),humidity:bounded(c.relative_humidity_2m,0,100),wind:bounded(c.wind_speed_10m,0,400),direction:windDirection(c.wind_direction_10m),uv:bounded(c.uv_index,0,30),...condition(c.weather_code,c.is_day,c.wind_speed_10m)}};
}
export function providerURL(lat,lon){
  const q=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,uv_index',hourly:'temperature_2m,precipitation_probability,weather_code,is_day,wind_speed_10m',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',timezone:'auto',forecast_days:'6',timeformat:'unixtime',temperature_unit:'celsius',wind_speed_unit:'kmh'});
  return 'https://api.open-meteo.com/v1/forecast?'+q;
}
