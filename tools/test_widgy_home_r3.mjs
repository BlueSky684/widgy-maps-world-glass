import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import vm from 'node:vm';

const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url)));
const before = read('./Widgy_Home_Glass_JS_City_R2.json');
const after = read('./Widgy_Home_Glass_JS_City_R3.json');
const restored = structuredClone(after);
const all = widget => widget['1'].flatMap(function walk(n) { return [n, ...(n.z === '13' ? n['1'].flatMap(walk) : [])]; });
const oldLayers = new Map(all(before).map(n => [n.d0, n]));
let icons = 0, ringCount = 0;
for (const layer of all(restored)) {
  if (layer.s === 'FITNESS Nav Icon') {
    assert.equal(layer['3'], 'figure.run');
    layer['3'] = oldLayers.get(layer.d0)['3']; icons++;
  }
  if (layer.s?.startsWith('Steps Goal Ring')) {
    layer['2'] = oldLayers.get(layer.d0)['2']; ringCount++;
  }
}
restored['3'] = before['3']; restored['4'] = before['4'];
assert.deepEqual(restored, before, 'Only four glyphs, 100 ring payloads and metadata may change');
assert.equal(icons, 4); assert.equal(ringCount, 100);

const variable = name => after['36'].find(v=>v['1']===name);
assert.deepEqual(variable('steps_today')['3']['66'], [{'5':'Pedometer','6':'Steps'}]);
assert.equal(variable('steps_goal')['3']['66'][0]['25'],'10000');
const progress = variable('steps_progress')['3']['66'][0]['10'];
for (const [steps, expected] of [[0,0],[99,0],[100,1],[5427,54],[9999,99],[10000,100],[15000,100],[0,0],['',-1]]) {
  const source = progress.replaceAll('${widgy.steps_today}',String(steps)).replaceAll('${widgy.steps_goal}','10000');
  assert.equal(vm.runInNewContext(source+'\nmain()'),expected,'Daily 10,000-step goal with upper clamp and reset');
}

const rings = all(after).filter(n => n.s?.startsWith('Steps Goal Ring'));
const polygons = rings.map(n => {
  const points = JSON.parse(Buffer.from(n['2'], 'base64').toString()).items.find(i => i.id === n['3']).shape.points;
  assert.equal(points.length, 26);
  const p = points.map(({x,y}) => ({x:x*142-71, y:y*142-71}));
  // Convexity prevents a native fill rule/triangulation from spanning a hollow.
  for (let i=0; i<p.length; i++) {
    const a=p[i], b=p[(i+1)%p.length], c=p[(i+2)%p.length];
    assert((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>0);
    const dx=b.x-a.x, dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/(dx*dx+dy*dy)));
    assert(Math.hypot(a.x+t*dx,a.y+t*dy)>54.9, 'No polygon edge enters the central hole');
    assert(Math.hypot(a.x,a.y)<=71.001);
  }
  return {percent:Number(n.o1['2']), points};
});

// Rasterize the actual exported polygons at all 101 displayed states.
// This validates geometry, not the iOS/Widgy renderer itself.
for (let percent=0; percent<=100; percent++) {
  const shapes=polygons.filter(p=>p.percent<=percent).map(p=>
    `<polygon points="${p.points.map(({x,y})=>`${x*142},${y*142}`).join(' ')}"/>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="284" height="284" viewBox="0 0 142 142"><g fill="#c5ff0a">${shapes}</g></svg>`;
  const {data,info}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x,y)=>data[(y*info.width+x)*4+3];
  for (let y=0;y<284;y++) for(let x=0;x<284;x++) {
    if(Math.hypot((x+.5)/2-71,(y+.5)/2-71)<53.5) assert.equal(alpha(x,y),0, `Center must remain hollow at ${percent}%`);
    if(percent===0) assert.equal(alpha(x,y),0);
  }
  for(let degree=0;degree<360;degree++) {
    const theta=(degree-90)*Math.PI/180;
    const x=Math.round((71+63*Math.cos(theta))*2),y=Math.round((71+63*Math.sin(theta))*2);
    if(percent>0 && degree<=percent*3.6) assert(alpha(x,y)>245, `Continuous ring at ${percent}% / ${degree}deg`);
    if(percent<95 && degree>percent*3.6+10 && degree<350) assert.equal(alpha(x,y),0, 'Unreached portion stays empty');
  }
}
console.log('PASS: 0–100% exported geometry stays hollow and continuous, convex 26-point segments, exact R2 preservation except ring shapes/navigation glyphs. Phone rendering pending.');
