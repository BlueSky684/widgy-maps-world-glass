import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';

const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url)));
const before=read('./Widgy_Home_Glass_JS_City_R3.json');
const after=read('./Widgy_Home_Glass_JS_City_R4.json');
const all=w=>w['1'].flatMap(function walk(n){return [n,...(n.z==='13'?n['1'].flatMap(walk):[])];});
const original=new Map(all(before).map(n=>[n.d0,n]));
const nodes=all(after),get=id=>nodes.find(n=>n.d0===id);
assert.equal(new Set(nodes.map(n=>n.d0)).size,nodes.length);
assert(after.a2>Math.max(...nodes.map(n=>n.d0)));
assert.deepEqual(after['36'],before['36'],'Every live variable and source ordering remains exact');
assert.deepEqual(after['2'],before['2'],'Preserve palette');
for(const n of nodes) {
  const old=original.get(n.d0); if(!old)continue;
  for(const k of ['66','o1','p','q'])assert.deepEqual(n[k],old[k],`Source, visibility and actions for ${n.s}`);
  if(n.s?.startsWith('WX ·')||n.d0===6170)assert.deepEqual(n,old,'Weather drawings and map unchanged');
}
assert.equal(get(6110)['1'],'System Light');
assert.equal(get(6105)['1'],'DINCondensed-Bold');
assert.equal(get(6105)['2'].a[0].a,1);
assert.deepEqual(get(6105)['66'],[{'5':'Date And Time','6':'d'}]);
// Text uses native centering, so date length cannot move the center column.
assert.equal(get(6105).d.a[0].a,140.969163);
assert.equal(get(6123).e.a[0].a,get(80205).e.a[0].a);
assert.equal(nodes.filter(n=>n.s==='CALENDAR Nav Binding').length,2);
assert(nodes.filter(n=>n.s==='FITNESS Nav Icon').every(n=>n['3']==='figure.run'));

// A daily reset/empty source and goal overflow must remain distinct states.
const progress=after['36'].find(v=>v['1']==='steps_progress')['3']['66'][0]['10'];
for(const [steps,wanted] of [[0,0],[1,0],[100,1],[6563,65],[7842,78],[9999,99],[10000,100],[15000,100],[0,0],['',-1]]) {
  const code=progress.replaceAll('${widgy.steps_today}',String(steps)).replaceAll('${widgy.steps_goal}','10000');
  assert.equal(vm.runInNewContext(code+'\nmain()'),wanted);
}
const rings=nodes.filter(n=>n.s?.startsWith('Steps Goal Ring'));
assert.equal(rings.length,100);
const polygons=rings.map(n=>{
  const points=JSON.parse(Buffer.from(n['2'],'base64')).items.find(i=>i.id===n['3']).shape.points;
  const p=points.map(({x,y})=>({x:x*142-71,y:y*142-71}));
  for(let i=0;i<p.length;i++){
    const a=p[i],b=p[(i+1)%p.length],c=p[(i+2)%p.length];
    assert((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>0,'Convex shape avoids native filled-center bug');
    const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/(dx*dx+dy*dy)));
    assert(Math.hypot(a.x+t*dx,a.y+t*dy)>57.9);
    assert(Math.hypot(a.x,a.y)<=71.001);
  }
  return {percent:Number(n.o1['2']),points};
});
for(const percent of [0,1,25,50,65,78,99,100]) {
  const shapes=polygons.filter(p=>p.percent<=percent).map(p=>`<polygon points="${p.points.map(({x,y})=>`${x*142},${y*142}`).join(' ')}"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="284" height="284" viewBox="0 0 142 142"><g fill="#c5ff0a">${shapes}</g></svg>`;
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x,y)=>data[(y*info.width+x)*4+3];
  for(let y=0;y<284;y++)for(let x=0;x<284;x++)if(Math.hypot((x+.5)/2-71,(y+.5)/2-71)<57)assert.equal(alpha(x,y),0);
  for(let degree=0;degree<360;degree++){
    const a=(degree-90)*Math.PI/180,x=Math.round((71+64.5*Math.cos(a))*2),y=Math.round((71+64.5*Math.sin(a))*2);
    if(percent>0&&degree<=percent*3.6)assert(alpha(x,y)>245,'Continuous reached arc');
    if(percent===0)assert.equal(alpha(x,y),0);
  }
}
const svg=readFileSync(new URL('../assets/home-glass/Home_Glass_Chrome_R4.svg',import.meta.url),'utf8');
assert(svg.includes('r="64.5" fill="none" stroke="url(#ring)" stroke-width="13"'));
const baseSVG=readFileSync(new URL('../assets/home-glass/Home_Glass_Chrome.svg',import.meta.url),'utf8');
assert.equal(svg.replace('r="64.5" fill="none" stroke="url(#ring)" stroke-width="13"','r="63" fill="none" stroke="url(#ring)" stroke-width="16"'),baseSVG,'Chrome differs only in ring track');
const meta=await sharp(new URL('../assets/home-glass/Home_Glass_Chrome_R4.png',import.meta.url).pathname).metadata();
assert.equal(meta.width,3306);assert.equal(meta.height,3449);assert.equal(meta.hasAlpha,true);
console.log('PASS R4: daily 10,000-step clamp/reset, thin hollow convex ring at representative states, matching track; live sources/map/weather/actions preserved, centered native date, importer geometry. Native phone font rendering pending.');
