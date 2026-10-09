import assert from 'node:assert/strict';
import {flatten} from './compact-widget-structure.js';

export const VECTOR_RUNS=[
 {parent:80027,ids:[77102,77105,77108],name:'Light Rain · Shared original strokes'},
 {parent:80026,ids:[77202,77205,77208,77211],name:'Heavy Rain · Shared original strokes'},
 {parent:80038,ids:[79401,79402],name:'Fog · Shared original lines'},
 {parent:245,ids:[80310,80311],name:'Calendar navigation · Shared bindings'},
 {parent:247,ids:[80320,80321],name:'Calendar navigation · Shared bindings'},
];
export function compactHomeVectors(w){
 const nodes=new Map(flatten(w['1']).map(n=>[n.d0,n])),changes=[];
 const targeted=new Set([...nodes.values()].flatMap(n=>n['1a']?.startsWith('button_')?n['1a'].slice(7).split(/[-,]/).map(Number):[]));
 const val=(n,k)=>{assert.equal(n[k]?.b,0);assert.equal(n[k]?.a?.length,1);assert.equal(typeof n[k].a[0].a,'number');return n[k].a[0].a;};
 const set=(n,k,v)=>{n[k]=structuredClone(n[k]);n[k].a[0].a=v;};
 for(const {parent,ids,name}of VECTOR_RUNS){
  const group=nodes.get(parent),old=ids.map(id=>nodes.get(id)),index=group['1'].indexOf(old[0]);
  assert(index>=0&&old.every((n,i)=>group['1'][index+i]===n));
  const allowed=new Set(['z','s','d0','1','2','3','b','c','d','e','g']);
  const polygons=old.map(n=>{
   assert(n.z==='2'&&!targeted.has(n.d0)&&Object.keys(n).every(k=>allowed.has(k)));
   assert.equal(n.g,old[0].g);assert.deepEqual(n['1'],old[0]['1']);
   const lib=JSON.parse(Buffer.from(n['2'],'base64')),item=lib.items.find(i=>i.id===n['3']);
   assert.equal(lib.items.length,1);assert.equal(item.shape.rounding,0);
   assert.deepEqual(Object.keys(item.shape).sort(),['points','rounding']);
   return item.shape.points.map(p=>({x:val(n,'b')+p.x*val(n,'d'),y:val(n,'c')+p.y*val(n,'e')}));
  });
  // Disjoint source frames avoid changing overlap/coverage semantics.
  for(let i=0;i<old.length;i++)for(let j=i+1;j<old.length;j++){
   const a=old[i],b=old[j];assert(val(a,'b')+val(a,'d')<=val(b,'b')||val(b,'b')+val(b,'d')<=val(a,'b')||val(a,'c')+val(a,'e')<=val(b,'c')||val(b,'c')+val(b,'e')<=val(a,'c'));
  }
  const left=Math.min(...old.map(n=>val(n,'b'))),top=Math.min(...old.map(n=>val(n,'c')));
  const right=Math.max(...old.map(n=>val(n,'b')+val(n,'d'))),bottom=Math.max(...old.map(n=>val(n,'c')+val(n,'e')));
  const width=right-left,height=bottom-top,anchor=polygons[0][0],points=[];
  for(const polygon of polygons)points.push(anchor,...polygon,polygon[0],anchor);
  const n=structuredClone(old[0]),id='CA1E0000-0000-4000-E021-'+String(n.d0).padStart(12,'0');
  n.s=name;n['3']=id;n['2']=Buffer.from(JSON.stringify({items:[{id,name,shape:{rounding:0,points:points.map(p=>({x:(p.x-left)/width,y:(p.y-top)/height}))}}]})).toString('base64');
  set(n,'b',left);set(n,'c',top);set(n,'d',width);set(n,'e',height);
  group['1'].splice(index,old.length,n);changes.push({parent,kept:n.d0,removed:ids.slice(1)});
 }
 return changes;
}
