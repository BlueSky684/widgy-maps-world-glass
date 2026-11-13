import sharp from 'sharp';
import {waitUntil} from '@vercel/functions';
import {privateHeaders} from './security.js';
import {nativeProjection} from './native-projection.js';
import {automaticFlight} from './flight-route.js';
import native from './native-calendar.cjs';
import font from './home-time-glyphs.js';

// Separate image transport: a failed time read cannot hide the native title.
// Each request names the exact native row, never an independently selected event.
export function homeTimeModel(input,encoded) {
  const index=Number(input.get('row'))-1;
  const p=nativeProjection(input,encoded),row=p.rows[index];
  const unavailable={kind:'unavailable',text:'TIMES UNAVAILABLE'};
  if(p.ready!==1 || !row || index>=Number(input.get('native_count')))return unavailable;
  const event=Object.fromEntries(['title','location','start','end'].map(k=>[k,input.get(`n${index+1}_${k}`)||'']));
  if(!native.clean(event.title).trim())return unavailable;
  if(row.flight===1)return {kind:'flight',start:row.flight_start,end:row.flight_end,departure:row.start_label,arrival:row.end_label};
  if(row.all_day===1)return {kind:'all-day',text:'ALL DAY'};
  // Without an identity/evidence match, phone clocks must never masquerade as
  // local departure/arrival clocks. Unknown routes remain explicitly unknown.
  if(automaticFlight(event))return {kind:'unavailable',text:'FLIGHT TIMES UNAVAILABLE'};
  const a=native.clock(event.start),b=native.clock(event.end);
  if(a===null || b===null)return unavailable;
  const hhmm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  return {kind:'event',start:hhmm(a),end:hhmm(b)};
}
function glyphText(value,x,y,size,color) {
  let svg='',cursor=x;
  for(const ch of value.toUpperCase()){
    const g=font.glyphs[ch]||font.glyphs[' '];
    if(g.path)svg+=`<path d="${g.path}" transform="translate(${cursor} ${y}) scale(${size/font.units} ${-size/font.units})" fill="${color}"/>`;
    cursor+=g.advance*size/font.units;
  }
  return {svg,width:cursor-x};
}
function plane(x,landing) {
  return `<g transform="translate(${x+4} 6) scale(0.9)" fill="#bdff00"><path transform="translate(16 14) rotate(${landing?25:-25}) translate(-16 -14)" d="M2 13 L12 13 L9 3 L12 3 L19 13 L28 13 Q32 13 32 15 Q32 17 28 17 L19 17 L12 27 L9 27 L12 17 L4 17 L1 21 L0 21 L0 10 L2 10 Z"/><path d="M1 34 H33 V36 H1 Z"/></g>`;
}
export function homeTimeSVG(model) {
  let body='',extent=674;const text=(s,x,size=34,color='#f2f3f6')=>glyphText(s,x,36,size,color);
  if(model.kind==='flight') {
    const label=s=>String(s).toUpperCase().replace(/[^A-Z0-9 +\-/]/g,'').slice(0,18);
    const time=s=>/^\d\d:\d\d$/.test(s)?s:'--:--';
    body+=plane(0,false);
    const a=text(time(model.start),48,37);body+=a.svg;
    const b=text(label(model.departure),48+a.width+13,29,'#b3bcc8');body+=b.svg;
    const divider=48+a.width+13+b.width+23;
    body+=`<path d="M${divider} 9 V40" stroke="#485561" stroke-width="1.5"/>`;
    const second=divider+24;body+=plane(second,true);
    const c=text(time(model.end),second+48,37);body+=c.svg;
    const lastX=second+48+c.width+13,last=text(label(model.arrival),lastX,29,'#b3bcc8');body+=last.svg;extent=Math.max(674,lastX+last.width);
  } else if(model.kind==='event') {
    const a=text(model.start,0);body+=a.svg;
    body+=`<path d="M${a.width+16} 25 H${a.width+40}" stroke="#b3bcc8" stroke-width="2"/>`;
    body+=text(model.end,a.width+57).svg;
  } else body+=text(model.text,0,28,'#b3bcc8').svg;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1348" height="100" viewBox="0 0 674 50"><g transform="scale(${674/extent})">${body}</g></svg>`;
}
export async function renderHomeTime(model){return sharp(Buffer.from(homeTimeSVG(model))).png().toBuffer();}
function capture(){return {statusCode:200,body:null,setHeader(){},status(c){this.statusCode=c;return this;},json(b){this.body=b;return this;},end(){return this;}};}
export function homeTimeImage(calendar,{render=renderHomeTime,budgetMs=10000,defer=task=>waitUntil(task),log=entry=>console.info(JSON.stringify(entry))}={}) {
  return async(req,res)=>{
    const started=performance.now();let phase='validation';
    const report=(status,detail={})=>{try{log({event:'home_time_image_v1',phase,status,elapsedMs:Math.round((performance.now()-started)*10)/10,...detail});}catch{}};
    privateHeaders(res);res.setHeader('Vercel-CDN-Cache-Control','no-store');
    res.setHeader('X-Home-Time-Revision','image-v1');
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');report(405);return res.status(405).end();}
    let input;
    try {
      input=new URL(req.url,'https://calendar.invalid').searchParams;
      for(const key of input.keys())if(input.getAll(key).length!==1)throw Error();
      if(input.get('render')!=='home-time-v1'||input.get('context')!=='home-v1'||!/[1-4]/.test(input.get('row'))||input.get('row').length!==1)throw Error();
      for(const [key,value] of input)if(key.startsWith('n')&&value.length>2048)throw Error();
    }catch{report(400);return res.status(400).json({error:'invalid_time_request'});}
    const child=new URL('/api/calendar-widget','https://calendar.invalid');
    for(const key of ['token','day_zone','refresh'])if(input.has(key))child.searchParams.set(key,input.get(key));
    for(const [key,value] of Object.entries({view:'today',reuse:'year-v2',metadata:'native-v1',presentation:'agenda-v2',flight_mode:'auto-v1'}))child.searchParams.set(key,value);
    phase='calendar';const response=capture();
    // The existing calendar handler remains the sole authorization boundary.
    const work=(async()=>{try{await calendar({method:'GET',url:child.pathname+child.search,headers:{}},response);return response;}catch{return {statusCode:502};}})();
    let timer,result;
    try {result=await Promise.race([work,new Promise(resolve=>{timer=setTimeout(()=>{try{defer(work.then(()=>{}));}catch{}resolve({statusCode:504});},budgetMs);})]);}
    finally {clearTimeout(timer);}
    if(result.statusCode!==200 || typeof result.body?.encoded!=='string'){
      const code=[401,403,400,429,504].includes(result.statusCode)?result.statusCode:502;
      report(code);return res.status(code).json({error:'calendar_unavailable'});
    }
    try{
      phase='model';const model=homeTimeModel(input,result.body.encoded);
      phase='render';const png=await render(model);
      phase='response';
      res.setHeader('Content-Type','image/png');res.setHeader('Content-Length',String(png.length));
      res.setHeader('X-Home-Time-Kind',model.kind);
      report(200,{kind:model.kind,pngBytes:png.length,method:req.method});
      return req.method==='HEAD'?res.status(200).end():res.status(200).end(png);
    }catch(error){
      // Never log exception text: it may contain calendar values or URLs.
      const errorClass=['TypeError','RangeError','SyntaxError','Error'].includes(error?.name)?error.name:'Other';
      report(502,{errorClass});return res.status(502).json({error:'time_image_unavailable'});
    }
  };
}
