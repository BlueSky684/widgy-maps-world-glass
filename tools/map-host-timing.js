// Delivery-only experiment. Public existing map source; no location or calendar.
const path='assets/earth/Terrain_Master_3306x1558.png';
const revision='ce01dd4ac62c2f0da8f02cb780b8363fb358400a';
export const EXPECTED=Object.freeze({bytes:3048628,width:3306,height:1558,sha256:'82d5ef93612689b4e5d48d06503292832fa743bad528d0b14b31630a03350907'});
export const HOSTS=Object.freeze([
  Object.freeze({id:'vercel',label:'Vercel',url:'/'+path}),
  Object.freeze({id:'jsdelivr',label:'jsDelivr',url:`https://cdn.jsdelivr.net/gh/BlueSky684/widgy-maps-world-glass@${revision}/${path}`})
]);
const rounded=n=>Math.round(n*10)/10;
const abortError=()=>Object.assign(Error('cancelled'),{name:'AbortError'});

async function decodePNG(bytes,signal){
  if(signal.aborted)throw abortError();
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  const image=new Image();
  let cancel;
  try{
    await new Promise((resolve,reject)=>{
      cancel=()=>reject(abortError());
      signal.addEventListener('abort',cancel,{once:true});
      image.onload=resolve;image.onerror=()=>reject(Error('image_decode_failed'));
      image.src=url;
    });
    return [image.naturalWidth,image.naturalHeight];
  }finally{
    signal.removeEventListener('abort',cancel);
    image.onload=null;image.onerror=null;image.src='';URL.revokeObjectURL(url);
  }
}
async function hashBytes(bytes){
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}

export async function measureHost(host,{fetcher=fetch,now=()=>performance.now(),decode=decodePNG,hash=hashBytes,signal,timeoutMs=20000}={}){
  const controller=new AbortController(),cancel=()=>controller.abort();
  if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
  let timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
  const start=now(),row={host:host.id,label:host.label,ok:false};
  try{
    if(controller.signal.aborted)throw abortError();
    const response=await fetcher(host.url,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:controller.signal});
    const headersAt=now();
    Object.assign(row,{status:response.status,headersMs:rounded(headersAt-start),cdnCache:response.headers.get('X-Vercel-Cache')||response.headers.get('X-Cache'),age:response.headers.get('Age')});
    if(!response.ok)throw Error('http_'+response.status);
    if(!/^image\/png(?:;|$)/i.test(response.headers.get('Content-Type')||''))throw Error('not_png');
    const bytes=await response.arrayBuffer(),bodyAt=now();
    row.bytes=bytes.byteLength;row.bodyMs=rounded(bodyAt-headersAt);
    row.downloadMs=rounded(bodyAt-start);
    if(bytes.byteLength!==EXPECTED.bytes)throw Error('different_file');
    row.dimensions=await decode(bytes,controller.signal);
    const decodedAt=now();
    row.imageLoadMs=rounded(decodedAt-bodyAt);row.totalMs=rounded(decodedAt-start);
    if(row.dimensions[0]!==EXPECTED.width||row.dimensions[1]!==EXPECTED.height)throw Error('different_dimensions');
    // Identity verification is deliberately outside the load timing.
    row.sha256=await hash(bytes);
    if(controller.signal.aborted)throw abortError();
    if(row.sha256!==EXPECTED.sha256)throw Error('different_file');
    row.ok=true;
  }catch(error){
    row.error=timedOut?'timeout':controller.signal.aborted?'cancelled':String(error.message||error);
  }finally{
    if(!row.ok)row.elapsedMs=rounded(now()-start);
    clearTimeout(timer);signal?.removeEventListener('abort',cancel);
  }
  return row;
}

export async function runHostTiming({first=Math.random()<0.5?0:1,onStart,onResult,...options}={}){
  const rows=[];
  for(let round=1;round<=3;round++){
    const order=(first+round-1)%2===0?[0,1]:[1,0];
    for(const index of order){
      if(options.signal?.aborted)return rows;
      onStart?.({round,host:HOSTS[index],index:rows.length+1});
      const row={round,...await measureHost(HOSTS[index],options)};
      rows.push(row);onResult?.(row);
    }
  }
  return rows;
}

export function summarize(rows){
  return HOSTS.map(host=>{
    const later=rows.filter(r=>r.host===host.id&&r.round>1&&r.ok);
    const complete=later.length===2;
    return {host:host.id,label:host.label,validRepeatSamples:later.length,
      repeatMeanMs:complete?rounded(later.reduce((sum,r)=>sum+r.totalMs,0)/2):null};
  });
}
export function formatReport(rows,{interrupted=false}={}){
  return JSON.stringify({test:'map-host-timing-1',measuredAt:new Date().toISOString(),interrupted,
    environment:'Browser only. Not Widgy transition timing or a live-map renderer test.',
    file:{path,revision,...EXPECTED},
    method:'Six sequential requests: three rounds, alternating host order, randomized first host. Browser cache bypassed with no-store; CDN cache behavior may also be affected. Vercel connection may be warm from loading this page. First round retained separately; repeats may benefit from connection/edge warming. No random URL cache-buster. SHA-256 validation excluded from load time.',
    privacy:'Public static terrain source only. No GPS, city lookup, owner export or calendar data. Results stay on device until copied.',
    summary:summarize(rows),results:rows},null,2);
}

if(typeof document!=='undefined'&&document.getElementById('host-run')){
  const $=id=>document.getElementById(id);
  const seconds=ms=>(ms/1000).toFixed(2)+' שנ׳';
  const errors={timeout:'השרת לא השיב בזמן',cancelled:'נעצר',different_file:'התקבל קובץ שונה — התוצאה לא להשוואה',different_dimensions:'התקבלה תמונה בגודל שונה',not_png:'לא התקבלה תמונה',image_decode_failed:'לא ניתן לפתוח את התמונה'};
  let running=null;
  function addResult(row){
    const tr=document.createElement('tr');
    for(const value of [row.round===1?'1 · ראשון':String(row.round),row.label,row.ok?seconds(row.totalMs):(errors[row.error]||'הבקשה נכשלה')]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }
    if(!row.ok)tr.className='error';
    $('host-rows').append(tr);
  }
  function stop(){running?.abort();}
  $('host-cancel').addEventListener('click',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  $('host-run').addEventListener('click',async()=>{
    if(running)return;
    running=new AbortController();$('host-run').disabled=true;$('host-cancel').hidden=false;
    $('host-results').hidden=false;$('host-report').hidden=true;$('host-rows').replaceChildren();
    $('host-summary').replaceChildren();$('host-copy-status').textContent='';$('host-text').value='';
    try{
      const rows=await runHostTiming({signal:running.signal,
        onStart:({round,host,index})=>{$('host-status').textContent=`סבב ${round} · ${host.label} — בדיקה ${index} מתוך 6…`;$('host-progress').value=index-1;},
        onResult:row=>{addResult(row);$('host-progress').value++;}});
      const interrupted=running.signal.aborted;
      $('host-text').value=formatReport(rows,{interrupted});$('host-report').hidden=rows.length===0;
      for(const result of summarize(rows)){
        const p=document.createElement('p');
        p.textContent=result.repeatMeanMs===null?`${result.label}: אין מספיק תוצאות תקינות.`:`${result.label}: ממוצע שני הסבבים החוזרים ${seconds(result.repeatMeanMs)}`;
        $('host-summary').append(p);
      }
      $('host-status').textContent=interrupted?'המדידה נעצרה. כדאי להשאיר את כרום פתוח בזמן הבדיקה.':rows.every(row=>row.ok)?'הסתיים. אותו קובץ אומת בכל שש הבקשות. אפשר להעתיק ולשלוח בשיחה.':'הסתיים עם שגיאה בחלק מהבקשות. אפשר לשלוח גם את התוצאות האלה.';
    }catch{
      $('host-status').textContent='המדידה לא הושלמה. אפשר לנסות שוב.';
    }finally{
      running=null;$('host-run').disabled=false;$('host-cancel').hidden=true;
    }
  });
  $('host-copy').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('host-text').value);$('host-copy-status').textContent='הועתק. אפשר להדביק בשיחה.';}
    catch{$('host-text').focus();$('host-text').select();$('host-text').setSelectionRange(0,$('host-text').value.length);$('host-copy-status').textContent='סמן והעתק את הטקסט שבתיבה.';}
  });
}
