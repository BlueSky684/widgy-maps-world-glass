// One shared coordinate system for artwork, native frames and the layout proof.
// Fonts are the same original Phenomena outlines used by the approved Weather.
import {outlinedText} from '../../lib/weather/render.js';

export const C={white:'#f4f7fa',muted:'#aeb7c6',lime:'#c5ff0a',track:'#263b46'};
export const DIAL={x:143,y:224,r:68,stroke:4.5};
// Move artwork and live readings together. Larger bottom corners keep a clear
// inset from Widgy's continuous outer rim without narrowing the data panel.
const LOWER_PANEL_OFFSET_Y=-6;
// Native font fitting is controlled by Widgy. These are optical layout targets,
// not a claim that our SVG reproduces the iOS text engine exactly.
export const READINGS=[
  {id:15003,name:'Battery · Percentage',x:94,baseline:235,width:80,cap:53,weight:'Bold',align:1},
  {id:15301,name:'Device · Model',x:274,baseline:223,width:204,cap:23},
  {id:15302,name:'Device · iOS version',x:311,baseline:267,width:165,cap:19},
  {id:15013,name:'Wi-Fi · ON',x:157,baseline:386+LOWER_PANEL_OFFSET_Y,width:49,cap:18,color:'lime'},
  {id:15611,name:'Wi-Fi · OFF',x:157,baseline:386+LOWER_PANEL_OFFSET_Y,width:49,cap:18,color:'muted'},
  {id:15030,name:'Bluetooth · ON',x:409,baseline:386+LOWER_PANEL_OFFSET_Y,width:62,cap:18,color:'lime'},
  {id:15612,name:'Bluetooth · OFF',x:409,baseline:386+LOWER_PANEL_OFFSET_Y,width:62,cap:18,color:'muted'},
  {id:15022,name:'Storage · Free space',x:113,baseline:466+LOWER_PANEL_OFFSET_Y,width:134,cap:31,weight:'Bold'},
  {id:15037,name:'Battery · Hours remaining',x:357,baseline:466+LOWER_PANEL_OFFSET_Y,width:125,cap:31,weight:'Bold'},
];
// IMG_0252: requested caps 53/23/19/31 rendered as 50/21/18/29px.
// Keep the measured baseline while correcting the native line-box scale.
export const nativeBox=r=>[r.x,r.baseline-r.cap*1.405,r.width,r.cap*1.75];
// Continuous corners fitted to the actual 530px Widgy export's alpha mask.
// The previous 49px circular corners were clipped by the native 120px corners.
export function nativeOutline(inset=0){
  const l=inset,t=inset,r=530-inset,b=530-inset,rad=120.4-inset,power=2/2.833;
  const p=[`M${l+rad} ${t}H${r-rad}`];
  const corners=[
    a=>[r-rad+rad*Math.sin(a)**power,t+rad-rad*Math.cos(a)**power],
    a=>[r-rad+rad*Math.cos(a)**power,b-rad+rad*Math.sin(a)**power],
    a=>[l+rad-rad*Math.sin(a)**power,b-rad+rad*Math.cos(a)**power],
    a=>[l+rad-rad*Math.cos(a)**power,t+rad-rad*Math.sin(a)**power],
  ];
  for(let c=0;c<4;c++){
    if(c===1)p.push(`V${b-rad}`);
    if(c===2)p.push(`H${l+rad}`);
    if(c===3)p.push(`V${t+rad}`);
    for(let i=1;i<=32;i++)p.push('L'+corners[c](i*Math.PI/64).map(n=>n.toFixed(3)).join(' '));
  }
  return p.join('')+'Z';
}
export const ringBox=()=>{
  const outer=DIAL.r+DIAL.stroke/2;
  return [DIAL.x-outer,DIAL.y-outer,outer*2,outer*2];
};
export function staticArtwork(){
  const p=[`<svg xmlns="http://www.w3.org/2000/svg" width="1060" height="1060" viewBox="0 0 530 530"><defs>
  <linearGradient id="base" x1="0%" y1="0%" x2="65%" y2="100%"><stop stop-color="#20343e"/><stop offset=".30" stop-color="#12212b"/><stop offset=".72" stop-color="#0b151c"/><stop offset="1" stop-color="#080e14"/></linearGradient>
  <linearGradient id="rim" x1="0%" y1="0%" x2="75%" y2="100%"><stop stop-color="#c0d7df"/><stop offset=".20" stop-color="#536c7d"/><stop offset=".55" stop-color="#253541"/><stop offset=".83" stop-color="#728a98"/><stop offset="1" stop-color="#354652"/></linearGradient>
  <linearGradient id="well" x1="0%" y1="0%" x2="80%" y2="100%"><stop stop-color="#14262f"/><stop offset=".47" stop-color="#0a171e"/><stop offset="1" stop-color="#080f16"/></linearGradient>
  <linearGradient id="edge" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="#79939f" stop-opacity=".85"/><stop offset=".12" stop-color="#405b68" stop-opacity=".7"/><stop offset=".8" stop-color="#24333e"/><stop offset="1" stop-color="#627584" stop-opacity=".85"/></linearGradient>
  <radialGradient id="dial" cx="35%" cy="18%" r="90%"><stop stop-color="#283e49"/><stop offset=".48" stop-color="#172932"/><stop offset="1" stop-color="#0a141c"/></radialGradient>
  <linearGradient id="bezel" x1="15%" y1="0%" x2="85%" y2="100%"><stop stop-color="#a0b7c4"/><stop offset=".30" stop-color="#304854"/><stop offset=".65" stop-color="#1b2b35"/><stop offset="1" stop-color="#6d8693"/></linearGradient>
  <linearGradient id="reflection" x1="0%" y1="0%" x2="20%" y2="100%"><stop stop-color="#d8efff" stop-opacity=".045"/><stop offset="1" stop-color="#d8efff" stop-opacity="0"/></linearGradient>
  <linearGradient id="icon" x1="0%" y1="0%" x2="50%" y2="100%"><stop stop-color="#d8e2ed"/><stop offset="1" stop-color="#99a9c0"/></linearGradient>
  <clipPath id="outer"><path d="${nativeOutline()}"/></clipPath>
  </defs>
  <rect width="530" height="530" fill="url(#base)"/>
  <path d="${nativeOutline(8)}" fill="none" stroke="url(#rim)" stroke-width="1.3"/>
  <path d="${nativeOutline(9.8)}" fill="none" stroke="#b5cede" stroke-opacity=".15" stroke-width=".55"/>
  <path d="M0 0H530V40L0 255Z" fill="url(#reflection)" clip-path="url(#outer)"/>`];
  const t=(s,x,y,cap,fill=C.muted,weight='Regular',anchor='start',w=Infinity)=>p.push(outlinedText(s,x,y,cap,fill,weight,anchor,w));
  const line=(x,y,x2,y2)=>p.push(`<path d="M${x} ${y}L${x2} ${y2}" stroke="#7b96a8" stroke-opacity=".65" stroke-width=".65"/>`);
  const panel=(x,y,w,h)=>p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="15" fill="url(#well)" stroke="url(#edge)" stroke-width="1"/><rect x="${x+1.3}" y="${y+1.3}" width="${w-2.6}" height="${h-2.6}" rx="13.7" fill="none" stroke="#080f15" stroke-opacity=".7" stroke-width=".6"/>`);
  const lowerPanelPath=(inset=0)=>{
    const x=26+inset,y=350+inset,r=504-inset,b=496-inset,rt=15-inset,rb=36-inset;
    return `M${x+rt} ${y}H${r-rt}A${rt} ${rt} 0 0 1 ${r} ${y+rt}V${b-rb}A${rb} ${rb} 0 0 1 ${r-rb} ${b}H${x+rb}A${rb} ${rb} 0 0 1 ${x} ${b-rb}V${y+rt}A${rt} ${rt} 0 0 1 ${x+rt} ${y}Z`;
  };
  t('DE',29,76,34,C.white,'Bold');t('VICE',68.15,76,34,C.lime,'Bold');
  t('SYSTEM STATUS',31,95,9,'#91a9b8');
  p.push('<circle cx="480" cy="65" r="16" fill="#0a151d" fill-opacity=".40" stroke="#59727f" stroke-opacity=".6" stroke-width=".65"/><g fill="none" stroke="#afbecb" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><path d="M472 64a8 8 0 0 1 13-6l3 3M488 56v5h-5M488 67a8 8 0 0 1-13 6l-3-3M472 75v-5h5"/></g>');
  panel(26,117,478,216);
  p.push('<circle cx="143" cy="224" r="85" fill="#040c12" fill-opacity=".55"/><circle cx="143" cy="224" r="82" fill="url(#dial)" stroke="url(#bezel)" stroke-width="1.8"/><circle cx="143" cy="224" r="80" fill="none" stroke="#050d13" stroke-width=".8"/>');
  for(let i=0;i<20;i++){
    const angle=(i*18-90)*Math.PI/180,major=i%5===0;
    const at=r=>`${143+Math.cos(angle)*r} ${224+Math.sin(angle)*r}`;
    p.push(`<path d="M${at(major?73.5:75.5)}L${at(78)}" stroke="${major?'#a3b5c2':'#607b8c'}" stroke-opacity="${major?.8:.5}" stroke-width="${major?1:.65}"/>`);
  }
  p.push(`<circle cx="143" cy="224" r="68" fill="none" stroke="${C.track}" stroke-width="4.5"/>`);
  t('%',183,222,20,C.white,'Regular','middle');
  t('BATTERY',143,255,9.5,'#a8bac8','Regular','middle');
  line(250,151,250,298);
  t('DEVICE INFORMATION',274,181,9.5,'#a3b5c2');t('iOS',274,267,13,'#a3b5c2');
  // A quiet connectivity row over two roomy measurements, inside one surface.
  p.push(`<g transform="translate(0 ${LOWER_PANEL_OFFSET_Y})"><path d="${lowerPanelPath()}" fill="url(#well)" stroke="url(#edge)" stroke-width="1"/><path d="${lowerPanelPath(1.3)}" fill="none" stroke="#080f15" stroke-opacity=".7" stroke-width=".6"/>`);
  line(42,405,488,405);line(265,425,265,479);
  t('Wi-Fi',113,384,12);t('Bluetooth',344,384,12);
  t('STORAGE',113,429,9);t('Free space',113,482,11);
  t('TIME LEFT',357,429,9);t('Estimated',357,482,11);
  p.push(`<g fill="none" stroke="url(#icon)" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
  <path d="M67 375Q79 364 91 375M71 380Q79 372 87 380M75 385Q79 381 83 385"/><circle cx="79" cy="389" r="1.25" fill="#aeb7c6" stroke="none"/>
  <path d="M306 373L319 386L312 394V367L319 374L306 387"/>
  <circle cx="321" cy="454" r="15.5"/><path d="M321 443V454L327 460"/>
  <!-- The approved three softly rounded, offset storage layers. -->
  <path d="M94 456Q98 458 95 460L82 470Q80 472 76 471L62 468Q59 467 62 465L65 462"/>
  <path d="M94 449Q98 451 95 453L82 463Q80 465 76 464L62 461Q59 460 62 458L65 455"/>
  <path d="M62 451L75 441Q77 439 80 440L94 443Q98 444 95 447L82 457Q80 459 76 458L62 455Q59 454 62 451Z"/>
  </g></g></svg>`);
  return p.join('');
}
// A build proof with illustrative readings; never used as a widget data source.
export function layoutProof(background,{battery=75,model='iPhone 17 Pro Max',ios='27.0.1',wifi='Off',bluetooth='On',storage='151 GB',hours='29.2 h'}={}){
  const values={15003:String(battery),15301:model,15302:ios,15013:wifi==='On'?'ON':'',15611:wifi==='Off'?'OFF':'',15030:bluetooth==='On'?'ON':'',15612:bluetooth==='Off'?'OFF':'',15022:storage,15037:hours};
  const p=[background.replace('</svg>','')];
  if(battery>0){
    const circumference=2*Math.PI*DIAL.r;
    p.push(`<circle cx="143" cy="224" r="68" fill="none" stroke="${C.lime}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${circumference*Math.min(100,battery)/100} ${circumference}" transform="rotate(-90 143 224)"/>`);
  }
  for(const r of READINGS)if(values[r.id])p.push(outlinedText(values[r.id],r.x+(r.align?r.width/2:0),r.baseline,r.cap,C[r.color||'white'],r.weight||'Regular',r.align?'middle':'start',r.width));
  p.push('<g fill="none" stroke="#aeb7c6" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round"><path d="M143 265l-4 7h4l-1 7 6-10h-4l1-4M137 266l12 12"/></g></svg>');
  return p.join('');
}
