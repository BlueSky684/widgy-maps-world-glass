// Shared calculations only. Importing these helpers must not pull a historical
// image renderer or its assets into the current night-map function.
const RAD=Math.PI/180;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const norm=n=>((n+180)%360+360)%360-180;

export function solarElevation(latitude,longitude,sun) {
  return Math.asin(clamp(Math.sin(latitude*RAD)*Math.sin(sun.latitude*RAD)
    +Math.cos(latitude*RAD)*Math.cos(sun.latitude*RAD)*Math.cos((longitude-sun.longitude)*RAD),-1,1))/RAD;
}

// NOAA/Meeus solar longitude, obliquity, declination and equation of time.
// longitude is positive east; date is an absolute UTC instant.
export function solarPosition(date) {
  if(!Number.isFinite(date.getTime())) throw new TypeError('Invalid date');
  const t=(date.getTime()/86400000+2440587.5-2451545)/36525;
  const l0=((280.46646+t*(36000.76983+t*.0003032))%360+360)%360;
  const m=357.52911+t*(35999.05029-.0001537*t);
  const e=.016708634-t*(.000042037+.0000001267*t);
  const c=Math.sin(m*RAD)*(1.914602-t*(.004817+.000014*t))
    +Math.sin(2*m*RAD)*(.019993-.000101*t)+Math.sin(3*m*RAD)*.000289;
  const omega=125.04-1934.136*t;
  const lambda=l0+c-.00569-.00478*Math.sin(omega*RAD);
  const ob=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60)
    +.00256*Math.cos(omega*RAD);
  const dec=Math.asin(Math.sin(ob*RAD)*Math.sin(lambda*RAD))/RAD;
  const y=Math.tan(ob*RAD/2)**2;
  const eq=4/RAD*(y*Math.sin(2*l0*RAD)-2*e*Math.sin(m*RAD)
    +4*e*y*Math.sin(m*RAD)*Math.cos(2*l0*RAD)
    -.5*y*y*Math.sin(4*l0*RAD)-1.25*e*e*Math.sin(2*m*RAD));
  const minutes=date.getUTCHours()*60+date.getUTCMinutes()+date.getUTCSeconds()/60;
  return {latitude:dec,longitude:norm((720-minutes-eq)/4)};
}

function number(value) {
  if(typeof value!=='string'||!value.trim()) return NaN;
  return Number(value);
}
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80);
export function resolveLocation(url,headers={}) {
  const explicit=url.searchParams.has('lat')||url.searchParams.has('lon');
  const latitude=number(explicit?url.searchParams.get('lat'):headers['x-vercel-ip-latitude']);
  const longitude=number(explicit?url.searchParams.get('lon'):headers['x-vercel-ip-longitude']);
  if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180) return null;
  let city=explicit?url.searchParams.get('city'):headers['x-vercel-ip-city'];
  if(!explicit) {try{city=decodeURIComponent(city??'');}catch{city='';}}
  return {latitude,longitude,city:clean(city),source:explicit?'coordinates':'ip-approximate'};
}
