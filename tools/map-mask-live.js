import {withMapFiveMinuteURL} from './map-five-minute-url.js?v=map-five-minute-url-1';
import {withMapMaskCompare} from './map-mask-compare.js?v=map-mask-compare-1';

export function withMapMaskLive(original,origin){
  const widget=withMapMaskCompare(original,origin),control=withMapFiveMinuteURL(original,origin);
  const template=control['36'].find(v=>v['1']==='map_request');
  if(template?.['3']?.['66']?.[0]?.['5']!=='Javascript'||control['36'].length!==3)throw Error('unexpected_template');
  const ids=control['36'].map(v=>v['0']);
  const variable=(index,name,code)=>{
    const v=structuredClone(template);v['0']=ids[index];v['1']=name;v['3'].s='Variable: '+name;
    v['3']['66'][0]['10']=code;return v;
  };
  const request=part=>`function main() {
  var stamp = String("\${widgy.mask_epoch}").trim();
  var n = Number(stamp);
  if (!/^\\d{13}$/.test(stamp) || !isFinite(n) || n % 300000 !== 0 || n < 1577836800000 || n >= 4102444800000) return '';
  return ${JSON.stringify(origin+'/api/solar-mask?rev=live-1&part='+part+'&t=')} + stamp;
}`;
  widget['36']=[
    variable(0,'mask_epoch','function main() { return String(Math.floor(Date.now() / 300000) * 300000); }'),
    variable(1,'mask_day_request',request('day')),
    variable(2,'mask_night_request',request('night'))
  ];
  const [home,calendar]=widget['1'];
  const day=home['1'].find(n=>n.d0===84010),night=home['1'].find(n=>n.d0===84020);
  if(!day||!night||calendar['1'].filter(n=>n.d0===84030).length!==1)throw Error('unexpected_template');
  for(const [part,group] of [['day',day],['night',night]]){
    group['1'][0]['2']='${widgy.mask_'+part+'_request}';
    group['1'][0].s='Live '+part+' Mask · Bitmap Time';
    group['1'][1]['2']=origin+'/assets/diagnostics/map-mask-live-1/'+part+'.png';
  }
  home['1'].find(n=>n.d0===84050)['66'][0]['25']='LIVE MASK';
  calendar['1']=calendar['1'].filter(n=>n.d0!==84030);
  calendar['1'].find(n=>n.d0===80334)['66'][0]['25']='CALENDAR TEST';
  for(const group of [home,calendar])for(const node of group['1']){
    if(node.z!=='1')continue;
    for(const data of node['66']||[]){
      if(data['25']==='MASK')data['25']='HOME';
      if(data['25']==='ORIGINAL')data['25']='CALENDAR';
    }
  }
  widget['3']='Widgy Map Mask Live 1';
  widget['4']='Live small-mask diagnostic after native Map Mask Compare1 displayed both maps and the original temporarily disappeared then recovered. Static3306x1558 day/night maps; only522x246 day/night masks have time-varying URLs. A shared synchronous mask_epoch variable selects a five-minute UTC bucket WHEN evaluated. Two single-binding Web URL variables reference that epoch. This is not a timer, guaranteed automatic refresh, idle detection, atomic two-image update or speed guarantee. The public solar-only endpoint uses the requested epoch, no GPS/IP/terrain/geocoder/account data. Actual mask PNGs carry D/N date/time in Asia/Jerusalem over a temporary bottom114-row diagnostic strip. Equal advancing stamps demonstrate loaded mask epochs; a separate clock is not used. Four cached Web URL images and three synchronous variables, existing Home/Calendar visibility buttons with no Reload action, blank static Calendar. No original reference image, GPS marker, city, weather, fitness or calendar account sources in this isolated copy. Approved masters unchanged; retain Five Minute1 and Compare1. Native freshness, paired loading, non-regression and first/subsequent Home returns remain unverified.';
  const serialized=JSON.stringify(widget);
  if(/\/api\/(?:night-map|calendar-)|token=|map_latitude|map_longitude|"Location"|reference\.png/.test(serialized))throw Error('unexpected_template');
  return widget;
}
