// Separate full-widget candidate. Runs in the owner's browser; no requests.
// Native image Javascript/key 22 comes from the user's native export recorded
// in the archived builder at ce97f6b (see repository-cleanup-20261009.md).
// This is synchronous URL construction, not fetching.
const flat=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const fail=()=>{throw Error('unexpected_template');};

export function directCalendarDots(original){
  if(original['3']!=='Widgy Consolidated Home Calendar 1')fail();
  const widget=structuredClone(original);
  const calendar=widget['1'].find(n=>n.s==='CALENDAR');
  if(!calendar)fail();
  const panes=calendar['1'].filter(n=>/^Calendar · Month Offset -?\d+$/.test(n.s||''));
  if(panes.length!==25)fail();
  const removed=new Set(),offsets=new Set();
  for(const pane of panes){
    const offset=Number(pane.s.split(' ').at(-1));
    if(offset < -12 || offset > 12 || offsets.has(offset))fail();
    offsets.add(offset);
    const name=`calendar_dots_url_${offset<0?'m':'p'}${Math.abs(offset)}`;
    const variables=widget['36'].filter(v=>v['1']===name);
    const images=pane['1'].filter(n=>n.s==='Calendar · Browser Event Dots');
    if(variables.length!==1 || images.length!==1)fail();
    const variable=variables[0],image=images[0],sources=variable['3']['66'];
    if(variable['2']!==0 || sources?.length!==1 ||
        sources[0]['5']!=='Javascript' || sources[0]['6']!=='Script' ||
        image.z!=='5' || image['1']!=='Web URL' ||
        image['2']!=='${widgy.'+name+'}' || image['22']!==undefined)fail();
    const code=sources[0]['10'];
    // Parse only the JSON literal in the exact existing generated script.
    // Never execute code from a personalized export in the copy page.
    const prefix='function main(){return ',suffix=' + "&refresh=" + Math.floor(Date.now()/60000);}';
    if(typeof code!=='string' || !code.startsWith(prefix) || !code.endsWith(suffix))fail();
    let literal;
    try{literal=JSON.parse(code.slice(prefix.length,-suffix.length));}catch{fail();}
    if(typeof literal!=='string' || JSON.stringify(literal)!==code.slice(prefix.length,-suffix.length))fail();
    const url=new URL(literal);
    if(url.protocol!=='https:' || url.pathname!=='/api/calendar-widget' ||
        !url.searchParams.get('token') || url.searchParams.get('offset')!==String(offset) ||
        url.searchParams.get('view')!=='dots' || url.searchParams.get('render')!=='refresh-1' ||
        url.searchParams.has('refresh') || url.hash)fail();
    image['1']='Javascript';
    image['2']=literal;
    image['22']=code; // Retain the exact script and the same minute buckets.
    removed.add(variable);
  }
  widget['36']=widget['36'].filter(v=>!removed.has(v));
  // Reject secondary consumers, conditional references or unexpected scripts.
  // The only removed edges must be these 25 image-to-URL-variable bindings.
  const remaining=JSON.stringify(widget).toLowerCase();
  for(const v of removed){
    if(remaining.includes(v['0'].toLowerCase()) ||
        remaining.includes(('${widgy.'+v['1']+'}').toLowerCase()))fail();
  }
  if(flat(widget['1']).filter(n=>n.s==='Calendar · Browser Event Dots').length!==25)fail();
  widget['3']='Widgy Calendar Direct Dots 1';
  widget['4']='Separate full-function candidate based on Consolidated Home Calendar 1. Moves the exact 25 synchronous minute-refresh URL scripts from global variables into the native Javascript image providers. 56 global variables; all 25 month panes, 1613 layers, navigation, event data, Home and approved artwork retained. Script outputs are verified offline, not native provider scheduling, image refresh or transition speed. Verify month dots and a minute refresh on the iPhone before adopting. Keep this private export private.';
  return widget;
}
