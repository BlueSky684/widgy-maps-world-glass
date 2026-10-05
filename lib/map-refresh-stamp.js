// A visible timestamp for the map's own render instant, never a separate UI clock.
export const REFRESH_STAMP_RECT=Object.freeze({left:60,top:1340,width:3186,height:158});
const formatter=new Intl.DateTimeFormat('en-GB',{
  timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
});
export function mapRefreshStamp(date){
  if(!date || !Number.isFinite(date.getTime()))throw Error('invalid_map_date');
  const p=Object.fromEntries(formatter.formatToParts(date).map(x=>[x.type,x.value]));
  return 'MAP TIME '+p.year+'-'+p.month+'-'+p.day+' '+p.hour+':'+p.minute+':'+p.second+' ISRAEL';
}
