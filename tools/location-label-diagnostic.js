import {withLocationLabelUngated} from './location-label-ungated.js';
export function locationLabelDiagnostic(url) {
 var value=String(url);
 function field(name) {
  var parts=value.split(new RegExp('[?&]'+name+'='));
  if(parts.length!==2)return '';
  try{return decodeURIComponent(parts[1].split(/[&#]/)[0]);}catch(_){return '';}
 }
 if(value.indexOf('?')<0)return 'Map pending';
 var city=field('city'),country=field('country_name'),time=Number(field('city_cache_time'));
 if(!city)return 'City pending';
 if(!country)return 'Country pending';
 if(!time)return 'Timestamp missing';
 var age=Date.now()-time;
 if(age<0)return 'Clock mismatch';
 if(age>=3600000)return 'Location expired';
 city=Array.from(city.replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,80).join('');
 country=Array.from(country.replace(/[\u0000-\u001f\u007f]/g,'').trim()).slice(0,100).join('');
 if(/^Ashqelon$/i.test(city))city='Ashkelon';
 return city&&country?city+', '+country:'Empty label';
}
export function withLocationLabelDiagnostic(input){
 const w=withLocationLabelUngated(input);
 const v=w['36'].find(v=>v['1']==='calendar_location_pair');
 v['3']['66'][0]['10']=locationLabelDiagnostic.toString()+'\nfunction main(){return locationLabelDiagnostic("${widgy.map_request}");}';
 for(const [gid,id]of [[247,83204],[246,84013]])w['1'].find(n=>n.d0===gid)['1'].find(n=>n.d0===id)['66'][0]['25']='LOC | ${widgy.calendar_location_pair}';
 return w;
}
