import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {withLeanClockComputation} from './lean-clock-computation.js';
import {flatten,variableReferences} from './compact-widget-structure.js';
const source=JSON.parse(readFileSync(process.argv[2])),saved=structuredClone(source);
const {widget,report}=withLeanClockComputation(source);assert.deepEqual(source,saved);
const before=new Map(flatten(source['1']).map(n=>[n.d0,n])),after=new Map(flatten(widget['1']).map(n=>[n.d0,n]));
assert.equal(after.size,1191);assert.equal(widget['36'].length,62);
const compile=code=>new Function('Date',code+';return main();');
const changed=report.changedVariables.map(name=>({name,before:compile(source['36'].find(v=>v['1']===name)['3']['66'][0]['10']),after:compile(widget['36'].find(v=>v['1']===name)['3']['66'][0]['10'])}));
let dates=0;
function compare(time){class Clock extends Date{constructor(...a){super(...(a.length?a:[time]));}static now(){return time;}}
 for(const c of changed)assert.equal(c.after(Clock),c.before(Clock),c.name+' '+new Date(time).toISOString());dates++;
}
// Every date in a complete Gregorian cycle; month ends and century leap rules.
process.env.TZ='UTC';for(let t=Date.UTC(2000,0,1,12);t<Date.UTC(2400,0,1,12);t+=86400000)compare(t);
for(const zone of ['Asia/Jerusalem','America/New_York','Australia/Lord_Howe','Pacific/Apia','Pacific/Kiritimati']){
 process.env.TZ=zone;
 for(const at of ['2011-12-29T23:00Z','2011-12-30T12:00Z','2026-03-27T00:00Z','2026-10-25T00:30Z','2026-12-31T23:59:59Z','2027-01-01T00:00Z','2028-02-29T12:00Z'])compare(Date.parse(at));
}
const oldDay=compile(source['36'].find(v=>v['1']==='day_progress')['3']['66'][0]['10']),newDay=compile(after.get(6123)['66'][0]['10']);
let s;class DayClock{getHours(){return Math.floor(s/3600)}getMinutes(){return Math.floor(s/60)%60}getSeconds(){return s%60}}
for(s=0;s<86400;s++){const old=oldDay(DayClock);assert(old>=0&&old<=99);assert.equal(newDay(DayClock),old+'%');}
const actions=w=>flatten(w['1']).filter(n=>n['1a']).map(n=>[n.d0,n['1a']]);assert.deepEqual(actions(widget),actions(source));
const names=new Set(widget['36'].map(v=>v['1'])),ids=new Set(widget['36'].map(v=>v['0']));
for(const m of JSON.stringify(widget).matchAll(/\$\{widgy\.([^}]+)\}/g))assert(names.has(m[1]));
for(const n of after.values())if(n.o1)assert(ids.has(n.o1['0']));
for(const [id,action]of actions(widget))if(action.startsWith('button_'))for(const target of action.slice(7).split(/[-,]/).map(Number))assert(after.has(target),String(id));
for(const n of [...after.values(),...widget['36'].map(v=>v['3'])])for(const s of n['66']||[])if(s['5']==='Javascript')new vm.Script(s['10']);
const restored=structuredClone(widget),home=restored['1'].find(n=>n.d0===245);
home['1'][home['1'].findIndex(n=>n.d0===6123)]=structuredClone(before.get(6123));
const i=source['1'].find(n=>n.d0===245)['1'].findIndex(n=>n.d0===80205);home['1'].splice(i,0,structuredClone(before.get(80205)));
for(const k of ['36','3','4'])restored[k]=structuredClone(source[k]);assert.deepEqual(restored,source,'Whole document change whitelist');
for(const tab of widget['1'].filter(n=>n.d0!==245))assert.deepEqual(tab,source['1'].find(n=>n.d0===tab.d0),'Calendar/shared/other drawing trees exact');
assert.deepEqual(after.get(6170),before.get(6170));assert.deepEqual(after.get(82317),before.get(82317));
for(const name of ['map_request','map_latitude_max5','map_longitude_max5','calendar_location_pair','calendar_native_city','calendar_native_country'])assert.deepEqual(widget['36'].find(v=>v['1']===name),source['36'].find(v=>v['1']===name));
const bad=structuredClone(source);bad['1'][0].s='${widgy.day_progress}';assert.throws(()=>withLeanClockComputation(bad));
if(process.argv[3])writeFileSync(process.argv[3],JSON.stringify(widget));
console.log(JSON.stringify({pass:true,...report,dates,daySeconds:86400,calendarDrawingTreesExact:true,allNativeActionsExact:true,wholeDocumentWhitelist:true}));
