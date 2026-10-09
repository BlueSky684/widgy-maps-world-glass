// Private input; public output contains counts/names only, never source URLs,
// scripts, location, events or arbitrary document metadata.
import fs from 'node:fs';
import {flatten,variableReferences,pruneUnused,inlineSingleTextSources} from './compact-widget-structure.js';
const w=JSON.parse(fs.readFileSync(process.argv[2]));
const vs=w['36'],ns=flatten(w['1']),byName=new Map(vs.map(v=>[v['1'],v]));
const own=n=>Object.fromEntries(Object.entries(n).filter(([k])=>n.z!=='13'||k!=='1'));
const graph=Object.fromEntries(vs.map(v=>[v['1'],[...variableReferences(v['3'],vs)]]));
function depth(name,path=[]){if(path.includes(name))throw Error('Dependency cycle');return 1+Math.max(0,...graph[name].map(k=>depth(k,[...path,name])));}
const inventory=vs.map(v=>({name:v['1'],type:v['2'],dependsOn:graph[v['1']],chainDepth:depth(v['1']),layerConsumers:ns.filter(n=>variableReferences(own(n),[v]).size).length,variableConsumers:vs.filter(o=>o!==v&&variableReferences(o['3'],[v]).size).length,providers:v['3']['66'].map(s=>({provider:s['5'],field:s['6']}))}));
const bindings=[];for(const n of [...ns,...vs.map(v=>v['3'])])for(const s of n['66']||[])bindings.push(s);
const duplicateBindings=[...new Set(bindings.map(s=>s['5']))].map(provider=>({provider,bindings:bindings.filter(s=>s['5']===provider).length}));
const shapeLibraries=ns.filter(n=>n.z==='2'&&n['2']).map(n=>JSON.parse(Buffer.from(n['2'],'base64')));
const report={schema:1,baseline:'c2a80846fc091070a528ad32df4cc494b6520ee5',nodes:ns.length,variables:vs.length,tabs:w['1'].map(n=>({name:n.s,nodes:flatten([n]).length,groups:flatten([n]).filter(n=>n.z==='13').length})),inventory,unusedVariables:pruneUnused(structuredClone(w)),eligibleSingleUseTextBindings:inlineSingleTextSources(structuredClone(w)),duplicateBindings,
 calendar:{months:ns.filter(n=>/^Calendar · Month Offset /.test(n.s)).length,grids:ns.filter(n=>n.z==='10').length,todayPositions:ns.filter(n=>/^Calendar · Today Cell /.test(n.s)).length,todayDateDrawings:ns.filter(n=>/^Calendar · Today (Live Date|Date Weight)$/.test(n.s)).length,jsonBindings:bindings.filter(s=>s['5']==='JSON Endpoint').length,jsonURLs:new Set(bindings.filter(s=>s['5']==='JSON Endpoint').map(s=>s['18'])).size},shapes:{libraries:shapeLibraries.length,unusedItems:shapeLibraries.reduce((c,s)=>c+s.items.length-1,0)},
 limits:['Counts describe stored definitions, not runtime scheduling or network requests.','Existing nine Calendar text inlining candidates were already tested and retired; not reapplied.','Today date overprints and alternate weather/month states are deliberate artwork.','Native Health/Pedometer/Weather scheduling and actual tap-to-display latency are not observable on this server.']};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({nodes:report.nodes,variables:report.variables,tabs:report.tabs,unusedVariables:report.unusedVariables,calendar:report.calendar,shapes:report.shapes,maxVariableChain:Math.max(...inventory.map(x=>x.chainDepth)),eligiblePreviouslyRetired:report.eligibleSingleUseTextBindings.length}));
