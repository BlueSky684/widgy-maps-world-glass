import fs from 'node:fs';
const fonts = JSON.parse(fs.readFileSync(new URL('../assets/weather-premium/glyphs.json', import.meta.url)));
const nativeRunner = JSON.parse(fs.readFileSync(new URL('../assets/health-premium/native-figure-run.json', import.meta.url)));
// The approved technical drawing, without sample readings in shipped artwork.
export function healthScene(values = null) {
const C = {white:'#f4f7fa', muted:'#acb7c6', dim:'#8596a2', lime:'#c5ff0a', pink:'#ff2b80', cyan:'#15cbea', purple:'#b49aff', line:'#30434e'};
const p=[];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const bounds=[];
function tw(s,cap,weight='Regular') {const f=fonts[weight], a=[...s]; return a.reduce((n,c,i)=>n+f.glyphs[c].advance+(i?f.kern[a[i-1]+c]||0:0),0)*cap/f.cap;}
function text(s,x,y,cap=22,color=C.white,weight='Regular',anchor='start',max=Infinity) {
  s=String(s); const f=fonts[weight], a=[...s];
  for(const c of a) if(!f.glyphs[c]) throw new Error('Unsupported glyph '+c);
  const w=tw(s,cap,weight), scale=Math.min(1,max/w), k=cap/f.cap*scale;
  let at=x-(anchor==='middle'?w*scale/2:anchor==='end'?w*scale:0);
  bounds.push({s,x:at,y:y-cap*scale,w:w*scale,h:cap*scale});
  p.push(`<g fill="${color}" aria-label="${esc(s)}"><title>${esc(s)}</title>`);
  for(let i=0;i<a.length;i++){at+=(i?f.kern[a[i-1]+a[i]]||0:0)*k; p.push(`<path d="${f.glyphs[a[i]].path}" transform="translate(${at} ${y}) scale(${k} ${-k})"/>`); at+=f.glyphs[a[i]].advance*k;}
  p.push('</g>');
}
const rect=(x,y,w,h,r,fill,stroke='',sw=1)=>p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${stroke?`stroke="${stroke}" stroke-width="${sw}"`:''}/>`);
const line=(x1,y1,x2,y2,color=C.line,w=1)=>p.push(`<path d="M${x1} ${y1}H${x2}" ${y1!==y2?`transform="matrix(1 ${(y2-y1)/(x2-x1||1)} 0 1 0 ${-x1*(y2-y1)/(x2-x1||1)})"`:''} fill="none" stroke="${color}" stroke-width="${w}"/>`);
const vline=(x,y1,y2,color=C.line,w=1)=>p.push(`<path d="M${x} ${y1}V${y2}" stroke="${color}" stroke-width="${w}"/>`);
function icon(kind,x,y,size,color){
  p.push(`<g transform="translate(${x-size/2} ${y-size/2}) scale(${size/48})" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">`);
  if(kind==='heart')p.push(`<path d="M24 41C19 37 4 28 4 16C4 5 18 3 24 13C30 3 44 5 44 16C44 28 29 37 24 41Z" fill="${color}" stroke="none"/>`);
  if(kind==='moon')p.push(`<defs><mask id="sleep-crescent" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48"><rect width="48" height="48" fill="white" stroke="none"/><circle cx="31" cy="18" r="17.97641556" fill="black" stroke="none"/></mask></defs><circle cx="24" cy="24" r="19" mask="url(#sleep-crescent)" fill="${color}" stroke="none"/>`);
  if(kind==='runner'){const [x0,y0,x1,y1]=nativeRunner.bounds,s=43/(y1-y0);p.push(`<g transform="translate(24 24) scale(${s}) translate(${-(x0+x1)/2} ${-(y0+y1)/2})"><path d="${nativeRunner.path}" fill="${color}" stroke="none" fill-rule="evenodd"/></g>`);}
  if(kind==='home')p.push(`<path d="M3 22L24 4L45 22M10 20V43H38V20M32 10V5H39V16"/><path d="M20 43V31H28V43" fill="${color}"/>`);
  if(kind==='calendar')p.push(`<rect x="7" y="9" width="34" height="34" rx="3"/><path d="M7 19H41M15 4V14M33 4V14"/><path d="M15 26h1m7 0h1m7 0h1m-17 8h1m7 0h1m7 0h1" stroke-width="3.5"/>`);
  if(kind==='flame')p.push(`<path d="M24 3C27 15 42 20 38 32C36 43 22 47 14 39C5 29 12 19 17 14C16 21 20 22 22 21C26 18 25 9 24 3Z" fill="${color}" stroke="none"/>`);
  p.push('</g>');
}
function pair(n,u,cx,baseline,cap=34,unitCap=23,color=C.white){const nw=tw(n,cap,'Bold'), uw=tw(u,unitCap), gap=6;const x=cx-(nw+uw+gap)/2;text(n,x,baseline,cap,color,'Bold');text(u,x+nw+gap,baseline,unitCap,C.muted);}
function detail(label,n,u,cx,baseline){const lw=tw(label,17),nw=tw(n,23,'Bold'),uw=tw(u,17),x=cx-(lw+nw+uw+14)/2;text(label,x,baseline,17,C.muted);text(n,x+lw+9,baseline,23,C.white,'Bold');text(u,x+lw+nw+14,baseline,17,C.muted);}
function card(x,y,w,h,r=25){rect(x,y,w,h,r,'url(#panel)',C.line,1.35);rect(x+1.4,y+1.4,w-2.8,h-2.8,r-1.4,'none','#b9d2df',.3);}
function ring(cx,cy,r,frac,color,grad){p.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" opacity=".17" stroke-width="16"/>`); const circ=2*Math.PI*r;p.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${grad})" stroke-width="16" stroke-linecap="round" stroke-dasharray="${circ*frac} ${circ}" transform="rotate(-90 ${cx} ${cy})"/>`);}
const fields=[],rings=[],bars=[];
const sx=1086/1071,tx=24-32*sx,ty=20;
function live(key,sample,x,y,cap=24,color=C.white,weight='Regular',anchor='middle',width=200){
  fields.push({key,x:x*sx+tx,y:y+ty,cap,color,weight,anchor,width:width*sx});
  if(values)text(values[key]??sample,x,y,cap,color,weight,anchor,width);
}
p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="2270" height="2368" viewBox="0 0 1135 1184"><title>Widgy Health native layer artwork</title><defs>
<linearGradient id="outer" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#1a2831"/><stop offset=".35" stop-color="#0d1920"/><stop offset="1" stop-color="#080f14"/></linearGradient>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#adc6d5" stop-opacity=".88"/><stop offset=".3" stop-color="#536874" stop-opacity=".65"/><stop offset=".7" stop-color="#31434e"/><stop offset="1" stop-color="#7a8f9d" stop-opacity=".65"/></linearGradient>
<linearGradient id="panel" x2=".8" y2="1"><stop stop-color="#0d1a22"/><stop offset="1" stop-color="#091218"/></linearGradient>
<linearGradient id="glass" x2="0" y2="1"><stop stop-color="#9cbfd1" stop-opacity=".09"/><stop offset="1" stop-color="#9cbfd1" stop-opacity="0"/></linearGradient>
<linearGradient id="pinkRing"><stop stop-color="#ff146c"/><stop offset="1" stop-color="#ff4c96"/></linearGradient>
<linearGradient id="limeRing"><stop stop-color="#9bdf00"/><stop offset="1" stop-color="#d0ff25"/></linearGradient>
<linearGradient id="cyanRing"><stop stop-color="#00a9d1"/><stop offset="1" stop-color="#38d7ed"/></linearGradient>
<linearGradient id="bar"><stop stop-color="#8bd322"/><stop offset="1" stop-color="#ccff39"/></linearGradient>
<radialGradient id="healthGlow"><stop stop-color="#c5ff0a" stop-opacity=".1"/><stop offset="1" stop-color="#c5ff0a" stop-opacity="0"/></radialGradient>
<clipPath id="shell"><rect x="3" y="3" width="1129" height="1178" rx="83"/></clipPath></defs>`);
rect(3,3,1129,1178,83,'url(#outer)','url(#rim)',2.2);
rect(5,5,1125,1174,81,'none','#a5c4d0',.35);
p.push('<g clip-path="url(#shell)"><ellipse cx="220" cy="40" rx="680" ry="305" fill="url(#glass)"/></g>');
text('HEA',44,124,72,C.white,'Bold');text('LTH',44+tw('HEA',72,'Bold')-1,124,72,C.lime,'Bold');
if(values){text('SATURDAY',907,79,28,C.white,'Bold','middle');text('OCTOBER',907,120,28,C.muted,'Regular','middle');text('10',1051,130,89,C.lime,'Bold','middle');vline(993,53,129);}
p.push(`<g transform="translate(${tx} ${ty}) scale(${sx} 1)">`);
card(32,130,1071,70,20);icon('runner',72,165,33,C.muted);text('Activity & Health',109,175,27);
live('date','Saturday, 10 October 2026',1078,175,27,C.muted,'Regular','end',575);
card(32,212,1071,210);
for(const[key,r,color,grad,frac]of [['move',77,C.pink,'pinkRing',.7],['exercise',56,C.lime,'limeRing',.7],['stand',35,C.cyan,'cyanRing',10/12]]){
  p.push(`<circle cx="161" cy="317" r="${r}" fill="none" stroke="${color}" opacity=".17" stroke-width="16"/>`);
  rings.push({key,x:161*sx+tx,y:337,r,color,width:16,sx});
  if(values)ring(161,317,r,Number(values[key+'Progress']??frac),color,grad);
}
live('steps','7,842',276,334,87,C.white,'Bold','start',242);
text('Steps',278,374,32,C.muted);text('DAILY GOAL 10,000',278,401,15,C.dim);
vline(541,236,398,C.line,1.3);line(560,317,1077,317);vline(729,242,304);vline(910,242,304);vline(729,334,397);vline(910,334,397);
for(const[label,key,x,sample]of [['Active Calories','calories',635,'420 kcal'],['Distance','distance',817,'5.6 km'],['Exercise','exercise',997,'42 min']]){text(label,x,260,21,C.muted,'Regular','middle');live(key,sample,x,299,31,C.white,'Bold','middle',157);}
for(const[label,key,x,sample]of [['Stand','stand',635,'10 hr'],['Step Goal','goal',817,'78%'],['Workouts','workouts',997,'1']]){text(label,x,350,21,C.muted,'Regular','middle');live(key,sample,x,390,31,C.white,'Bold','middle',157);}
card(32,434,1071,267);rect(54,451,4.5,25,2.2,C.lime);text('HEALTH SNAPSHOT',73,476,23,C.white,'Bold');text('LATEST READINGS',1074,475,14,C.dim,'Regular','end');
const centers=[174,436,698,960];for(const x of [305,567,829])vline(x,500,681);
for(const[i,label]of ['Heart','Blood Oxygen','Sleep & Breathing','Cardio Fitness'].entries())text(label,centers[i],514,22,C.muted,'Regular','middle',236);
for(let i=0;i<4;i++){const color=[C.pink,C.cyan,C.purple,C.lime][i],x=centers[i];p.push(`<circle cx="${x}" cy="546" r="23" fill="${color}" fill-opacity=".07" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>`);if(i===1){text('O',x-4,557,24,C.cyan,'Bold','middle');text('2',x+11,561,12,C.cyan,'Bold','middle');}else icon(['heart','','moon','runner'][i],x,546,i===2?33.0939:30,color);}
// Measurement timestamps need an observed native export. Never use Date.now().
for(const[i,label]of ['LATEST','LATEST','DAILY SLEEP','LATEST'].entries())text(label,centers[i],584,11,C.dim,'Regular','middle');
live('heart','72 bpm',174,624,34,C.white,'Bold','middle',232);
live('hrv','HRV avg 42 ms',174,651,19,C.muted,'Regular','middle',235);
live('resting','Resting 60 bpm',174,676,17,C.muted,'Regular','middle',235);
live('oxygen','98%',436,624,34,C.white,'Bold','middle',232);text('SpO2',436,651,18,C.muted,'Regular','middle');text('Latest reading',436,676,17,C.dim,'Regular','middle');
live('sleep','7h 24m',698,624,33,C.white,'Bold','middle',236);text('Breathing disturbances',698,649,17,C.muted,'Regular','middle');live('breathing','3.2',698,678,23,C.white,'Bold','middle',235);
live('cardio','41.2',960,624,34,C.white,'Bold','middle',232);text('VO2 max',960,651,18,C.muted,'Regular','middle');text('mL/kg/min',960,676,17,C.dim,'Regular','middle');
card(32,713,1071,305);rect(54,731,4.5,25,2.2,C.lime);text('WEEKLY ACTIVITY',73,755,23,C.white,'Bold');text('LAST 7 DAYS',1074,754,14,C.dim,'Regular','end');line(54,770,1080,770);
const days=['SUN','MON','TUE','WED','THU','FRI','SAT'];
for(let i=0;i<7;i++){
  const y=790+i*31.5;if(i===6){p.push(`<rect x="48" y="${y-18}" width="1039" height="29" rx="7" fill="#bfff09" fill-opacity=".045"/>`);}if(i<6)line(55,y+16,1080,y+16,'#273841',.7);
  live('day'+i,days[i],64,y+8,21,i===6?C.lime:C.white,i===6?'Bold':'Regular','start',86);
  rect(183,y-3,405,7,3.5,'#263741');
  live('steps'+i,i===6?'7,842':'—',712,y+8,23,C.white,'Regular','end',115);
  icon('flame',840,y,17,C.pink);live('energy'+i,i===6?'420 kcal':'—',872,y+8,22,C.muted,'Regular','start',165);
  // No chevron: a history detail action has not been implemented.
  if(i===6){bars.push({key:'steps',x:183*sx+tx,y:y+ty,width:405*sx});if(values)rect(183,y-3,405*Number(values.stepsProgress??.7842),7,3.5,'url(#bar)');}
}
p.push('</g>');
line(25,1049,1108,1049,'#44525e',1.5);for(const x of [270,563,854])vline(x,1077,1148,'#44525e',1.5);
p.push('<ellipse cx="928" cy="1109" rx="64" ry="58" fill="url(#healthGlow)"/>');
if(values){for(const[k,label,x,lx]of [['home','HOME',92,148],['calendar','CALENDAR',350,397],['weather','WEATHER',638,699],['heart','HEALTH',928,984]]){icon(k==='weather'?'moon':k,x,1109,48,k==='heart'?C.lime:C.muted);text(label,lx,1124,27,k==='heart'?C.lime:C.muted,'Light');}}
p.push('</svg>');
return {svg:p.join(''),fields,rings,bars,bounds};
}
