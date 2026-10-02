import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {CANVAS,calendarChromeSVG} from './calendar_glass_design.mjs';

const require=createRequire(import.meta.url);
const sharp=require('sharp');

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C1.json');
const home=read('./Widgy_Home_Glass_JS_City_R12.json');
const w=structuredClone(base),cal=w['1'].find(n=>n.d0===247);
let next=w.a2;
const id=()=>next++;
const scalar=v=>({a:[{a:Math.round(v*1e6)/1e6,b:168,c:0,d:168}],b:0});
const color=i=>`hexcol_CA1E000000004000A000${String(i).padStart(12,'0')}-100`;
const WHITE=color(1),MUTED=color(2),PANEL=color(4),WEEK=color(6);
const cond=(variable,operator,value)=>({'0':variable,'1':operator,'2':value});
function frame(n,[x,y,width,height]){
 for(const [k,v] of Object.entries({b:x/CANVAS.width*1600,c:y/CANVAS.height*1600,d:width/CANVAS.width*1600,e:height/CANVAS.height*1600}))n[k]=scalar(v);
 return n;
}
function variable(name,field){
 const uid=`CA1E0000-0000-4000-B002-${String(w['36'].length+1).padStart(12,'0')}`;
 w['36'].push({'0':uid,'1':name,'2':0,'3':{z:'1',s:`Variable: ${name}`,'66':[{'5':'Agenda (Today)','6':field}],d:scalar(800),e:scalar(200)}});
 return uid;
}
function duplicate(n){const out=structuredClone(n);out.d0=id();return out;}
function group(name,children,condition){return {d0:id(),z:'13',s:name,'1':children,o1:condition};}
function shape(name,box,fill){return frame({d0:id(),z:'2',s:name,g:fill},box);}
function label(name,value,box,font='HomeGlassTime-Light',fill=WHITE){
 return frame({d0:id(),z:'1',s:name,'1':font,f:fill,'66':[{'5':'Custom Text','6':'Text','25':value}]},box);
}

// Use the exact filled location-pin path from the approved Calendar R2 preview.
// The native SF Symbol "mappin" rendered as a thin pushpin on the device.
const locationPin='<path d="M12 22C10 19 3 13 3 9a9 9 0 0 1 18 0c0 4-7 10-9 13Z M12 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z" fill="#aeb7c6" fill-rule="evenodd" transform="translate(53 177) scale(1.0833333333333333)"/>';
const chromeSVG=calendarChromeSVG().replace('</svg>',locationPin+'</svg>');
writeFileSync(new URL('../assets/calendar-glass/Calendar_Glass_Chrome_C2.svg',import.meta.url),chromeSVG);
await sharp(Buffer.from(chromeSVG)).resize(2268,2366).withIccProfile('srgb').png({compressionLevel:9}).toFile(new URL('../assets/calendar-glass/Calendar_Glass_Chrome_C2.png',import.meta.url).pathname);
cal['1']=cal['1'].filter(n=>n.s!=='Calendar Location Icon');
const chrome=cal['1'].find(n=>n.s==='Calendar R2 · Static Chrome');
const chromeURL='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/calendar-glass/Calendar_Glass_Chrome_C2.png';
chrome['2']=chromeURL;chrome['22']=`function main(){return '${chromeURL}';}`;

for(let i=1;i<=4;i++){
 const row=cal['1'].find(n=>n.s===`Agenda · Row ${i}`);
 const top=403+(i-1)*149;
 const location=variable(`calendar_event_${i}_location`,`Calendar #${i} - Location`);
 const start=variable(`calendar_event_${i}_start`,`Calendar #${i} - Start Time`);
 const end=variable(`calendar_event_${i}_end`,`Calendar #${i} - End Time`);
 const title=row['1'].find(n=>n.s===`Event ${i} · Title`);
 // Native line-mode configuration; C2's two-line rendering is subject to the
 // same device review as the Calendar layer. Never inject event titles in JS.
 title['3']=scalar(3);
 frame(title,[803,top-14.2,280,107.6]);
 const loc=row['1'].find(n=>n.s===`Event ${i} · Location`);
 frame(loc,[830,top+83.25,254,35.84]);
 const pin=row['1'].find(n=>n.s===`Event ${i} · Location Icon`);
 frame(pin,[804,top+93,18,21]);
 pin.o1=cond(location,1,'');
 loc.o1=cond(location,1,'');
 const accent=row['1'].find(n=>n.s===`Event ${i} · Accent`);
 frame(accent,[670,top,5,108]);
 const separator=row['1'].find(n=>n.s===`Event ${i} · Separator`);
 if(separator)frame(separator,[668,top+129,417,.7]);

 const times=row['1'].filter(n=>n.s===`Event ${i} · Start`||n.s===`Event ${i} · End`);
 row['1']=row['1'].filter(n=>!times.includes(n));
 // The exact 24-hour range was observed in IMG_9675. Other ranges retain the
 // native start/end text. This is a display rule, not an inferred EventKit flag.
 const zero='0:00',last='23:59';
 row['1'].push(group(`Event ${i} · Timed`,times.map(duplicate),cond(start,1,zero)));
 row['1'].push(group(`Event ${i} · Starts Midnight`,[
  group(`Event ${i} · Midnight Timed`,times.map(duplicate),cond(end,1,last)),
  group(`Event ${i} · Full Day`,[
   label(`Event ${i} · All Day Label`,'ALL DAY',[694,top,92,35])
  ],cond(end,0,last))
 ],cond(start,0,zero)));
}

for(const layout of cal['1'].filter(n=>/^Calendar · [456] Week Layout$/.test(n.s??''))){
 const native=layout['1'].find(n=>n.z==='10');
 // Today Color: keep the numeral legible on the lime Today Symbol.
 // Native Calendar export color slots are exercised in C1/C2 device review.
 native['16']=PANEL;
 // Cover the native white spacer at the known y=423 boundary, then paint the
 // approved subtle line above it. Keep every date and header label untouched.
 layout['1'].unshift(
  shape('Calendar · Subtle Header Rule',[48,422.65,554,.7],WEEK),
  shape('Calendar · Native Spacer Cover',[47.5,420.5,555,5],PANEL)
 );
}

w.a2=next;
w['3']='Widgy Home Glass Calendar C2';
w['4']='Calendar C2 device-review build: approved filled location pin, two-line event titles, location only when present, ALL DAY for the observed 0:00-23:59 range, subdued calendar divider and dark Today text. Native event indicators and month navigation remain pending. Home R12 preserved.';
assert.deepEqual(w['1'].filter(n=>n.d0!==247),home['1'].filter(n=>n.d0!==247));
assert.deepEqual(w['36'].slice(0,base['36'].length),base['36']);
const ids=[];
function walk(n){if(!n||typeof n!=='object')return;if('d0'in n)ids.push(n.d0);for(const v of Object.values(n))if(typeof v==='object')walk(v);}
walk(w['1']);assert.equal(ids.length,new Set(ids).size);assert(w.a2>Math.max(...ids));
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C2.json',import.meta.url),JSON.stringify(w));
console.log(JSON.stringify({name:w['3'],homePreserved:true,uniqueLayers:ids.length,newVariables:w['36'].length-base['36'].length,deviceReviewRequired:['title line mode','Today numeral color'],pending:['native event dots','in-widget month navigation']}));
