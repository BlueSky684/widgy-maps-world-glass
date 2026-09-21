import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const before=JSON.parse(read('widgy-home-v24-source.json'));
const master=JSON.parse(read('widgy-v105.json'));
const data=structuredClone(before),layers=data['1'][0]['1'];
const source=master['1'][0]['1'];
const profiles=[
 ['Clear Day',[7002],135,370],
 ['Partly Cloudy Day',[7302,7303,7053,7001],352.5,370],
 ['Cloudy',[7003],567.5,370],
 ['Light Rain',[76800,77102,77105,77108],783.5,370],
 ['Heavy Rain',[76801,77202,77205,77208,77211],999.5,370],
 ['Clear Night',[7009],91.5,754.5],
 ['Partly Cloudy Night',[7010,79001,79002,7011],281.5,754.5],
 ['Thunderstorm',[79101,79102,79201,79202,7006],471.5,754.5],
 ['Snow',[7012,7013,7014,7015],662,754.5],
 ['Fog',[79401,79402,79403,7007],851.5,754.5],
 ['Wind',[7008],1041.5,754.5]
];
const sx=1134/1600,sy=1182/1600;
const iconIndex=layers.findIndex(l=>l.d0===6192);assert(iconIndex>=0);
const original=layers[iconIndex],v=(l,k)=>l[k]?.a[0].a??0;
const cx=v(original,'b')+v(original,'d')/2;
const cy=v(original,'c')+v(original,'e')/2;
const scale=v(original,'d')*sx/125;
const frame=n=>({a:[{a:n,b:1301,c:0,d:1301}],b:0});
const report={status:'setup-only; native condition binding required',source:'v105',target:'Home v24',scale,targetCenter:{x:cx,y:cy},groups:[]};
const groups=profiles.map(([name,ids,px,py],i)=>{
 const children=source.filter(l=>ids.includes(l.d0)).map(l=>{
  const n=structuredClone(l);
  n.b.a[0].a=cx+(v(l,'b')-px/sx)*scale;
  n.c.a[0].a=cy+(v(l,'c')-py/sy)*scale;
  n.d.a[0].a*=scale;n.e.a[0].a*=scale;
  // Every child uses exactly the same affine transform; contours and masks are untouched.
  const restored=structuredClone(n);
  for(const k of ['b','c','d','e'])restored[k]=l[k];
  assert.deepEqual(restored,l);
  assert(Math.abs(v(n,'d')/v(n,'e')-v(l,'d')/v(l,'e'))<1e-10);
  assert(v(n,'b')>60&&v(n,'b')+v(n,'d')<310);
  assert(v(n,'c')>1035&&v(n,'c')+v(n,'e')<1275);
  return n;
 });
 assert.equal(children.length,ids.length);
 const group={d0:80000+i,z:'13',s:`WX · ${name}`,d:frame(1600),e:frame(1600),'1':children};
 // Explicitly a setup file, not a working live selector. One preview is visible.
 if(i!==0)group.a=false;
 report.groups.push({id:group.d0,name,children:children.map(l=>l.d0)});
 return group;
});
layers.splice(iconIndex,1,...groups);
// No hidden/visible state changes elsewhere, including navigation groups.
const restored=structuredClone(data);
restored['1'][0]['1'].splice(iconIndex,groups.length,original);
assert.deepEqual(restored,before);
const ids=[];function walk(ls){for(const l of ls){ids.push(l.d0);if(l.z==='13')walk(l['1']);}}walk(data['1']);
assert.equal(new Set(ids).size,ids.length);
assert.deepEqual(source.filter(l=>l.a!==false&&l.d0!==5001).map(l=>l.d0).sort((a,b)=>a-b),profiles.flatMap(p=>p[1]).sort((a,b)=>a-b));
data.a2=80011;
data['3']='Widgy Home v106 - Native Weather Setup';
data['4']='Prepared native v105 icon groups at the Home weather position with one common scale preserving optical size balance. Setup only: Clear Day is a static preview. Automatic weather/day-night visibility is NOT configured. Requires a native Widgy conditional-visibility export before live integration. All other Home layers and navigation screens are unchanged from v24.';
const payload=JSON.stringify(data),packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
write('widgy-v106.json',payload);
let html=read('widgy-v105.html').replaceAll('v105','v106')
 .replace('איזון עדין — הירח הבודד','הכנת חיבור מזג האוויר')
 .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
 .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
 .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
 .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
html=html.replace('</h1>','</h1><p>קובץ הכנה: המעבר האוטומטי בין האייקונים טרם חובר.</p>');
write('widgy-v106.html',html);
write('widgy-v106-integration.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({groups:groups.length,children:profiles.flatMap(p=>p[1]).length,payloadLength:payload.length,sha256:hash,status:report.status}));
