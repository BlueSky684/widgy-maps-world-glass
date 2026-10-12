import {createHash,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {setTimeout as pause} from 'node:timers/promises';
import {observeMapResponseCompletion} from './map-response-completion.js';
export const MODES=['a','b','auto','json-error','image-error','slow'];
const sha=s=>createHash('sha256').update(s).digest('hex');
const validKey=(key,expected)=>typeof key==='string'&&/^[A-Za-z0-9_-]{43}$/.test(key)&&timingSafeEqual(Buffer.from(sha(key)),Buffer.from(expected));
export function selection(state,now){
 const bucket=state.mode==='auto'?Math.floor((now-state.selectedAt)/1800000):0;
 const asset=state.mode==='a'||(state.mode==='auto'&&bucket%2===0)?'a':'b';
 return {asset,rev:`${state.rev}-${bucket}`,behavior:state.mode==='image-error'?'error':state.mode==='slow'?'slow':'ok',until:state.untilAt};
}
export function createStabilityHandler({config,store,clock=Date.now,wait=pause,load=path=>readFile(path),log=x=>console.info(JSON.stringify(x))}){
 return async(req,res)=>{
  const started=performance.now(),url=new URL(req.url,config.origin),kind=url.searchParams.get('kind')||'control';
  const report=(phase,details={})=>log({event:'map_stability_v1',kind,phase,elapsedMs:Math.round(performance.now()-started),...details});
  for(const k of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])res.setHeader(k,'no-store');
  res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const json=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(req.method==='HEAD'?undefined:JSON.stringify(data));};
  if(!['source','image','status','control'].includes(kind))return json(404,{error:'not_found'});
  const isRead=kind==='source'||kind==='image';
  const token=isRead?url.searchParams.get('key'):(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!validKey(token,isRead?config.readHash:config.controlHash))return json(401,{error:'unauthorized'});
  if(!(isRead||kind==='status'?['GET','HEAD']:['POST']).includes(req.method))return json(405,{error:'method'});
  if(kind==='control'&&req.headers.origin&&req.headers.origin!==config.origin)return json(403,{error:'origin'});
  observeMapResponseCompletion(res,report);
  try{
   const now=clock();
   if(kind==='status'){
    const state=await store('status',{},now);return json(200,{state,selection:selection(state,now),serverTime:now});
   }
   if(kind==='control'){
    let body=req.body;
    if(body===undefined){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>2048)return json(413,{error:'size'});}body=JSON.parse(text);}
    else if(typeof body==='string'){if(body.length>2048)return json(413,{error:'size'});body=JSON.parse(body);}
    if(!body||typeof body!=='object')return json(400,{error:'body'});
    let action,value;
    if(body.action==='set'&&MODES.includes(body.mode)){action='set';value={mode:body.mode};}
    else if(body.action==='observation'&&['visible','blank','old'].includes(body.result)){action='observation';value={result:body.result};}
    else return json(400,{error:'action'});
    const state=await store(action,value,now);report('control',{action,mode:state.mode,rev:state.rev});return json(200,{state,selection:selection(state,now),serverTime:now});
   }
   if(kind==='source'){
    const state=await store(req.method==='HEAD'?'status':'source',{},now),sel=selection(state,now);
    report('source',{mode:state.mode,rev:sel.rev,intentional:state.mode==='json-error'});
    if(state.mode==='json-error')return json(503,{error:'intentional_metadata_failure',until:state.untilAt});
    const image=new URL('/api/map-stability',config.origin);
    image.search=new URLSearchParams({kind:'image',key:token,...sel}).toString();
    return json(200,{image:image.href,revision:sel.rev,fixture:sel.asset,mode:state.mode});
   }
   const asset=url.searchParams.get('asset'),rev=url.searchParams.get('rev'),behavior=url.searchParams.get('behavior'),until=Number(url.searchParams.get('until'));
   if(!['a','b'].includes(asset)||!/^(?:initial|[0-9]{1,10}-[0-9]{1,10})$/.test(rev||'')||!['ok','error','slow'].includes(behavior)||!Number.isSafeInteger(until)||until<0||until>now+300000)return json(400,{error:'image_parameters'});
   await store(req.method==='HEAD'?'status':'image',{asset,rev,behavior},now);
   const active=until>now,fail=active&&behavior==='error',slow=active&&behavior==='slow';
   report('image_requested',{asset,rev,behavior,intentional:fail||slow});
   if(fail)return json(503,{error:'intentional_image_failure',until});
   if(slow&&req.method!=='HEAD')await wait(6000);
   if(res.destroyed)return;
   const fixture=config.fixtures[asset],bytes=await load(fixture.path);
   if(bytes.length!==fixture.bytes||sha(bytes)!==fixture.sha256)throw Error('fixture_integrity');
   res.statusCode=200;res.setHeader('Content-Type','image/png');res.setHeader('Content-Length',String(bytes.length));
   // Successful immutable fixture URLs may be reused. Deliberate fault URLs
   // stay uncacheable so a cached success cannot masquerade as a failed fetch.
   if(behavior==='ok')res.setHeader('Cache-Control','private, max-age=86400, immutable');
   res.setHeader('X-Map-Test-Revision',rev);res.setHeader('X-Map-Test-Fixture',asset);
   report('prepared',{status:200,asset,rev,bytes:bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){report('failed',{reason:error instanceof SyntaxError?'invalid_json':'test_unavailable'});if(!res.headersSent)json(error instanceof SyntaxError?400:503,{error:'test_unavailable'});else res.end();}
 };
}
