import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {REFERENCE,DAY_BAR,STEPS_RING,BOXES} from './home_glass_design.mjs';
const read=n=>JSON.parse(readFileSync(new URL(n,import.meta.url),'utf8'));
const before=read('./widgy-home-f50-data.json'),after=read('./Widgy_Home_Glass.json');
const all=[];function walk(n){all.push(n);if(n.z==='13')n['1'].forEach(walk);}after['1'].forEach(walk);
const get=id=>all.find(n=>n.d0===id),home=get(245)['1'];
assert.equal(new Set(all.map(n=>n.d0)).size,all.length);
assert(after.a2>Math.max(...all.map(n=>n.d0)));
for(let i=1;i<before['1'].length;i++)assert.deepEqual(after['1'][i],before['1'][i],'Other tabs must remain unchanged');
assert.deepEqual(after['36'].slice(0,before['36'].length),before['36'],'Existing live variables remain exact');
for(const id of [6110,6121,6124,6131,6132,6143,6144])assert.deepEqual(get(id)['66'],before['1'][0]['1'].find(n=>n.d0===id)['66'],`Live source ${id}`);
assert.equal(get(6110)['1'],'System Light');
const colorKeys=new Set(after['2'].map(s=>s.split('-')[0]));
for(const n of all){
 for(const k of ['f','g'])if(n[k]?.startsWith('hexcol_'))assert(colorKeys.has(n[k].split('-')[0]));
 if(n.z==='2'&&n['2']&&n['3']){
  const lib=JSON.parse(Buffer.from(n['2'],'base64').toString());
  const shape=lib.items.find(s=>s.id===n['3']).shape;
  for(const p of shape.points)assert(Number.isFinite(p.x)&&Number.isFinite(p.y));
 }
}
const val=(n,k)=>n[k].a[0].a;
for(const [id,expected] of Object.entries(BOXES)){
 const n=get(Number(id)),actual=[val(n,'b')*REFERENCE.width/1600,val(n,'c')*REFERENCE.height/1600,val(n,'d')*REFERENCE.width/1600,val(n,'e')*REFERENCE.height/1600];
 actual.forEach((v,i)=>assert(Math.abs(v-expected[i])<.001));
 assert(actual[0]>=0&&actual[1]>=0&&actual[0]+actual[2]<=REFERENCE.width&&actual[1]+actual[3]<=REFERENCE.height);
}
const chrome=home.find(n=>n.s==='Approved Glass · Chrome and Frames'),map=get(6170);
assert(home.indexOf(chrome)<home.indexOf(map));
for(const n of home.filter(n=>n.s?.startsWith('WX ·')))assert(home.indexOf(n)<home.indexOf(chrome));
const ring=home.filter(n=>n.s?.startsWith('Steps Goal Ring'));
assert.equal(ring.length,100);
const progress=after['36'].find(v=>v['1']==='steps_progress')['3']['66'][0]['10'];
for(const [steps,goal,expected] of [[0,10000,0],[99,10000,0],[100,10000,1],[2493,10000,24],[7842,10000,78],[10000,10000,100],[12000,10000,100],[2493,5000,49],['',10000,-1],['—',10000,-1],['${widgy.steps_today}',10000,-1],[1000,0,-1]]){
 const code=progress.replaceAll('${widgy.steps_today}',String(steps)).replaceAll('${widgy.steps_goal}',String(goal));
 const result=vm.runInNewContext(code+'\nmain()');assert.equal(result,expected);
 const shown=ring.filter(n=>result>=Number(n.o1['2']));assert.equal(shown.length,Math.max(0,expected));
}
const fills=home.filter(n=>n.s?.startsWith('Day Progress Fill'));
const label=after['36'].find(v=>v['1']==='steps_label')['3']['66'][0]['10'];
for(const [input,expected] of [['0','0'],['999','999'],['2535','2,535'],['10,000','10,000'],['100000','100,000'],['','—'],['${widgy.steps_today}','—']]) {
 const result=vm.runInNewContext(label.replaceAll('${widgy.steps_today}',input)+'\nmain()');
 assert.equal(result,expected);
}
assert.equal(get(6141)['66'][0]['25'],'${widgy.steps_label}');
assert.equal(fills.length,100);
for(const n of fills){
 const p=Number(n.o1['2']);assert(Math.abs(val(n,'d')*REFERENCE.width/1600-DAY_BAR.width*p/100)<.001);
 assert.equal(n.o1['0'],after['36'].find(v=>v['1']==='day_progress')['0']);
}
for(const loc of [ ['31.8','34.7','Ashdod'],['31.8','34.7',"St. John's"],['0','0','Zero'],['','', ''],['${widgy.Latitude}','${widgy.Longitude}','${widgy.City}'] ]){
 let code=map['22'];for(const [key,value] of Object.entries({Latitude:loc[0],Longitude:loc[1],City:loc[2]}))code=code.replaceAll('${widgy.'+key+'}',value);
 const url=new URL(vm.runInNewContext(code+'\nmain()'));
 assert.equal(url.searchParams.get('presentation'),'glass');assert.equal(url.searchParams.get('width'),'3306');
 assert.equal(url.searchParams.has('lat'),loc[0]==='31.8'||loc[0]==='0');
}
// Every approved weather shape/glyph and conditional branch must survive styling.
function oldWalk(n){
 const current=get(n.d0);assert(current);
 if(n.o1)assert.deepEqual(current.o1,n.o1);
 if(n.z==='13')n['1'].forEach(oldWalk);
 else {for(const k of ['1','2','3','4','p','q','i'])if(k in n)assert.deepEqual(current[k],n[k]);}
}
for(const group of before['1'][0]['1'].filter(n=>n.s?.startsWith('WX ·')))oldWalk(group);
const chromePath=new URL('../assets/home-glass/Home_Glass_Chrome.png',import.meta.url);
const {data,info}=await sharp(readFileSync(chromePath)).raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,3306);assert.equal(info.height,3449);assert.equal(info.channels,4);
const alpha=(x,y)=>data[(Math.round(y*info.height/REFERENCE.height)*info.width+Math.round(x*info.width/REFERENCE.width))*4+3];
assert.equal(alpha(700,400),0,'Map opening must stay transparent');
assert.equal(alpha(500,70),255);assert.equal(alpha(400,900),255);
console.log(`PASS: ${all.length} unique native layers; measured frames; original live sources, tabs and weather masters; daylight binding; step goals and missing data; global location; transparent 3306 x 3449 lossless chrome.`);
console.log('Native step ring and prior variables confirmed in IMG_9626; revised spacing and formatted steps require the next iPhone screenshot.');
