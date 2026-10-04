// Public synthetic requests only; never read location, cookies or private export.
const live='/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6&reuse=60';
const example=live+'&lat=0&lon=0&city_text=Example';
export const MAP_TIMING_CASES=Object.freeze([
  Object.freeze({id:'static',label:'מפה סטטית מלאה',url:'/assets/diagnostics/Home_Map_Static_3306x1558.png'}),
  Object.freeze({id:'live-plain',label:'מפה חיה ללא סימון',url:live+'&lat=&lon='}),
  Object.freeze({id:'live-example',label:'מפה חיה עם סימון דוגמה',url:example}),
  Object.freeze({id:'live-repeat',label:'אותה מפת דוגמה — בקשה חוזרת',url:example})
]);
const rounded=n=>Math.round(n*10)/10;
const abortError=()=>Object.assign(new Error('cancelled'),{name:'AbortError'});

async function decodePNG(blob,signal){
  if(signal.aborted)throw abortError();
  const url=URL.createObjectURL(blob),img=new Image();
  let onAbort;
  try{
    const aborted=new Promise((_,reject)=>{onAbort=()=>reject(abortError());signal.addEventListener('abort',onAbort,{once:true});});
    const loaded=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('image_decode_failed'));});
    img.src=url;
    await Promise.race([loaded,aborted]);
    if(typeof img.decode==='function')await Promise.race([img.decode(),aborted]);
    return {width:img.naturalWidth,height:img.naturalHeight};
  }finally{
    signal.removeEventListener('abort',onAbort);img.onload=null;img.onerror=null;
    img.src='';URL.revokeObjectURL(url);
  }
}

export async function measureMapRequest(test,{fetcher=fetch,now=()=>performance.now(),decode=decodePNG,signal,timeoutMs=30000}={}){
  const controller=new AbortController();
  const cancel=()=>controller.abort();
  if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
  const started=now(),row={id:test.id,label:test.label,ok:false};
  try{
    if(controller.signal.aborted)throw abortError();
    const response=await fetcher(test.url,{credentials:'omit',cache:'no-store',signal:controller.signal});
    const headersAt=now();
    Object.assign(row,{status:response.status,headersMs:rounded(headersAt-started),mapCache:response.headers.get('X-Map-Cache'),cdnCache:response.headers.get('X-Vercel-Cache'),serverTiming:response.headers.get('Server-Timing'),renderedAt:response.headers.get('X-Map-Rendered-At'),edgeId:response.headers.get('X-Vercel-Id'),age:response.headers.get('Age')});
    if(!response.ok)throw Error('http_'+response.status);
    if(!/^image\/png(?:;|$)/i.test(response.headers.get('Content-Type')||''))throw Error('not_png');
    const blob=await response.blob(),bodyAt=now();
    row.bytes=blob.size;row.bodyMs=rounded(bodyAt-headersAt);
    const size=await decode(blob,controller.signal),decodedAt=now();
    row.decodeMs=rounded(decodedAt-bodyAt);row.dimensions=[size.width,size.height];
    if(size.width!==3306 || size.height!==1558)throw Error('unexpected_dimensions');
    row.ok=true;
  }catch(error){
    row.error=timedOut?'timeout':controller.signal.aborted?'cancelled':error.message;
  }finally{
    row.totalMs=rounded(now()-started);clearTimeout(timer);signal?.removeEventListener('abort',cancel);
  }
  return row;
}

export async function runMapTiming(options={}){
  const rows=[];
  for(const test of MAP_TIMING_CASES){
    if(options.signal?.aborted)break;
    options.onStart?.(test,rows.length+1);
    const row=await measureMapRequest(test,options);rows.push(row);options.onResult?.(row);
  }
  return rows;
}

export function formatResults(rows){
  return JSON.stringify({test:'map-timing-1',measuredAt:new Date().toISOString(),environment:'Browser, full PNG 3306x1558, sequential fetch with browser cache bypassed; not Widgy timing',location:'Synthetic only: explicit none or 0,0 / Example; no geocoder',notes:'Headers wait includes connection, network, platform and server work. Body is browser-received PNG bytes, not wire bytes. Decode is browser-specific. Server-Timing is a subset of headers wait; do not add it to total. Repeated request may hit a different function instance.',results:rows},null,2);
}

if(typeof document!=='undefined'){
  const $=id=>document.getElementById(id);
  let running=null;
  const seconds=n=>typeof n==='number'?(n/1000).toFixed(2)+' שנ׳':'—';
  const messages={timeout:'הבקשה עברה 30 שניות',cancelled:'המדידה נעצרה',not_png:'השרת לא החזיר תמונת PNG',image_decode_failed:'כרום לא הצליח לפתוח את התמונה',unexpected_dimensions:'התקבלה תמונה בגודל לא צפוי'};
  function addResult(row){
    const card=document.createElement('article'),title=document.createElement('h2');
    title.textContent=row.label;card.append(title);
    if(!row.ok){const error=document.createElement('p');error.className='error';error.textContent=messages[row.error]||'הבקשה נכשלה: '+row.error;card.append(error);}
    const list=document.createElement('dl');
    for(const [label,value] of [['עד תחילת התשובה',seconds(row.headersMs)],['הורדת התמונה',seconds(row.bodyMs)],['פתיחת התמונה בכרום',seconds(row.decodeMs)],['סה״כ',seconds(row.totalMs)],['גודל התמונה',typeof row.bytes==='number'?(row.bytes/1000000).toFixed(2)+' MB':'—']]){
      const term=document.createElement('dt'),detail=document.createElement('dd');term.textContent=label;detail.textContent=value;list.append(term,detail);
    }
    card.append(list);$('results').append(card);
  }
  $('run').addEventListener('click',async()=>{
    if(running)return;
    running=new AbortController();$('run').disabled=true;$('cancel').hidden=false;$('report').hidden=true;
    $('results').replaceChildren();$('text').value='';$('copy-status').textContent='';
    try{
      const rows=await runMapTiming({signal:running.signal,onStart:(test,index)=>{$('status').textContent=index+' מתוך 4: '+test.label+'…';},onResult:addResult});
      $('text').value=formatResults(rows);$('report').hidden=rows.length===0;
      $('status').textContent=running.signal.aborted?'המדידה נעצרה. אפשר להעתיק את התוצאות החלקיות.':rows.every(r=>r.ok)?'המדידה הסתיימה. העתק את התוצאות ושלח אותן בשיחה.':'המדידה הסתיימה עם שגיאה בחלק מהבקשות. העתק גם את התוצאות האלה.';
    }finally{running=null;$('run').disabled=false;$('cancel').hidden=true;}
  });
  $('cancel').addEventListener('click',()=>running?.abort());
  $('copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('text').value);$('copy-status').textContent='הועתק. אפשר להדביק בשיחה.';}
    catch{$('text').focus();$('text').select();$('text').setSelectionRange(0,$('text').value.length);$('copy-status').textContent='סמן והעתק את הטקסט שבתיבה.';}
  });
}
