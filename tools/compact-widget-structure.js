// Transforms a private full-widget copy locally. No calendar URLs or credentials
// are stored here. Uses existing native JSON/text/shape formats only.
const clone = x => structuredClone(x);
export const flatten = ns => ns.flatMap(n => [n, ...(n.z === '13' ? flatten(n['1']) : [])]);
const fail = message => { throw Error(message); };
const ensure = (test, message) => { if (!test) fail(message); };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const value = (n,k) => {
  const s=n[k];
  ensure(s?.a?.length===1 && typeof s.a[0].a==='number' && s.b===0, 'Expected constant frame');
  return s.a[0].a;
};
const set = (n,k,v) => { n[k]=clone(n[k]); n[k].a[0].a=v; };
const strings = x => typeof x==='string' ? [x] : x && typeof x==='object' ? Object.values(x).flatMap(strings) : [];
export function variableReferences(object, variables) {
  const ss=strings(object), byName=new Map(variables.map(v=>[v['1'],v]));
  const found=new Set();
  for(const s of ss) {
    for(const m of s.matchAll(/\$\{widgy\.([^}]+)\}/g)) if(byName.has(m[1]))found.add(m[1]);
    for(const v of variables)if(s.toLowerCase().includes(v['0'].toLowerCase()))found.add(v['1']);
  }
  return found;
}
function pruneUnused(w) {
  const vs=w['36'], root=clone(w); delete root['36'];
  const live=variableReferences(root,vs);
  let changed=true;
  while(changed){changed=false;for(const v of vs)if(live.has(v['1']))
    for(const name of variableReferences(v['3'],vs))if(!live.has(name)){live.add(name);changed=true;}}
  const removed=vs.filter(v=>!live.has(v['1'])).map(v=>v['1']);
  w['36']=vs.filter(v=>live.has(v['1']));return removed;
}
function shareDotsClock(w) {
  const dots=w['36'].filter(v=>/^calendar_dots_url_(m|p)\d+$/.test(v['1']));
  ensure(dots.length===25,'Expected 25 month dot variables');
  const nodes=flatten(w['1']), changes=[];
  const tick=clone(dots[0]); tick['1']='calendar_refresh_minute';
  tick['3'].s='Variable: calendar_refresh_minute';
  tick['3']['66']=[{'5':'Javascript','6':'Script','10':'function main(){return String(Math.floor(Date.now()/60000));}'}];
  for(const v of dots){
    ensure(v['2']===0 && v['3']['66'].length===1,'Unexpected dot variable');
    const src=v['3']['66'][0];
    const prefix='function main(){return ', suffix=' + "&refresh=" + Math.floor(Date.now()/60000);}';
    ensure(src['5']==='Javascript' && src['6']==='Script' && src['10'].startsWith(prefix) && src['10'].endsWith(suffix),'Unexpected dot script');
    const url=JSON.parse(src['10'].slice(prefix.length,-suffix.length));
    ensure(typeof url==='string' && url.startsWith('https://') && !url.includes('${'),'Unexpected dot URL');
    const refs=nodes.filter(n=>variableReferences(Object.fromEntries(Object.entries(n).filter(([k])=>n.z!=='13'||k!=='1')),[v]).size);
    ensure(refs.length===1,'Dot variable has unexpected consumers');
    const n=refs[0];
    ensure(n.z==='5' && n['1']==='Web URL' && n['2']==='${widgy.'+v['1']+'}' && n['3']===true,'Unexpected dot binding');
    changes.push({layer:n.d0,originalVariable:v['1']});
    n['2']=url+'&refresh=${widgy.calendar_refresh_minute}';
  }
  const names=new Set(dots.map(v=>v['1']));
  const at=w['36'].indexOf(dots[0]);
  w['36']=w['36'].filter(v=>!names.has(v['1']));w['36'].splice(at,0,tick);
  return changes;
}
function inlineSingleTextSources(w){
  const changed=[];
  // Only unformatted String variables with a single text consumer, no native
  // visibility/UUID consumers, and no other variable consumers are eligible.
  for(const v of [...w['36']]){
    if(v['2']!==0 || !/^(calendar_|steps_label$)/.test(v['1']))continue;
    const allowed=new Set(['z','s','d','e','66']);
    if(Object.keys(v['3']).some(k=>!allowed.has(k)) || v['3']['66']?.length!==1)continue;
    const source=v['3']['66'][0];
    if(!(['JSON Endpoint','Javascript'].includes(source['5'])))continue;
    if(source['5']==='Javascript' && v['1']!=='steps_label')continue;
    const without=clone(w);without['36']=without['36'].filter(x=>x['1']!==v['1']);
    const ss=strings(without),ref='${widgy.'+v['1']+'}';
    if(ss.some(s=>s.toLowerCase().includes(v['0'].toLowerCase())))continue;
    const occurrences=ss.reduce((sum,s)=>sum+s.split(ref).length-1,0);
    if(occurrences!==1)continue;
    const consumers=flatten(w['1']).filter(n=>n.z==='1' && n['66']?.some(s=>s['5']==='Custom Text' && s['6']==='Text' && s['25']===ref));
    if(consumers.length!==1)continue;
    const n=consumers[0],index=n['66'].findIndex(s=>s['25']===ref);
    // A bare native text reference only. Do not discard per-source formatting.
    if(Object.keys(n['66'][index]).sort().join(',')!=='25,5,6')continue;
    n['66'][index]=clone(source);
    w['36']=w['36'].filter(x=>x['1']!==v['1']);
    changed.push({name:v['1'],layer:n.d0,index});
  }
  return changed;
}
export function combineSeparators(layout){
  const old=layout['1'].filter(n=>/^Calendar · Week Separator [1-5]$/.test(n.s||''));
  const weeks=Number(layout.s.match(/([456]) Week Layout/)?.[1]);
  ensure(old.length===weeks-1,'Unexpected separator count');
  const first=layout['1'].indexOf(old[0]);
  ensure(old.every((n,i)=>layout['1'][first+i]===n),'Separator order changed');
  const x=value(old[0],'b'),width=value(old[0],'d'),top=Math.min(...old.map(n=>value(n,'c')));
  const bottom=Math.max(...old.map(n=>value(n,'c')+value(n,'e'))),height=bottom-top;
  const props=new Set(['d0','z','s','b','c','d','e','g']);
  for(const n of old)ensure(n.z==='2' && Object.keys(n).every(k=>props.has(k)) &&
    n.g===old[0].g && value(n,'b')===x && value(n,'d')===width,'Separator effects or frame changed');
  // Each rectangle is a closed contour. Consecutive contours are connected
  // along the left edge in opposite directions: connector winding is zero.
  // No bitmap, new font or network image is involved.
  const points=[];
  for(const n of old){
    const y=(value(n,'c')-top)/height,b=(value(n,'c')+value(n,'e')-top)/height;
    points.push({x:0,y:0},{x:0,y},{x:1,y},{x:1,y:b},{x:0,y:b},{x:0,y},{x:0,y:0});
  }
  const n=clone(old[0]),id='CA1E0000-0000-4000-E010-'+String(n.d0).padStart(12,'0');
  const shape={items:[{id,name:`Calendar ${weeks} Week Separators`,shape:{rounding:0,points}}]};
  n.s=`Calendar · ${weeks} Week Separators`;n['2']=Buffer.from(JSON.stringify(shape)).toString('base64');n['3']=id;
  // The custom-shape selection parameter is copied from a real native shape.
  n['1']={a:[{a:75,b:843,c:0,d:843}],b:0};
  set(n,'c',top);set(n,'e',height);
  layout['1'].splice(first,old.length,n);
  return {group:layout.d0,kept:n.d0,removed:old.slice(1).map(n=>n.d0),rectangles:old.length};
}
export function compactWidgetStructure(original){
  ensure(original['3']==='Full Widget External Map Test 1' && flatten(original['1']).length===1514,'Unexpected baseline');
  const w=clone(original),before={layers:flatten(w['1']).length,variables:w['36'].length};
  const calendar=w['1'].find(n=>n.d0===247 && n.s==='CALENDAR');
  ensure(calendar,'Missing Calendar');
  const layouts=flatten(calendar['1']).filter(n=>/^Calendar · [456] Week Layout$/.test(n.s||''));
  ensure(layouts.length===75,'Expected all 25 month layouts');
  const separatorChanges=layouts.map(combineSeparators);
  const dots=shareDotsClock(w),inlined=inlineSingleTextSources(w),pruned=pruneUnused(w);
  w['3']='Widgy Compact Structure 1';
  w['4']='Full-widget structural optimization candidate. All 25 months and existing native Today badges retained. Vector week separators combined; one shared minute clock for calendar dots; single-use text sources bound directly; unused variables removed. External JSON map is the fixed test map without a personal marker. Check native rendering and navigation after import.';
  const report={before,after:{layers:flatten(w['1']).length,variables:w['36'].length},separatorChanges,dots,inlined,pruned};
  return {widget:w,report};
}
