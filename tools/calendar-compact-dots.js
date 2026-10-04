import {DOT_FRAME} from '../lib/calendar-bridge/dots-frame.js?v=compact-dots-1';

const fail=()=>{throw Error('unexpected_template');};
const scalar=a=>({a:[{a,b:168,c:0,d:168}],b:0});

// Full-function Consolidated 1 candidate. Same working Web URL provider and
// global variables; only transparent image bounds and matching frames change.
export function compactCalendarDots(original){
  if(original['3']!=='Widgy Consolidated Home Calendar 1')fail();
  const widget=structuredClone(original),calendar=widget['1'].find(n=>n.s==='CALENDAR');
  if(!calendar)fail();
  const panes=calendar['1'].filter(n=>/^Calendar · Month Offset -?\d+$/.test(n.s||''));
  if(panes.length!==25)fail();
  const offsets=new Set();
  for(const pane of panes){
    const offset=Number(pane.s.split(' ').at(-1));
    if(offset < -12 || offset > 12 || offsets.has(offset))fail();
    offsets.add(offset);
    const name=`calendar_dots_url_${offset<0?'m':'p'}${Math.abs(offset)}`;
    const variables=widget['36'].filter(v=>v['1']===name);
    const images=pane['1'].filter(n=>n.s==='Calendar · Browser Event Dots');
    if(variables.length!==1 || images.length!==1)fail();
    const sources=variables[0]['3']['66'],image=images[0];
    if(sources?.length!==1 || sources[0]['5']!=='Javascript' || sources[0]['6']!=='Script' ||
        image.z!=='5' || image['1']!=='Web URL' || image['2']!=='${widgy.'+name+'}' || image['3']!==true)fail();
    for(const [k,value] of Object.entries({b:0,c:0,d:1600,e:1600}))
      if(JSON.stringify(image[k])!==JSON.stringify(scalar(value)))fail();
    const code=sources[0]['10'];
    const prefix='function main(){return ',suffix=' + "&refresh=" + Math.floor(Date.now()/60000);}';
    if(typeof code!=='string' || !code.startsWith(prefix) || !code.endsWith(suffix))fail();
    let literal;
    try{literal=JSON.parse(code.slice(prefix.length,-suffix.length));}catch{fail();}
    if(typeof literal!=='string' || JSON.stringify(literal)!==code.slice(prefix.length,-suffix.length))fail();
    const url=new URL(literal);
    if(url.protocol!=='https:' || url.pathname!=='/api/calendar-widget' || !url.searchParams.get('token') ||
        url.searchParams.get('offset')!==String(offset) || url.searchParams.get('view')!=='dots' ||
        url.searchParams.get('render')!=='refresh-1' || url.searchParams.has('bounds') ||
        url.searchParams.has('refresh') || url.hash)fail();
    // Appending preserves the original private URL's bytes and minute bucket.
    sources[0]['10']=prefix+JSON.stringify(literal+'&bounds=grid')+suffix;
    image.b=scalar(DOT_FRAME.left/DOT_FRAME.canvasWidth*1600);
    image.c=scalar(DOT_FRAME.top/DOT_FRAME.canvasHeight*1600);
    image.d=scalar(DOT_FRAME.width/DOT_FRAME.canvasWidth*1600);
    image.e=scalar(DOT_FRAME.height/DOT_FRAME.canvasHeight*1600);
  }
  widget['3']='Widgy Compact Dots 1';
  widget['4']='Full Consolidated Home Calendar 1 with transparent margins removed only from calendar-dot PNGs. Dot pixels and source resolution retained exactly; native image frames place the crop back in the same design position. Original Web URL provider, 81 variables, 25 months, 1613 layers, Home map/city, clock and navigation retained. 2270x2368 to 1108x1120 per dot image; reduced pixel count is not measured phone latency or actual Widgy memory. Verify dot alignment on the phone. Keep this private export private.';
  return widget;
}
