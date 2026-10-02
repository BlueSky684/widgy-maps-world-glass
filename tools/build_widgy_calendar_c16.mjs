import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C15.json'),w=structuredClone(base);
function* walk(ns){for(const n of ns){yield n;if(n.z==='13')yield*walk(n['1']);}}
const originals=new Map([...walk(base['1'])].map(n=>[n.d0,n]));
const px=(n,k)=>n[k].a[0].a*(k==='b'||k==='d'?1135:1184)/1600;
const scalar=v=>({a:[{a:Math.round(v*1e6)/1e6,b:168,c:0,d:168}],b:0});
const set=(n,k,v)=>n[k]=scalar(v*1600/(k==='b'||k==='d'?1135:1184));
const condition=(id,op,value)=>({'0':id,'1':op,'2':value});
const locationIds=Object.fromEntries([1,2,3,4].map(i=>[i,w['36'].find(v=>v['1']===`calendar_event_${i}_location`)['0']]));
let next=w.a2;
const changed=new Map(),added=new Set();
const change=(n,keys)=>changed.set(n.d0,[...new Set([...(changed.get(n.d0)||[]),...keys])]);
const stats={version:'C16',screenshot:'IMG_9707.jpeg',reference:'Calendar_Technical_Preview_R2',measuredDateInkHeightPx:27,dateWeightOffsetPx:.55,dateWeightLayers:0,hebrewTitles:0,separators:0,compactTitles:0,details:0,icons:0};
function edit(ns){
 return ns.flatMap(n=>{
  if(n.z==='13')n['1']=edit(n['1']);
  if(n.s==='Calendar · Today Live Date'){
   // The phone now shows 27px visible ink, like adjacent dates. Strengthen
   // only horizontally with the same native-overlay technique as Home R12.
   const overlays=[-.55,.55].map(offset=>{
    const q=structuredClone(n);q.d0=next++;q.s='Calendar · Today Date Weight';
    set(q,'b',px(n,'b')+offset);added.add(q.d0);stats.dateWeightLayers++;return q;
   });
   return [...overlays,n];
  }
  const m=/^Event ([1-4]) · (.*)$/.exec(n.s??'');
  if(!m)return [n];
  const row=Number(m[1]),kind=m[2],top=403+(row-1)*149;
  if(kind==='Hebrew Title'){
   // Phone ink starts 28px inside the old centered title column and 4px
   // below the Latin first-line cap. Retain its proven font and size.
   change(n,['b','c','2']);set(n,'b',803);set(n,'c',px(n,'c')-4);n['2']=scalar(0);stats.hebrewTitles++;
  }else if(kind==='Separator'){
   change(n,['c']);set(n,'c',top+115);stats.separators++;
  }else if(kind==='Title'){
   // With a detail line, use the original R2 one-line-height title slot.
   // With no detail, retain full two-line titles (the phone's holiday case).
   const compact=structuredClone(n);compact.d0=next++;compact.s=`Event ${row} · Title With Detail`;
   set(compact,'e',53.8);compact.o1=condition(locationIds[row],1,'');
   added.add(compact.d0);stats.compactTitles++;
   change(n,['o1']);n.o1=condition(locationIds[row],0,'');
   return [compact,n];
  }else if(kind==='Location'){
   change(n,['b','c','d']);set(n,'b',836);set(n,'c',top+68-.802*px(n,'e'));set(n,'d',248);stats.details++;
  }else if(kind==='Location Icon'||kind.startsWith('Detail Icon ·')){
   change(n,['c','d','e']);set(n,'c',top+49);set(n,'d',20);set(n,'e',20);stats.icons++;
  }
  return [n];
 });
}
w['1']=edit(w['1']);w.a2=next;
assert.equal(stats.dateWeightLayers,190);assert.equal(stats.hebrewTitles,108);
assert.equal(stats.separators,3);assert.equal(stats.compactTitles,4);assert.equal(stats.details,4);assert.equal(stats.icons,96);
const nodes=[...walk(w['1'])];
const ids=nodes.map(n=>n.d0);assert.equal(new Set(ids).size,ids.length);assert(next>Math.max(...ids));
// Every date overlay has the exact same dynamic source, height and vertical
// position; 2-digit dates retain a 62px frame and the original badge center.
for(const group of nodes.filter(n=>/^Calendar · Today Cell /.test(n.s??''))){
 const day=group['1'].find(n=>n.s==='Calendar · Today Live Date');
 const weights=group['1'].filter(n=>n.s==='Calendar · Today Date Weight');
 assert.equal(weights.length,2);
 for(const n of weights)for(const k of ['1','2','66','c','d','e','f'])assert.deepEqual(n[k],day[k]);
 assert(Math.abs((px(weights[0],'b')+px(weights[1],'b'))/2-px(day,'b'))<.000002);
}
// Original R2 row geometry: later rows have 34px top and 36px bottom
// clearance around their 79px accent. First-row clearance is 40px/36px.
for(let i=1;i<=4;i++){
 const top=403+(i-1)*149,bar=nodes.find(n=>n.s===`Event ${i} · Accent`);
 assert(Math.abs(px(bar,'c')-top)<.000002);assert(Math.abs(px(bar,'e')-79)<.000002);
 if(i<4){const rule=nodes.find(n=>n.s===`Event ${i} · Separator`);assert(Math.abs(px(rule,'c')-(top+115))<.000002);}
 const latin=nodes.find(n=>n.s===`Event ${i} · Title`),hebrew=nodes.find(n=>n.s===`Event ${i} · Hebrew Title`);
 assert(Math.abs(px(latin,'b')-px(hebrew,'b'))<.000002);
}
// Restore the explicit whitelist to prove every unrelated value, action,
// native data binding, city source and month badge position is preserved.
const restored=structuredClone(w);
function restore(ns){return ns.filter(n=>!added.has(n.d0)).map(n=>{
 if(n.z==='13')n['1']=restore(n['1']);
 for(const k of changed.get(n.d0)||[]){const old=originals.get(n.d0);if(k in old)n[k]=structuredClone(old[k]);else delete n[k];}
 return n;
});}
restored['1']=restore(restored['1']);restored.a2=base.a2;assert.deepEqual(restored,base);
w['3']='Widgy Home Glass Calendar C16';
w['4']='C16: selected native date retains C15 size and position, strengthened with symmetric +/-0.55px native text overlays. Agenda separators return to R2 top+115; accent bars retain exact R2 positions and 79px height. Hebrew first-line ink shifts left into the Latin column and up 4px. Rows with location use a compact Latin title slot and original R2 secondary-line/icon positions; rows without location retain two-line titles. Dynamic city, sources, navigation and other tabs preserved. Phone rendering verification remains required.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url),JSON.stringify(w));
let page=readFileSync(new URL('./widgy-home-calendar-c15.html',import.meta.url),'utf8').replaceAll('C15','C16').replaceAll('c15','c16');
page=page.replace(/<p>Calendar C16:.*?<\/p>/,'<p>Calendar C16: ספרת היום הודגשה בלי שינוי בגובה או במיקום. קווי ההפרדה בצד ימין הוחזרו למרווחי ההדמיה, והכותרות בעברית יושרו לתחילת הכותרות באנגלית.</p>');
page=page.replace('בדוק שהספרה בעיגול באותו גובה ובאותו קו של שאר הספרות.','בדוק את עובי הספרה, את המרווחים מעל ומתחת לפסי הצבע ואת יישור הכותרות בעברית ובאנגלית.');
writeFileSync(new URL('./widgy-home-calendar-c16.html',import.meta.url),page);
Object.assign(stats,{layers:nodes.length,accentHeightPx:79,separatorOffsetPx:115,accentClearancePx:{firstRow:[40,36],subsequentRows:[34,36]},titleColumnX:803,hebrewShiftPx:{x:-28,y:-4},otherValuesPreserved:true,requiresDeviceVerification:true});
writeFileSync(new URL('../assets/calendar-glass/Calendar_C16_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify(stats,null,2));
