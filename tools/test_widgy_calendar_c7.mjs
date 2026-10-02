import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const old=read('./Widgy_Home_Glass_Calendar_C6.json'),w=read('./Widgy_Home_Glass_Calendar_C7.json');
const walk=function*(n){if(!n||typeof n!=='object')return;if(n.z)yield n;for(const v of Object.values(n))if(typeof v==='object')yield* walk(v);};
const before=[...walk(old['1'])],after=[...walk(w['1'])],oldIds=new Map(before.map(n=>[n.d0,n]));
assert.equal(before.length,2000);assert.equal(after.length,1884);
assert.equal(new Set(after.map(n=>n.d0)).size,after.length);
assert(w.a2>Math.max(...after.map(n=>n.d0)));
assert.equal(w['36'].find(v=>v['1']==='steps_goal')['3']['66'][0]['25'],'10000');
for(const n of after){
 const original=oldIds.get(n.d0);assert(original);
 if(n.z==='10'||n.z==='11')assert.deepEqual(n,original); // Actual native grids and buttons untouched.
 if(/^(Day Progress Fill|Steps Goal Ring) · /.test(n.s)){
  const copy=structuredClone(n);copy.o1['1']=5;assert.deepEqual(copy,original);
 }
}
for(let p=0;p<=100;p++)for(const prefix of ['Day Progress Fill','Steps Goal Ring']){
 const shapes=after.filter(n=>n.s?.startsWith(prefix+' · '));
 const shown=shapes.filter(n=>Number(n.o1['2'])===p);
 assert.equal(shown.length,p===0?0:1);
 if(p)assert.equal(shown[0].s,`${prefix} · ${p}%`);
}
const idFor=name=>w['36'].find(v=>v['1']===name)['0'];
function condition(c,values){
 if(!c)return true;
 const a=String(values[c['0']]??''),b=c['2'];
 return ({0:()=>a===b,1:()=>a!==b,2:()=>a.includes(b),3:()=>!a.includes(b),5:()=>Number(a)>=Number(b),6:()=>Number(a)<Number(b)})[c['1']]();
}
function visibleLeaves(n,values,out=[]){
 if(n.a===false||!condition(n.o1,values))return out;
 if(n.z==='13')for(const child of n['1'])visibleLeaves(child,values,out);
 else out.push(n.d0);
 return out;
}
// Removing one-child wrappers must preserve the exact visible leaf set,
// including multilingual titles, missing locations and all-day branches.
let visibilityCases=0;
for(const title of ['Team Sync','O\'Brien "Meeting"','הושענא רבה','Meet שלום','${widgy.fake}','\\n',...Array.from({length:27},(_,i)=>String.fromCharCode(0x5d0+i))]){
 for(const location of ['', 'Room 1'])for(const allDay of [false,true])for(let row=1;row<=4;row++){
  const values={[idFor('calendar_remaining_today')]:4,[idFor(`calendar_event_${row}_title`)]:title,[idFor(`calendar_event_${row}_location`)]:location,[idFor(`calendar_event_${row}_start`)]:allDay?'0:00':'9:00',[idFor(`calendar_event_${row}_end`)]:allDay?'23:59':'10:00'};
  const get=x=>x['1'].find(n=>n.d0===247)['1'].find(n=>n.s===`Agenda · Row ${row}`);
  assert.deepEqual(visibleLeaves(get(w),values),visibleLeaves(get(old),values));visibilityCases++;
 }
}
for(const n of after.filter(n=>n.z==='1')){
 const original=oldIds.get(n.d0);
 if(JSON.stringify(n['66'])===JSON.stringify(original['66']))continue;
 assert.equal(n['66'].length,1);assert.equal(n['66'][0]['5'],'Custom Text');
 const name=n['66'][0]['25'].match(/^\$\{widgy\.(calendar_event_[1-4]_(?:title|location|start|end))\}$/)?.[1];assert(name);
 const variable=w['36'].find(v=>v['1']===name);
 assert.deepEqual(variable['3']['66'],original['66']);
}
const header=readFileSync(new URL('./widgy-home-calendar-c7.html',import.meta.url),'utf8').split('<script>')[1];
assert.equal(header.replaceAll('C7','C6'),readFileSync(new URL('./widgy-home-calendar-c6.html',import.meta.url),'utf8').split('<script>')[1]);

const script=w['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10'];
let clock=100000,fetches=0,finish;
class FixedDate extends Date{static now(){return clock;}}
const ctx=vm.createContext({Date:FixedDate,sendToWidgy:url=>finish(url),fetch:url=>{
 fetches++;const parsed=new URL(url);
 return Promise.resolve({ok:true,json:async()=>({lookupSource:'coordinates',latitude:parsed.searchParams.get('latitude'),longitude:parsed.searchParams.get('longitude'),city:'Test City'})});
}});
async function run(context=ctx,lat='0',lon='0'){
 return new Promise(resolve=>{
  finish=resolve;
  vm.runInContext(script.replaceAll('${widgy.map_latitude_max5}',lat).replaceAll('${widgy.map_longitude_max5}',lon),context,{timeout:1000});
 });
}
await run();assert.equal(fetches,1);clock+=1000;await run();assert.equal(fetches,1);
await run(ctx,'0.00001');assert.equal(fetches,2);await run(ctx,'0.00001');assert.equal(fetches,2);
clock+=60000;await run(ctx,'0.00001');assert.equal(fetches,3);
clock-=100000;await run(ctx,'0.00001');assert.equal(fetches,4); // Clock rollback never prolongs reuse.
await run(ctx,'unavailable');assert.equal(fetches,4);
ctx.globalThis=undefined;
await run();await run();assert.equal(fetches,6); // Unsupported context remains fully functional.
console.log(JSON.stringify({passed:true,layersBefore:before.length,layersAfter:after.length,visibilityCases,nativeGridsAndActionsUnchanged:true,exclusiveProgressCases:202,agendaBindingsEquivalent:true,copyFlowPreserved:true,cityReuseWithSafeFallback:true,eventDotOffsetStillPending:true}));
