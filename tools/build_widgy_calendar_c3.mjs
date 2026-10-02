import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {CANVAS} from './calendar_glass_design.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C2.json');
const home=read('./Widgy_Home_Glass_JS_City_R12.json');
const w=structuredClone(base),cal=w['1'].find(n=>n.d0===247);
let next=w.a2;
const id=()=>next++;
const scalar=(v,kind=168)=>({a:[{a:Math.round(v*1e6)/1e6,b:kind,c:0,d:kind}],b:0});
const color=i=>`hexcol_CA1E000000004000A000${String(i).padStart(12,'0')}-100`;
const LIME=color(3),PANEL=color(4);
const cond=(variable,operator,value)=>({'0':variable,'1':operator,'2':String(value)});
function frame(n,[x,y,width,height]){
 for(const [k,v] of Object.entries({b:x/CANVAS.width*1600,c:y/CANVAS.height*1600,d:width/CANVAS.width*1600,e:height/CANVAS.height*1600}))n[k]=scalar(v);
 return n;
}
function variable(name,source,type=0){
 const uid=`CA1E0000-0000-4000-C003-${String(w['36'].length+1).padStart(12,'0')}`;
 w['36'].push({'0':uid,'1':name,'2':type,'3':{z:'1',s:`Variable: ${name}`,'66':[source],d:scalar(800),e:scalar(200)}});
 return uid;
}
function group(name,children,condition){return {d0:id(),z:'13',s:name,'1':children,o1:condition};}
function copy(n){const out=structuredClone(n);out.d0=id();return out;}

// Phenomena contains no Hebrew glyphs. Route Hebrew/mixed-script titles to an
// explicit built-in font at a smaller size; preserve the approved Latin title.
// Native contains/not-contains conditions avoid placing untrusted title strings
// inside JavaScript. The mutually exclusive tree displays exactly one title.
const hebrewLetters=Array.from({length:27},(_,i)=>String.fromCharCode(0x5d0+i));
for(let i=1;i<=4;i++){
 const row=cal['1'].find(n=>n.s===`Agenda · Row ${i}`);
 const title=row['1'].find(n=>n.s===`Event ${i} · Title`);
 const titleValue=variable(`calendar_event_${i}_title`,{'5':'Agenda (Today)','6':`Calendar #${i} - Title`});
 const hebrew=copy(title);hebrew.s=`Event ${i} · Hebrew Title`;hebrew['1']='System Medium';
 hebrew['2']=scalar(2);frame(hebrew,[803,403+(i-1)*149-14.2,280,80]);
 let branch=[title];
 for(const letter of [...hebrewLetters].reverse()){
  branch=[
   group(`Event ${i} · Hebrew ${letter}`,[copy(hebrew)],cond(titleValue,2,letter)),
   group(`Event ${i} · Without ${letter}`,branch,cond(titleValue,3,letter))
  ];
 }
 row['1']=row['1'].flatMap(n=>n===title?branch:[n]);
}

// C2's Calendar color slot 16 did not alter the Today numeral on the device.
// Cover the native badge with an explicit native vector circle and live date.
// One indexed badge is shown, at the same measured cell center, for all 4/5/6
// week month layouts. No private Calendar property is guessed here.
const indexCode='function main(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),1).getDay()+d.getDate()-1;}';
const todayIndex=variable('calendar_today_cell',{'5':'Javascript','6':'Script','10':indexCode},2);
const circleId='CA1E0000-0000-4000-C003-000000000001';
const circleData=Buffer.from(JSON.stringify({items:[{id:circleId,name:'Calendar Today Disc',shape:{rounding:0,points:Array.from({length:96},(_,i)=>({x:.5+.5*Math.cos(i*Math.PI/48),y:.5+.5*Math.sin(i*Math.PI/48)}))}}]})).toString('base64');
const shapeTemplate=home['1'].find(n=>n.d0===245)['1'].find(n=>n.z==='2'&&n['2']&&n['3']);
assert(shapeTemplate);
for(const layout of cal['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''))){
 const count=Number(layout.s.match(/[456]/)[0]);
 const native=layout['1'].find(n=>n.z==='10');delete native['16'];
 const badges=[];
 for(let cell=0;cell<count*7;cell++){
  const cx=48+(cell%7+.5)*554/7,cy=423+(Math.floor(cell/7)+.5)*560/count;
  const circle=copy(shapeTemplate);delete circle.a;delete circle.o1;delete circle.p;
  circle.s='Calendar · Today Disc';circle['2']=circleData;circle['3']=circleId;
  circle.g=LIME;circle.i=scalar(0,861);frame(circle,[cx-31,cy-31,62,62]);
  const cap=31,height=cap/.6,baseline=cy+cap/2;
  const digit=frame({d0:id(),z:'1',s:'Calendar · Today Live Date','1':'HomeGlassTime-Light','2':scalar(1),f:PANEL,'66':[{'5':'Date And Time','6':'d'}]},[cx-31,baseline-.802*height,62,height]);
  badges.push(group(`Calendar · Today Cell ${cell}`,[digit,circle],cond(todayIndex,0,cell)));
 }
 layout['1'].unshift(...badges);
}

w.a2=next;w['3']='Widgy Home Glass Calendar C3';
w['4']='Calendar C3 device-review build: native Hebrew title font with reduced size and right alignment; explicit live-date contrast badge in every 4/5/6-week month. C2 approved location pin, two-line Latin titles, ALL DAY and empty-location rules preserved. Event dots and in-widget month navigation remain pending. Home R12 preserved.';
assert.deepEqual(w['1'].filter(n=>n.d0!==247),home['1'].filter(n=>n.d0!==247));
assert.deepEqual(w['36'].slice(0,base['36'].length),base['36']);
const ids=[];
function walk(n){if(!n||typeof n!=='object')return;if('d0'in n)ids.push(n.d0);for(const v of Object.values(n))if(typeof v==='object')walk(v);}
walk(w['1']);assert.equal(ids.length,new Set(ids).size);assert(w.a2>Math.max(...ids));
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C3.json',import.meta.url),JSON.stringify(w));
console.log(JSON.stringify({name:w['3'],homePreserved:true,layers:ids.length,newVariables:w['36'].length-base['36'].length,deviceReviewRequired:['Hebrew sizing','Today badge alignment'],pending:['event dots','in-widget month navigation']}));
