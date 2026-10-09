import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {uvLevel,number} from './model.js';
const fonts=JSON.parse(readFileSync(new URL('../../assets/weather-premium/glyphs.json',import.meta.url)));
const art=JSON.parse(readFileSync(new URL('../../assets/weather-premium/icons.json',import.meta.url)));
const WHITE='#f4f7fa',MUTED='#aeb7c6',LIME='#c5ff0a',DIM='#788997';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function outlinedText(value,x,y,cap=24,color=WHITE,weight='Regular',anchor='start',maxWidth=Infinity){
  const f=fonts[weight],s=String(value).slice(0,100),glyphs=[...s].map(c=>f.glyphs[c]?c:'—');
  const width=glyphs.reduce((v,c,i)=>v+f.glyphs[c].advance+(i?f.kern[glyphs[i-1]+c]||0:0),0);
  const scale=Math.min(cap/f.cap,maxWidth/Math.max(1,width));
  let at=x-(anchor==='middle'?width*scale/2:anchor==='end'?width*scale:0);
  let path='';for(let i=0;i<glyphs.length;i++){
    const c=glyphs[i];at+=(i?f.kern[glyphs[i-1]+c]||0:0)*scale;
    path+=`<path d="${f.glyphs[c].path}" transform="translate(${at} ${y}) scale(${scale} ${-scale})"/>`;at+=f.glyphs[c].advance*scale;
  }
  return `<g fill="${color}" aria-label="${escape(s)}"><title>${escape(s)}</title>${path}</g>`;
}
function icon(kind,x,y,size){return kind&&art.icons[kind]?`<g transform="translate(${x-size/2} ${y-size/2}) scale(${size/100})">${art.icons[kind]}</g>`:outlinedText('—',x,y+10,22,DIM,'Regular','middle');}
const fmt=(v,suffix='')=>number(v)===null?'—':Math.round(v)+suffix;
export function renderSVG(data,{state='fresh',message='Weather unavailable',revision=1}={}){
  const p=[`<svg xmlns="http://www.w3.org/2000/svg" width="2270" height="1608" viewBox="0 240 1135 804">`,art.definitions,'<defs><linearGradient id="range" x2="1" y2="0"><stop stop-color="#638f74"/><stop offset=".55" stop-color="#a4ce51"/><stop offset="1" stop-color="#c5ff0a"/></linearGradient></defs>'];
  const text=(...args)=>p.push(outlinedText(...args));
  const rect=(x,y,w,h,fill)=>p.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${fill}"/>`);
  const c=data?.current||{},days=data?.days||[],hours=data?.hours||[];
  if(revision>=3){
    // One compact current-condition group, with a proportional unit attached
    // to the actual number width (including negative/missing temperatures).
    p.push(icon(c.icon,177,349,180));
    const temperature=fmt(c.temperature),font=fonts.Bold;
    const glyphs=[...temperature].map(v=>font.glyphs[v]?v:'—');
    const units=glyphs.reduce((v,ch,i)=>v+font.glyphs[ch].advance+(i?font.kern[glyphs[i-1]+ch]||0:0),0);
    const width=Math.min(132,units*82/font.cap);
    text(temperature,282,384,82,WHITE,'Bold','start',132);
    text('°C',282+width+8,334,25,MUTED);
    text(data?c.label:message,254,444,26,MUTED,'Regular','middle',410);
    for(const [value,x] of [[fmt(c.feels,'°'),611],[fmt(days[0]?.high,'°'),804],[fmt(days[0]?.low,'°'),994]])text(value,x,350,32,WHITE,'Bold','middle',158);
    text(fmt(c.humidity,'%'),611,445,30,WHITE,'Bold','middle',158);
    text(fmt(c.wind,' km/h'),804,445,30,WHITE,'Regular','middle',166);
    text([fmt(c.uv),uvLevel(c.uv)].filter(Boolean).join(' '),994,445,27,WHITE,'Regular','middle',166);
    for(let i=0;i<7;i++)rect(940+i*16,460,12,3,number(c.uv)!==null&&i<Math.min(7,Math.ceil(c.uv/11*7))?LIME:'#304048');
  }else{
  p.push(icon(c.icon,131,357,141));
  text(fmt(c.temperature),247,403,110,WHITE,'Bold','start',151);
  text(data?c.label:message,249,451,30,MUTED,'Regular','start',263);
  for(const [value,x] of [[fmt(c.feels,'°'),582],[fmt(days[0]?.high,'°'),767],[fmt(days[0]?.low,'°'),959]])text(value,x,343,33,WHITE,'Bold');
  text(fmt(c.humidity,'%'),582,445,33,WHITE,'Bold');
  text(number(c.wind)===null?'—':`${c.direction} ${Math.round(c.wind)} km/h`,767,445,25,WHITE,'Regular','start',144);
  const uv=fmt(c.uv),level=uvLevel(c.uv);text(uv,959,445,33,WHITE,'Bold');
  text(level,uv.length>1?1008:989,443,21,MUTED,'Regular','start',uv.length>1?72:91);
  for(let i=0;i<7;i++)rect(959+i*16,458,12,3,number(c.uv)!==null&&i<Math.min(7,Math.ceil(c.uv/11*7))?LIME:'#304048');
  }
  for(let i=0;i<6;i++){
    const h=hours[i]||{},cx=131+i*174.5;
    text(h.label||'—',cx,604,20,i===0?LIME:MUTED,'Regular','middle');
    p.push(icon(h.icon,cx-(revision>=2?40:33),648,revision>=2?60:46));text(fmt(h.temperature,'°'),cx+24,662,35,WHITE,'Bold','middle',81);text(fmt(h.rain,'%'),cx+1,698,18,MUTED);
  }
  const lows=days.map(d=>d.low).filter(v=>v!==null),highs=days.map(d=>d.high).filter(v=>v!==null);
  const min=lows.length?Math.min(...lows)-1:0,max=highs.length?Math.max(...highs)+1:1;
  for(let i=0;i<5;i++){
    const d=days[i]||{},cy=831+i*42;
    text(d.label||'—',61,cy+9,23,i===0?LIME:WHITE,i===0?'Bold':'Regular','start',113);
    p.push(icon(d.icon,218,cy,revision>=2?46:35));
    text(d.weatherLabel||'—',273,cy+9,23,MUTED,'Regular','start',260);
    text(fmt(d.rain,'%'),596,cy+9,21,MUTED);text(fmt(d.low,'°'),735,cy+10,25,MUTED,'Regular','end');
    if(number(d.low)!==null&&number(d.high)!==null){const x0=762+(d.low-min)/(max-min)*238,x1=762+(d.high-min)/(max-min)*238;rect(x0,cy-3,Math.max(1,x1-x0),6,'url(#range)');}
    text(fmt(d.high,'°'),1078,cy+10,25,WHITE,'Bold','end');
  }
  const stamp=data?new Intl.DateTimeFormat('en-GB',{timeZone:data.zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(data.at)):'';
  text('Open-Meteo.com · '+(data?(state==='stale'?'Last update ':'Updated ')+stamp:message),1080,1039,10,DIM,'Regular','end');
  p.push('</svg>');return p.join('');
}
export async function renderPNG(data,options){return sharp(Buffer.from(renderSVG(data,options))).png({compressionLevel:6}).toBuffer();}
