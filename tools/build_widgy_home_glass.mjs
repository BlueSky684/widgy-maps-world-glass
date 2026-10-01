import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {REFERENCE,COLORS,HERO,DAY_BAR,STEPS_RING,BOXES} from './home_glass_design.mjs';
const read=n=>JSON.parse(readFileSync(new URL(n,import.meta.url),'utf8'));
const before=read('./widgy-home-f50-data.json'), widget=structuredClone(before);
const home=widget['1'].find(n=>n.d0===245);
const layer=id=>{const n=home['1'].find(n=>n.d0===id);assert(n,`Missing ${id}`);return n;};
const round=n=>Math.round(n*1e6)/1e6;
const value=(n,k)=>n[k]?.a?.[0]?.a??0;
const scalar=(a,b=168)=>({a:[{a:round(a),b,c:0,d:b}],b:0});
function frame(n,[x,y,w,h]) {
  for(const [k,a] of Object.entries({b:x/REFERENCE.width*1600,c:y/REFERENCE.height*1600,d:w/REFERENCE.width*1600,e:h/REFERENCE.height*1600})) {
    n[k] ||= scalar(0);n[k].a[0].a=round(a);
  }
  return n;
}
const text=s=>({'5':'Custom Text','6':'Text','25':s});
const source=(c,f)=>({'5':c,'6':f});
const script=s=>({'5':'Javascript','6':'Script','10':s});
const ids={steps:'AD5D21AF-E1F3-486C-A001-000000000001',goal:'AD5D21AF-E1F3-486C-A001-000000000002',progress:'AD5D21AF-E1F3-486C-A001-000000000003'};
const newColors={};
for(const [i,[name,color]] of Object.entries(COLORS).entries()) {
  const key=`hexcol_0C70EACC00004000A000${String(i+1).padStart(12,'0')}`;
  widget['2'].push(`${key}-${color.slice(1).toUpperCase()}FF`);newColors[name]=`${key}-100`;
}
const oldLime=layer(6102).f, oldCard=layer(6160).g;
function visit(n,fn){fn(n);if(n.z==='13')n['1'].forEach(c=>visit(c,fn));}
visit(home,n=>{for(const k of ['f','g']) {if(n[k]===oldLime)n[k]=newColors.lime;if(n[k]===oldCard)n[k]=newColors.card;}});

for(const [id,box] of Object.entries(BOXES))frame(layer(Number(id)),box);
// Static surfaces/ornaments are drawn once in the lossless production chrome.
for(const id of [5007,5008,5009,5010,5011,5014,6120,6125,6151,6152,6153,6160,6161,6162,6163,6171])layer(id).a=false;
layer(5001).g='uicol_black-100';
layer(6193)['3']='figure.walk';layer(6193).f=newColors.white;
layer(6142)['66']=[text('steps')];
layer(6133)['66']=[source('Weather (Now)','Max. Temperature Today')];
layer(6134)['66']=[source('Weather (Now)','Min. Temperature Today')];
layer(6133)['1']=layer(6134)['1']='BarlowCondensed-Light';
layer(6191)['3']='calendar';

// Preserve every approved weather glyph/contour and every visibility rule.
// Apply one uniform physical scale and translation to all leaf layers.
const weatherScale=1.22, originalCenter={x:179.4*1134/1600,y:1194.8*1182/1600},target={x:122,y:920};
for(const group of home['1'].filter(n=>n.s?.startsWith('WX ·')))visit(group,n=>{
  if(n.z==='13')return;
  const box=[value(n,'b')*1134/1600,value(n,'c')*1182/1600,value(n,'d')*1134/1600,value(n,'e')*1182/1600];
  frame(n,[target.x+(box[0]-originalCenter.x)*weatherScale,target.y+(box[1]-originalCenter.y)*weatherScale,box[2]*weatherScale,box[3]*weatherScale]);
});

// Keep the existing calendar demo's content, while matching its colored typography.
// Calendar data integration is a separate pending task; never bake in new events.
const summary=layer(6111),summaryParts=[
  ['3',[124,527,22,58],newColors.lime,'Phenomena-Bold'],
  ['events •',[152,527,122,58],newColors.white,'BarlowCondensed-Light'],
  ['2',[281,527,22,58],newColors.lime,'Phenomena-Bold'],
  ['reminders today',[306,527,236,58],newColors.white,'BarlowCondensed-Light'],
];
const parts=summaryParts.map(([content,box,color,font],i)=>{
  const n=structuredClone(summary);n.d0=i?widget.a2++:6111;n.s=`Events Summary · ${i+1}`;
  n['66']=[text(content)];n.f=color;n['1']=font;return frame(n,box);
});
home['1'].splice(home['1'].indexOf(summary),1,...parts);

function variable(name,id,type,entries){
  const body=structuredClone(widget['36'][0]['3']);body['66']=entries;body.s=`Variable: ${name}`;
  return {'0':id,'1':name,'2':type,'3':body};
}
widget['36'].push(
  variable('steps_today',ids.steps,2,[source('Pedometer','Steps')]),
  variable('steps_goal',ids.goal,2,[text(String(STEPS_RING.goal))]),
  variable('steps_progress',ids.progress,2,[script(`function main() {
    var raw = String('${'${widgy.steps_today}'}').trim();
    var target = String('${'${widgy.steps_goal}'}').trim();
    if (!raw || !target || raw.indexOf('$'+'{') !== -1 || target.indexOf('$'+'{') !== -1) return -1;
    var count = Number(raw.replace(/,/g, '')), goal = Number(target.replace(/,/g, ''));
    if (!isFinite(count) || count < 0 || !isFinite(goal) || goal <= 0) return -1;
    return Math.min(100, Math.max(0, Math.floor(count / goal * 100)));
  }`)])
);
// Native number binding avoids a second label script and removes the repeated unit.
layer(6141)['66']=[text('${widgy.steps_today}')];

let shapeTemplate;
visit(home,n=>{if(!shapeTemplate&&n.z==='2'&&n['2']&&n['3'])shapeTemplate=n;});
assert(shapeTemplate);
function contour(node,box,points,color){
  const n=structuredClone(shapeTemplate),id=node?.d0??widget.a2++;
  n.d0=id;n.s=node?.s??'Glass shape';delete n.a;delete n.o1;delete n.p;
  const uuid=`0C70EACC-0000-4000-A000-${String(id).padStart(12,'0')}`;
  n['3']=uuid;n['2']=Buffer.from(JSON.stringify({items:[{id:uuid,name:n.s,shape:{rounding:0,points:points.map(([x,y])=>({x:round(x),y:round(y)}))}}]})).toString('base64');
  n.i=scalar(0,861);n.g=color;frame(n,box);return n;
}
function capsule(width,height){
  const r=Math.min(width/2,height/2),out=[];
  for(const [cx,cy,a] of [[width-r,r,-90],[width-r,height-r,0],[r,height-r,90],[r,r,180]])
    for(let i=0;i<=8;i++){const t=(a+i*90/8)*Math.PI/180;out.push([(cx+r*Math.cos(t))/width,(cy+r*Math.sin(t))/height]);}
  return out;
}
for(let i=0;i<home['1'].length;i++){
  const n=home['1'][i];if(!n.s?.startsWith('Day Progress Fill'))continue;
  const percent=Number(n.o1['2']),w=DAY_BAR.width*percent/100;
  const replacement=contour(n,[DAY_BAR.x,DAY_BAR.y,w,DAY_BAR.height],capsule(w,DAY_BAR.height),newColors.bar);
  replacement.o1=structuredClone(n.o1);home['1'][i]=replacement;
}
function arc(percent){
  const a0=-Math.PI/2,a1=a0+2*Math.PI*percent/100,r=STEPS_RING.radius,t=STEPS_RING.stroke/2,c=71,out=[];
  const p=(x,y)=>out.push([(c+x)/142,(c+y)/142]);
  const segments=Math.max(2,Math.ceil(percent*1.2));
  for(let i=0;i<=segments;i++){const a=a0+(a1-a0)*i/segments;p((r+t)*Math.cos(a),(r+t)*Math.sin(a));}
  if(percent<100)for(let i=1;i<=12;i++){const a=a1+Math.PI*i/12;p(r*Math.cos(a1)+t*Math.cos(a),r*Math.sin(a1)+t*Math.sin(a));}
  for(let i=segments;i>=0;i--){const a=a0+(a1-a0)*i/segments;p((r-t)*Math.cos(a),(r-t)*Math.sin(a));}
  if(percent<100)for(let i=1;i<=12;i++){const a=a0+Math.PI+Math.PI*i/12;p(r*Math.cos(a0)+t*Math.cos(a),r*Math.sin(a0)+t*Math.sin(a));}
  return out;
}
const arcs=[];
for(let percent=100;percent>=1;percent--){
  const n=contour(null,[STEPS_RING.x,STEPS_RING.y,142,142],arc(percent),newColors.lime);
  n.s=`Steps Goal Ring · ${percent}%`;n.o1={'0':ids.progress,'1':5,'2':String(percent)};arcs.push(n);
}
home['1'].splice(home['1'].indexOf(layer(6193))+1,0,...arcs);

const origin=process.argv[2];assert(origin,'Pass the verified F50 deployment origin');
const host=new URL(origin);assert(host.protocol==='https:'&&host.pathname==='/'&&!host.search&&!host.hash);
const map=layer(6170);
frame(map,[HERO.x,HERO.y,HERO.width,HERO.height]);
const endpoint=host.origin+'/api/night-map?mode=live&width=3306&presentation=glass';
map['2']=endpoint+'&lat=31.8&lon=34.6&city=Ashdod';
map['22']=`function main() {
  var latitude = String('${'${widgy.Latitude}'}').trim();
  var longitude = String('${'${widgy.Longitude}'}').trim();
  var city = String("${'${widgy.City}'}").trim();
  var url = '${endpoint}';
  var lat = Number(latitude), lon = Number(longitude);
  if (latitude && longitude && isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    url += '&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon);
    if (city && city.indexOf('$'+'{') === -1) url += '&city=' + encodeURIComponent(city);
  }
  return url + '&t=' + Date.now();
}`;
const chrome=structuredClone(map);chrome.d0=widget.a2++;chrome.s='Approved Glass · Chrome and Frames';
chrome['2']=host.origin+'/assets/home-glass/Home_Glass_Chrome.png?v=1';
chrome['22']=`function main() { return '${chrome['2']}'; }`;
frame(chrome,[0,0,REFERENCE.width,REFERENCE.height]);
home['1'].splice(home['1'].indexOf(map),0,chrome);
widget['3']='Widgy Home Glass';
widget['4']='Approved glass reference layout, measured from 7B498FAE-FA8F-4E28-9BDB-075E5E20749B(8).jpeg. Lossless glass chrome, rounded cards, native live text and dynamic progress ring. Steps goal defaults to 10000 and can be changed in Variables > steps_goal. F50 terrain, lights and map raster resolution remain unchanged. Device-local daylight and DST, Health (Daily) calories and weather bindings preserved. Clock remains native 24-hour System Light and weather uses the existing device units. Larger current-location marker and label. Calendar content is still demo data. Native iPhone layout review required.';
const output=new URL('./Widgy_Home_Glass.json',import.meta.url);
writeFileSync(output,JSON.stringify(widget));
console.log(JSON.stringify({output:output.pathname,name:widget['3'],bytes:Buffer.byteLength(JSON.stringify(widget)),stepsGoal:STEPS_RING.goal}));
