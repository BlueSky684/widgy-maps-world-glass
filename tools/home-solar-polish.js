import assert from 'node:assert/strict';
export function polishHomeSolar(widget){
 const home=widget['1'].find(n=>n.d0===245),nodes=home['1'];
 const get=id=>{const n=nodes.find(n=>n.d0===id);assert(n,`Missing Home node ${id}`);return n;};
 const chrome=get(80309);
 assert(chrome['2'].endsWith('/Home_Glass_Chrome_C8.png'));
 chrome['2']=chrome['2'].replace('Home_Glass_Chrome_C8.png','Home_Glass_Chrome_Solar_R10.png');
 if(typeof chrome['22']==='string')chrome['22']=chrome['22'].replaceAll('Home_Glass_Chrome_C8.png','Home_Glass_Chrome_Solar_R10.png');
 // Visible icon bounds include 2-unit round strokes: [35,93], [1040,1098].
 // Native track spans [214,921]. Center each existing text box in the gap.
 for(const [id,center] of [[6121,(93+214)/2],[6124,(921+1040)/2]]){
  const n=get(id),width=n.d.a[0].a*1135/1600;
  assert.equal(n['2'].a[0].a,1,'Native centered text required');
  n.b.a[0].a=Math.round((center-width/2)*1600/1135*1e6)/1e6;
 }
 return widget;
}
