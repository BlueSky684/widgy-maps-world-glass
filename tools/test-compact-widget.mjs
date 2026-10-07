import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
import {compactWidgetStructure,flatten,variableReferences} from './compact-widget-structure.js';
const file=process.argv[2];if(!file)throw Error('Pass a local full external-map test export');
const original=JSON.parse(fs.readFileSync(file,'utf8')),copy=structuredClone(original);
const {widget:w,report}=compactWidgetStructure(original);
assert.deepEqual(original,copy,'Input mutated');
assert.equal(report.after.layers,1289);assert.equal(report.after.variables,40);
const old=new Map(flatten(original['1']).map(n=>[n.d0,n])),now=new Map(flatten(w['1']).map(n=>[n.d0,n]));
assert.equal(now.size,1289);
const deleted=new Set(report.separatorChanges.flatMap(x=>x.removed));
assert.equal(deleted.size,225);
for(const n of now.values())if(n['1a']?.startsWith('button_'))for(const id of n['1a'].slice(7).split(/[-,]/).filter(Boolean).map(Number))
  assert(now.has(id),'Dangling native action');
const restored=structuredClone(w),restoredNodes=new Map(flatten(restored['1']).map(n=>[n.d0,n]));
for(const change of report.separatorChanges)restoredNodes.get(change.group)['1']=structuredClone(old.get(change.group)['1']);
for(const change of report.dots)restoredNodes.get(change.layer)['2']=old.get(change.layer)['2'];
for(const change of report.inlined)restoredNodes.get(change.layer)['66']=structuredClone(old.get(change.layer)['66']);
restored['36']=structuredClone(original['36']);restored['3']=original['3'];restored['4']=original['4'];
assert.deepEqual(restored,original,'Unexpected change outside transformation whitelist');
// Every original Today badge, native month grid, frame, visibility condition,
// tap action, weather drawing, live source and external map remain exact.
for(const n of now.values())if(!['13'].includes(n.z) && !report.separatorChanges.some(x=>x.kept===n.d0) &&
  !report.dots.some(x=>x.layer===n.d0) && !report.inlined.some(x=>x.layer===n.d0))assert.deepEqual(n,old.get(n.d0));
const variableNames=new Set(w['36'].map(v=>v['1']));
const encoded=JSON.stringify(w);
for(const m of encoded.matchAll(/\$\{widgy\.([^}]+)\}/g))assert(variableNames.has(m[1]),'Dangling named variable');
for(const v of original['36'])if(!variableNames.has(v['1']) && v['0']!==w['36'].find(v=>v['1']==='calendar_refresh_minute')['0'])
 assert(!encoded.toLowerCase().includes(v['0'].toLowerCase()),'Dangling variable ID');
const clock=w['36'].find(v=>v['1']==='calendar_refresh_minute')['3']['66'][0]['10'];
const run=(code,time)=>vm.runInNewContext(code+';main();',{Date:class extends Date{static now(){return time}}},{timeout:500});
for(const time of [0,59999,60000,60001,Date.UTC(2026,9,7,23,59,59),Date.UTC(2026,9,8),Date.UTC(2028,1,29)]){
 const minute=run(clock,time);
 for(const c of report.dots){
  const code=original['36'].find(v=>v['1']===c.originalVariable)['3']['66'][0]['10'];
  assert.equal(now.get(c.layer)['2'].replace('${widgy.calendar_refresh_minute}',minute),run(code,time),'Calendar refresh URL differs');
 }
}
// Source objects are copied byte-for-byte: no additional endpoint, auth, path,
// calendar rank, data formatting, or cadence change is introduced by inlining.
for(const c of report.inlined){
 const v=original['36'].find(v=>v['1']===c.name);
 assert.deepEqual(now.get(c.layer)['66'][c.index],v['3']['66'][0]);
}
const scalar=(n,k)=>n[k].a[0].a;
const xml=(body,width)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="${width}" height="${Math.round(width*1184/1135)}">${body}</svg>`;
const rgba=async svg=>sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
let imageCases=0;const seen=new Set();
for(const c of report.separatorChanges){
 const before=old.get(c.group)['1'].filter(n=>/^Calendar · Week Separator [1-5]$/.test(n.s));
 const n=now.get(c.kept),points=JSON.parse(Buffer.from(n['2'],'base64')).items[0].shape.points;
 assert.equal(points.length,before.length*7);
 // Check every rectangle in every month, including sub-pixel precision.
 before.forEach((r,i)=>{
   const p=points.slice(i*7,i*7+7),abs=p.map(p=>[scalar(n,'b')+p.x*scalar(n,'d'),scalar(n,'c')+p.y*scalar(n,'e')]);
   for(const [actual,expected] of [[abs[1][1],scalar(r,'c')],[abs[3][1],scalar(r,'c')+scalar(r,'e')]])assert(Math.abs(actual-expected)<1e-9);
   assert.equal(abs[1][0],scalar(r,'b'));assert.equal(abs[2][0],scalar(r,'b')+scalar(r,'d'));
   assert.deepEqual(p[0],p[6]);assert.deepEqual(p[1],p[5]);
 });
 const a=before.map(r=>`<rect x="${scalar(r,'b')}" y="${scalar(r,'c')}" width="${scalar(r,'d')}" height="${scalar(r,'e')}" fill="#52616e"/>`).join('');
 if(seen.has(a))continue;seen.add(a);
 const coords=points.map(p=>`${scalar(n,'b')+p.x*scalar(n,'d')},${scalar(n,'c')+p.y*scalar(n,'e')}`).join(' ');
 const b=`<polygon points="${coords}" fill="#52616e"/>`;
 for(const width of [367,707,1134,1600]){
  const [ra,rb]=await Promise.all([rgba(xml(a,width)),rgba(xml(b,width))]);
  assert(ra.equals(rb),`Separator raster changed at ${width}px`);imageCases++;
 }
}
// All 25 panes and all 4/5/6-week native variants remain present. The calendar
// computations themselves are unchanged; 400 Gregorian years exercise every
// leap-year / weekday pattern and every valid Today position.
const layoutsScript=original['36'].find(v=>v['1']==='calendar_month_layouts')['3']['66'][0]['10'];
assert.equal(layoutsScript,w['36'].find(v=>v['1']==='calendar_month_layouts')['3']['66'][0]['10']);
const center=w['1'].find(n=>n.d0===247)['1'].find(n=>n.s==='Calendar · Month Offset 0');
let days=0;
for(let year=2000;year<2400;year++)for(let month=0;month<12;month++){
 const first=new Date(Date.UTC(year,month,1)).getUTCDay(),max=new Date(Date.UTC(year,month+1,0)).getUTCDate(),weeks=Math.ceil((first+max)/7);
 const layout=center['1'].find(n=>n.s===`Calendar · ${weeks} Week Layout`);
 for(let day=1;day<=max;day++){
  const cell=first+day-1,badges=layout['1'].filter(n=>n.s===`Calendar · Today Cell ${cell}`);
  assert.equal(badges.length,1);assert.deepEqual(badges[0],old.get(badges[0].d0));days++;
 }
}
console.log(JSON.stringify({pass:true,layers:report.after.layers,variables:report.after.variables,
 nativeActionsValid:true,fullDocumentWhitelist:true,calendarDaysChecked:days,separatorPixelComparisons:imageCases,
 mapAndFontsUnchanged:true,nativePhoneRendering:'not executed',nativeLatency:'not measured'}));
