import {withMapFiveMinuteURL} from './map-five-minute-url.js?v=map-five-minute-url-1';

// Only the two exact effect objects captured from the native harmless probe.
const multiply={a:[{a:1,b:547,c:0,d:547}],b:0};
const plusLighter={a:[{a:17,b:548,c:0,d:548}],b:0};
export function withMapMaskCompare(original,origin){
  const widget=withMapFiveMinuteURL(original,origin);
  const home=widget['1'].find(n=>n.d0===245),calendar=widget['1'].find(n=>n.d0===247);
  const sample=home?.['1'].find(n=>n.d0===6170),title=calendar?.['1'].find(n=>n.d0===80334);
  const background=calendar?.['1'].find(n=>n.d0===5049);
  if(sample?.z!=='5'||sample['1']!=='Web URL'||title?.['66']?.[0]?.['25']!=='CALENDAR TEST'||
    background?.z!=='2'||home.a===false||calendar.a!==false)throw Error('unexpected_template');
  home.a=true;
  const image=(id,name,file)=>{
    const node=structuredClone(sample);node.d0=id;node.s=name;
    node['2']=origin+'/assets/diagnostics/map-mask-compare-1/'+file;
    return node;
  };
  const group=(id,name,file,maskFile,isNight)=>{
    const out=structuredClone(home);out.d0=id;out.s=name;out.a=true;
    const mask=image(id+1,name+' Mask',maskFile);mask.t=structuredClone(multiply);
    out['1']=[mask,image(id+2,name+' Static Map',file)];
    if(isNight)out.t=structuredClone(plusLighter);
    return out;
  };
  const day=group(84010,'Day','day.png','mask-day.png',false);
  const night=group(84020,'Night','night.png','mask-night.png',true);
  const reference=image(84030,'Approved Renderer · Fixed Reference','reference.png');
  const homeBackground=structuredClone(background);homeBackground.d0=84040;
  const homeTitle=structuredClone(title);homeTitle.d0=84050;
  homeTitle.s='Mask Comparison Title';homeTitle['66'][0]['25']='MASK · 06 OCT 07:30';
  title['66'][0]['25']='ORIGINAL · 06 OCT 07:30';
  const nav=nodes=>nodes.filter(n=>n!==sample&&n!==title&&n!==background);
  home['1']=[...nav(home['1']),homeTitle,night,day,homeBackground];
  calendar['1']=[...nav(calendar['1']),title,reference,background];
  for(const container of [home,calendar])for(const node of container['1']){
    if(node.z==='1')for(const data of node['66']||[]){
      if(data['5']==='Custom Text'&&data['25']==='HOME')data['25']='MASK';
      if(data['5']==='Custom Text'&&data['25']==='CALENDAR')data['25']='ORIGINAL';
    }
  }
  widget['36']=[];
  widget['3']='Widgy Map Mask Compare 1';
  widget['4']='Real-map native appearance comparison only, after the flat mask composition succeeded. MASK/Home: approved-size3306x1558 static day/night derivatives with522x246 complementary solar masks using captured Image Multiply=1 and Night Group Plus Lighter=17. ORIGINAL/Calendar: approved r6 renderer at the identical fixed2026-10-06T04:30Z instant. Map frame/provider/native navigation preserved, all GPS/script variables removed, no personal data or API/account requests. Both views have rectangular corners and omit marker/text overlays to isolate the map. Time is intentionally frozen. This is not a live-refresh/navigation performance result, exact pixel-parity claim or replacement for the working Five Minute1. Two separate mask sources remain; one-file extraction/atomic switching is not verified.';
  if(/\$\{widgy\.|token=|\/api\//.test(JSON.stringify(widget)))throw Error('unexpected_template');
  return widget;
}
