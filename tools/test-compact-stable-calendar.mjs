import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import sharp from 'sharp';
import {compactStableCalendar} from './compact-stable-calendar.js';
import {flatten} from './compact-widget-structure.js';

const file = process.argv[2];
if (!file) throw Error('Pass the current private Server City Cache Test 1 export');
const original = JSON.parse(readFileSync(file, 'utf8')), snapshot = structuredClone(original);
const {widget, report} = compactStableCalendar(original);
assert.deepEqual(original, snapshot, 'Input stays immutable');
assert.equal(report.after.nodes, 1190); assert.equal(report.after.variables, 55);
assert.equal(report.separatorChanges.length, 75); assert.equal(report.dots.length, 25);
assert.deepEqual(report.pruned.slice().sort(), ['steps_goal','steps_progress']);
const before = new Map(flatten(original['1']).map(n => [n.d0,n]));
const after = new Map(flatten(widget['1']).map(n => [n.d0,n]));
assert.equal(after.size, 1190, 'No duplicate node IDs');
for (const n of after.values()) if (n['1a']?.startsWith('button_')) {
  for (const id of n['1a'].slice(7).split(/[-,]/).filter(Boolean).map(Number)) assert(after.has(id), 'Unknown tap target');
}
for (const tab of ['HOME','WEATHER','FITNESS']) assert.deepEqual(widget['1'].find(t=>t.s===tab), original['1'].find(t=>t.s===tab), tab+' is byte-for-byte unchanged');
const oldVariables = new Map(original['36'].map(v=>[v['1'],v]));
for (const v of widget['36']) if (v['1'] !== 'calendar_refresh_minute') assert.deepEqual(v, oldVariables.get(v['1']), 'Retained variables are exact');
const restored = structuredClone(widget), restoredNodes = new Map(flatten(restored['1']).map(n=>[n.d0,n]));
for (const c of report.separatorChanges) restoredNodes.get(c.group)['1'] = structuredClone(before.get(c.group)['1']);
for (const c of report.dots) restoredNodes.get(c.layer)['2'] = before.get(c.layer)['2'];
restored['36'] = structuredClone(original['36']); restored['3'] = original['3']; restored['4'] = original['4'];
assert.deepEqual(restored, original, 'Full-document mutation whitelist');
const names = new Set(widget['36'].map(v=>v['1'])), serialized = JSON.stringify(widget);
for (const m of serialized.matchAll(/\$\{widgy\.([^}]+)\}/g)) assert(names.has(m[1]), 'Dangling named variable');
const clockVariable = widget['36'].find(v=>v['1']==='calendar_refresh_minute');
for (const v of original['36']) if (!names.has(v['1']) && v['0'] !== clockVariable['0']) assert(!serialized.toLowerCase().includes(v['0'].toLowerCase()), 'Dangling native variable ID');
const run = (code,time) => vm.runInNewContext(code+';main();', {Date:class extends Date{static now(){return time}}}, {timeout:500});
for (const time of [0,59999,60000,60001,Date.UTC(2026,9,24,22,59,59),Date.UTC(2026,9,25),Date.UTC(2026,11,31,23,59,59),Date.UTC(2027,0,1),Date.UTC(2028,1,29)]) {
  const minute = run(clockVariable['3']['66'][0]['10'],time);
  for (const c of report.dots) {
    const old = oldVariables.get(c.originalVariable)['3']['66'][0]['10'];
    assert.equal(after.get(c.layer)['2'].replace('${widgy.calendar_refresh_minute}',minute), run(old,time), 'Exact resolved dot URL, auth and refresh value');
  }
}
const scalar=(n,k)=>n[k].a[0].a;
const svg=(body,width)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="${width}" height="${Math.round(width*1184/1135)}">${body}</svg>`;
const raster=async input=>sharp(Buffer.from(input)).ensureAlpha().raw().toBuffer();
const seen=new Set(); let rasterCases=0, checkedRectangles=0;
for (const c of report.separatorChanges) {
  const old = before.get(c.group)['1'].filter(n=>/^Calendar · Week Separator [1-5]$/.test(n.s||''));
  const n = after.get(c.kept), points=JSON.parse(Buffer.from(n['2'],'base64')).items[0].shape.points;
  assert.equal(points.length,old.length*7);
  assert.equal(n.g,old[0].g,'Material unchanged');
  old.forEach((r,i)=>{
    const p=points.slice(i*7,i*7+7), abs=p.map(p=>[scalar(n,'b')+p.x*scalar(n,'d'),scalar(n,'c')+p.y*scalar(n,'e')]);
    assert(Math.abs(abs[1][1]-scalar(r,'c'))<1e-9);
    assert(Math.abs(abs[3][1]-(scalar(r,'c')+scalar(r,'e')))<1e-9);
    assert.equal(abs[1][0],scalar(r,'b')); assert.equal(abs[2][0],scalar(r,'b')+scalar(r,'d'));
    assert.deepEqual(p[0],p[6]); assert.deepEqual(p[1],p[5]); checkedRectangles++;
  });
  const rects=old.map(r=>`<rect x="${scalar(r,'b')}" y="${scalar(r,'c')}" width="${scalar(r,'d')}" height="${scalar(r,'e')}" fill="#52616e"/>`).join('');
  if (seen.has(rects)) continue; seen.add(rects);
  const polygon=`<polygon points="${points.map(p=>`${scalar(n,'b')+p.x*scalar(n,'d')},${scalar(n,'c')+p.y*scalar(n,'e')}`).join(' ')}" fill="#52616e"/>`;
  for (const width of [367,707,1134,1600]) {
    const [a,b]=await Promise.all([raster(svg(rects,width)),raster(svg(polygon,width))]);
    assert(a.equals(b),'Separator raster must remain identical'); rasterCases++;
  }
}
assert.equal(checkedRectangles,300); assert.equal(rasterCases,12);
const untouched = new Set(['calendar_city_prefix','calendar_native_city','map_request','Latitude','Longitude','map_latitude_max5','map_longitude_max5','day_progress','calendar_month_layouts','calendar_today_cell']);
for (const name of untouched) assert.deepEqual(widget['36'].find(v=>v['1']===name),oldVariables.get(name));
assert.equal(flatten(widget['1']).filter(n=>n.z==='18').length,1,'Native day gauge retained');
assert.equal(flatten(widget['1']).filter(n=>n.s?.startsWith('Calendar · Month Offset ')).length,25);
assert.equal(flatten(widget['1']).filter(n=>/^Calendar · Today Cell /.test(n.s||'')).length,95);
assert.throws(()=>compactStableCalendar({...original,'3':'Unknown copy'}),/Unexpected stable baseline/);
console.log(JSON.stringify({pass:true,nodes:1190,variables:55,removedDrawings:225,sharedClockInsteadOf25Scripts:true,deadVariables:report.pruned,exactHomeAndOtherTabs:true,exactMapAndCityScripts:true,fullDocumentWhitelist:true,resolvedDotURLs:225,separatorRectangles:checkedRectangles,separatorRasterCases:rasterCases,validNativeActions:true,nativePhoneRendering:'not executed',nativeSpeed:'unverified'}));
