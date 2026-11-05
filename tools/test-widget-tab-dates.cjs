const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p));
const walk=n=>[n,...(Array.isArray(n['1'])?n['1'].flatMap(walk):[])];
const original=new Map(walk(read(process.argv[2])).map(n=>[n.d0,n]));
const candidate=new Map(walk(read(process.argv[3])).map(n=>[n.d0,n]));
const ids=read(process.argv[4]).nativeDateLayers;
const pairs=ids.map(id=>[new Function('Date',original.get(id)['66'][0]['10']+';return main();'),candidate.get(id)]);
const weekday=new Intl.DateTimeFormat('en-US',{weekday:'long'}),shortday=new Intl.DateTimeFormat('en-US',{weekday:'short'}),month=new Intl.DateTimeFormat('en-US',{month:'long'});
let cases=0;
function verify(time){
 class Clock extends Date{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
 for(const [before,n]of pairs){
   const dt=new Date(time);
   if(n['29']){const parts=n['29'].split('|');assert.deepEqual([parts[0],parts[1],parts[3],parts[4]],['0','0','0','0']);
     const [mode,days]=parts[2].split('_').map(Number);assert([2,3].includes(mode));dt.setDate(dt.getDate()+(mode===2?days:-days));}
   let result=n['66'].map(p=>p['5']==='Custom Text'?p['25']:
     ({EEEE:()=>weekday.format(dt),E:()=>shortday.format(dt),MMMM:()=>month.format(dt),d:()=>String(dt.getDate()),yyyy:()=>String(dt.getFullYear())})[p['6']]()).join('');
   if(n['9']?.a[0].a===1)result=result.toUpperCase();
   assert.equal(result,before(Clock),`${n.d0} ${new Date(time).toISOString()}`);cases++;
 }
}
for(let y=2000;y<2400;y++)for(let m=0;m<12;m++)for(const d of [1,new Date(y,m+1,0).getDate()])verify(new Date(y,m,d,12).getTime());
// Re-create Intl formatters for the timezone of each process (run externally).
for(const utc of ['2026-12-31T21:59:59Z','2026-12-31T22:00:00Z','2026-10-24T22:59:59Z','2026-10-24T23:00:00Z','2026-03-27T00:00:00Z','2028-02-29T23:59:59Z'])verify(Date.parse(utc));
console.log(`${process.env.TZ}: ${cases} date outputs match; native-format contract modeled, not an on-device render.`);
