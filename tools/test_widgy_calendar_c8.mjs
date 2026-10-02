import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {withoutMap} from './widgy-calendar-diagnostics.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const c6=read('./Widgy_Home_Glass_Calendar_C6.json'),c7=read('./Widgy_Home_Glass_Calendar_C7.json'),w=read('./Widgy_Home_Glass_Calendar_C8.json');
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const all=[...walk(w['1'])],old=[...walk(c7['1'])],oldIds=new Map(old.map(n=>[n.d0,n]));
assert.equal(all.length,1765);assert.equal(new Set(all.map(n=>n.d0)).size,all.length);
assert(w.a2>Math.max(...all.map(n=>n.d0)));
const ids=new Set(all.map(n=>n.d0));
for(const n of all)if(n['1a'])for(const id of n['1a'].replace('button_','').split(/[-,]/).map(Number))assert(ids.has(id),`Dangling action target ${id}`);
assert.deepEqual(w['36'],c7['36']);
assert.equal(w['36'].find(v=>v['1']==='steps_goal')['3']['66'][0]['25'],'10000');
for(const n of all)if(n.z==='10')assert.deepEqual(n,oldIds.get(n.d0));
assert.equal(all.filter(n=>n.z==='10').length,75);
const c6rings=[...walk(c6['1'])].filter(n=>n.s?.startsWith('Steps Goal Ring'));
const rings=all.filter(n=>n.s?.startsWith('Steps Goal Ring'));
assert.deepEqual(rings,c6rings); // The known-working on-device convex geometry AND conditions.
const valueCode=w['36'].find(v=>v['1']==='steps_progress')['3']['66'][0]['10'];
for(const [value,expected] of [[0,0],[99,0],[100,1],[3427,34],['3,427',34],[9999,99],[10000,100],[15000,100],['',-1]]){
 const code=valueCode.replaceAll('${widgy.steps_today}',String(value)).replaceAll('${widgy.steps_goal}','10000');
 assert.equal(vm.runInNewContext(code+';main()'),expected);
}
const shown=(n,p)=>n.o1['1']===5?p>=+n.o1['2']:p===+n.o1['2'];
const polygons=(layers,p)=>layers.filter(n=>shown(n,p)).map(n=>{
 const points=JSON.parse(Buffer.from(n['2'],'base64').toString()).items.find(x=>x.id===n['3']).shape.points;
 return `<polygon points="${points.map(({x,y})=>`${x*142},${y*142}`).join(' ')}"/>`;
}).join('');
async function raster(layers,p){
 return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="284" height="284" viewBox="0 0 142 142"><g fill="#c5ff0a">${polygons(layers,p)}</g></svg>`)).ensureAlpha().raw().toBuffer();
}
const oldRings=old.filter(n=>n.s?.startsWith('Steps Goal Ring'));
// Reproduce the screenshot defect using the actual exported conditions.
const broken=await raster(oldRings,34),fixed=await raster(rings,34);
const alphaAt=(data,degree,r=64.5)=>{
 const a=(degree-90)*Math.PI/180,x=Math.round((71+r*Math.cos(a))*2),y=Math.round((71+r*Math.sin(a))*2);
 return data[(y*284+x)*4+3];
};
assert.equal(alphaAt(broken,45),0);assert(alphaAt(fixed,45)>245);
for(let p=0;p<=100;p++){
 const data=await raster(rings,p);
 assert.equal(rings.filter(n=>shown(n,p)).length,p);
 for(let y=0;y<284;y++)for(let x=0;x<284;x++)if(Math.hypot((x+.5)/2-71,(y+.5)/2-71)<56)assert.equal(data[(y*284+x)*4+3],0);
 for(let degree=0;degree<360;degree++){
  if(p>0&&degree<=p*3.6)assert(alphaAt(data,degree)>245,`Ring gap at ${p}%/${degree}`);
  if(p<95&&degree>p*3.6+9&&degree<351)assert.equal(alphaAt(data,degree),0);
 }
 const bars=all.filter(n=>n.s?.startsWith('Day Progress Fill · '));
 assert.equal(bars.filter(n=>shown(n,p)).length,p===0?0:1);
}

const cal=w['1'].find(n=>n.d0===247),panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
const offset=p=>+p.s.split(' ').at(-1),paneMap=new Map(panes.map(p=>[offset(p),p]));
const arrows=cal['1'].filter(n=>/^Calendar · (?:left|right) Arrow/.test(n.s??''));
assert.equal(arrows.length,4);
function click(n){
 const state=new Map(all.map(n=>[n.d0,n.a!==false]));
 const parts=n['1a'].slice(7).split('-');
 for(const id of parts[0].split(',').map(Number))state.set(id,true);
 for(const id of parts[1].split(',').map(Number))state.set(id,false);
 return state;
}
let navigationChecks=0;
function checkAction(n,target){
 const s=click(n);assert(s.get(247));for(const id of [245,246,195])assert(!s.get(id));
 assert.deepEqual(panes.filter(p=>s.get(p.d0)).map(offset),[target]);
 const visible=arrows.filter(n=>s.get(n.d0));assert.equal(visible.length,2);
 assert(visible.some(n=>n.s===`Calendar · left Arrow${target===-12?' · Boundary':''}`));
 assert(visible.some(n=>n.s===`Calendar · right Arrow${target===12?' · Boundary':''}`));
 navigationChecks++;
}
for(const p of panes)for(const [name,target] of [['Previous',offset(p)-1],['Next',offset(p)+1]]){
 const action=p['1'].find(n=>n.s===`Calendar · ${name} Month`);
 if(target< -12||target>12){assert(!action);continue;}
 checkAction(action,target);
}
checkAction(cal['1'].find(n=>n.s==='Calendar · Return to Current Month'),0);
for(const tab of w['1'])checkAction(tab['1'].find(n=>n.s==='CALENDAR Tap'),0);

// Exhaustive calendar-day reachability over the 400-year Gregorian cycle,
// independent of the implementation's hard-coded min/max index.
let daysChecked=0;
for(let year=2000;year<2400;year++)for(let month=0;month<12;month++){
 const count=new Date(year,month+1,0).getDate(),start=new Date(year,month,1).getDay(),rows=Math.ceil((start+count)/7);
 const layout=paneMap.get(0)['1'].find(n=>n.s===`Calendar · ${rows} Week Layout`);
 const cells=layout['1'].filter(n=>/^Calendar · Today Cell /.test(n.s??''));
 for(let day=1;day<=count;day++){
  assert.equal(cells.filter(n=>+n.o1['2']===start+day-1).length,1);daysChecked++;
 }
}
const beforeImage=oldIds.get(6170),image=all.find(n=>n.d0===6170);assert.deepEqual(image,beforeImage);
const diagnostic=withoutMap(w);
assert.deepEqual(diagnostic['1'].filter(n=>n.d0!==245),w['1'].filter(n=>n.d0!==245));
assert.deepEqual(diagnostic['1'].find(n=>n.d0===245)['1'],w['1'].find(n=>n.d0===245)['1'].filter(n=>n.d0!==6170));
assert.equal(diagnostic['36'].length,w['36'].length-5);
assert(!JSON.stringify(diagnostic).includes('bigdatacloud'));
assert(!JSON.stringify(diagnostic).includes('/api/night-map'));
const oldScript=readFileSync(new URL('./widgy-home-calendar-c7.html',import.meta.url),'utf8').split('<script>')[1];
const script=readFileSync(new URL('./widgy-home-calendar-c8.html',import.meta.url),'utf8').split('<script>')[1];
assert.equal(script.replaceAll('C8','C7'),oldScript);
console.log(JSON.stringify({passed:true,c7RingDefectReproduced:true,ringGeometryStates:101,goal:10000,layersBefore:old.length,layersAfter:all.length,navigationChecks,daysChecked,allNativeCalendarsPreserved:true,mapAndVariablesUnchanged:true,copyFlowPreserved:true,diagnosticOnlyRemovesMapPipeline:true}));
