// Reproducible inventory: synthetic export, local files only. No owner session,
// live calendar, location service or network timing is involved.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const template=JSON.parse(fs.readFileSync(path.join(root,'tools/Widgy_Home_Glass_Calendar_C16.json')));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const candidate=consolidateWidget(normal);
const flat=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?flat(n['1']):[])]);
const histogram=items=>items.reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{});
const refs=value=>{
  const text=JSON.stringify(value);
  return normal['36'].filter(v=>text.includes('${widgy.'+v['1']+'}') ||
    text.toLowerCase().includes(v['0'].toLowerCase())).map(v=>v['1']);
};
const dependencies=Object.fromEntries(normal['36'].map(v=>[v['1'],refs(v['3'])]));
const closure=(names,result=new Set())=>{
  for(const name of names)if(!result.has(name)){result.add(name);closure(dependencies[name]||[],result);}
  return [...result].sort();
};
const cycles=[];
function checkCycle(name,stack=[]){
  if(stack.includes(name)){cycles.push([...stack,name]);return;}
  for(const next of dependencies[name])checkCycle(next,[...stack,name]);
}
for(const name of Object.keys(dependencies))checkCycle(name);
function staticImports(entry,seen=new Set()){
  if(seen.has(entry))return [...seen].sort();
  seen.add(entry);
  const text=fs.readFileSync(path.join(root,entry),'utf8');
  for(const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g)){
    if(!match[1].startsWith('.'))continue;
    const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(entry),match[1].split('?')[0]));
    staticImports(resolved,seen);
  }
  return [...seen].sort();
}
const stats=w=>w['1'].map(n=>{
  const nodes=flat(n['1']);
  return {tab:n.s,nodes:nodes.length,groups:nodes.filter(n=>n.z==='13').length,
    types:histogram(nodes.map(n=>n.z)),directVariables:refs(n),allVariables:closure(refs(n))};
});
const referenced=new Set([...refs(normal['1']),...Object.values(dependencies).flat()]);
const shapes=flat(normal['1']).filter(n=>n.z==='2' && typeof n['2']==='string');
const shapeLibraries=shapes.map(n=>({n,data:JSON.parse(Buffer.from(n['2'],'base64').toString())}));
const usedFields=normal['36'].flatMap(v=>v['3']['66']||[]).filter(s=>s['5']==='JSON Endpoint');
const calendar=normal['1'].find(n=>n.s==='CALENDAR');
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const earth=tracked.filter(f=>f.startsWith('assets/earth/'));
const report={
  version:'consolidated-1',date:'2026-10-04',branch:'f50-widget-test',
  baselineCommit:'a2136e2bff63e75b75cda8128a48ea6483d76b2c',
  scope:'Synthetic normal Unified export and local static source inspection. No native Widgy runtime or private user data.',
  normal:stats(normal),candidate:stats(candidate),
  totalNodes:{before:flat(normal['1']).length,after:flat(candidate['1']).length},
  jsonBytes:{before:Buffer.byteLength(JSON.stringify(normal)),after:Buffer.byteLength(JSON.stringify(candidate))},
  variables:{count:normal['36'].length,dependencies,cycles,
    unreferenced:normal['36'].filter(v=>!referenced.has(v['1'])).map(v=>v['1']),
    providers:histogram(normal['36'].flatMap(v=>v['3']['66'].map(s=>s['5'])))},
  shapeLibraries:{count:shapes.length,encodedBytes:shapes.reduce((n,s)=>n+s['2'].length,0),
    unusedItems:shapeLibraries.reduce((n,{n:shape,data})=>n+data.items.filter(i=>i.id!==shape['3']).length,0),
    missingSelectedItems:shapeLibraries.filter(({n,data})=>!data.items.some(i=>i.id===n['3'])).map(({n})=>n.d0)},
  calendar:{monthPanes:calendar['1'].filter(n=>/^Calendar · Month Offset /.test(n.s)).map(n=>({
      name:n.s,nodes:flat(n['1']).length})),
    nativeMonthLayers:flat(calendar['1']).filter(n=>n.z==='10').length,
    todayPositions:flat(calendar['1']).filter(n=>/^Calendar · Today Cell /.test(n.s)).length,
    nativeJSONBindings:usedFields.length,literalJSONEndpoints:new Set(usedFields.map(s=>s['18'])).size,
    monthImageSources:normal['36'].filter(v=>/^calendar_dots_url_/.test(v['1'])).length,
    server:'One per-token/month pending provider read is shared per function instance for up to 60 seconds. Private device responses expire at event transitions or provider refresh, capped at 30 seconds. This does not prove Widgy coalesces 39 native field requests or skips hidden months.',
    retained:'25 navigable months, 4/5/6-week layouts, 95 current-day positions, all-day/timed rows, Hebrew/Latin layout, details, source colors, unavailable state, refresh URLs and tap actions.'},
  activeImports:{normalExport:staticImports('tools/calendar-widget-export.js'),
    consolidatedPage:staticImports('tools/widgy-consolidated.js'),
    nightMap:staticImports('api/night-map.js'),calendarWidget:staticImports('api/calendar-widget.js')},
  accumulatedExperiments:{
    archiveControllerImportedByNormalExport:false,
    oldHomeMapEndpointImportedByNightMap:false,
    trackedEarthAssets:earth.length,trackedEarthBytes:earth.reduce((n,f)=>n+fs.statSync(path.join(root,f)).size,0),
    bundleRule:JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).functions['api/night-map.js'].includeFiles,
    finding:'The broad assets/earth/** bundle rule may include historical assets; no deployment bundle manifest is available to measure the effective package. Legacy /api/home-map imports historical renderers, but the current map source calls /api/night-map. Static import closures and the serialized widget do not include the old diagnostic controller. Repository size, deploy storage and per-transition latency are separate measurements.',
    cleanup:'Removed the unpublished map-plus-clock experiment before publication. New consolidated page imports no old diagnostic transforms. Kept historical URLs/assets for existing widget copies and regression controls; no unsupported speed claim or destructive archive deletion.'},
  verification:{predicateProof:'Each ordered drawing retains identical drawing data and its complete native predicate conjunction, plus manual visibility ancestry.',
    weatherFixtures:18450,removedHomeGroups:50,removedCalendarGroups:8,
    nativeRendering:'Pending; native Widgy group implementation is not executed by offline tests.',nativeLatency:'Not measured; no performance gain claimed.'}
};
for(const name of ['normalExport','consolidatedPage'])if(report.activeImports[name].some(f=>f.includes('map-diagnostic')))throw Error('unexpected diagnostic import');
if(report.activeImports.nightMap.includes('api/home-map.js'))throw Error('unexpected legacy route import');
if(cycles.length || report.variables.unreferenced.length || report.shapeLibraries.missingSelectedItems.length)throw Error('unexpected dependency or shape issue');
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'tools/performance/consolidated-1-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({totalNodes:report.totalNodes,jsonBytes:report.jsonBytes,
  variables:report.variables.count,unusedVariables:report.variables.unreferenced,cycles,
  shapeLibraries:report.shapeLibraries,calendar:{nativeJSONBindings:usedFields.length,literalJSONEndpoints:report.calendar.literalJSONEndpoints},
  activeImports:report.activeImports},null,2));
