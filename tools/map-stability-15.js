import {mapIsolation15} from './map-isolation-15.js';
const $=s=>document.querySelector(s);
const message=(text,error=false)=>{$('#message').textContent=text;$('#message').classList.toggle('error',error);};
const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const phaseNames={a:'תמונה ראשונה',b:'תמונה שנייה',auto:'החלפה בכל חצי שעה', 'json-error':'כשל מידע יזום','image-error':'כשל תמונה יזום',slow:'השהיית תמונה יזומה'};
const time=n=>new Date(n).toLocaleTimeString('he-IL',{timeZone:'Asia/Jerusalem',hour12:false});
let payload,control,copyText,busy=false;
async function api(body){
 const response=await fetch(body?'/api/map-stability':'/api/map-stability?kind=status',{method:body?'POST':'GET',headers:{Authorization:'Bearer '+control,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('unavailable');return response.json();
}
function show(data){
 const s=data.state;$('#phase').textContent=phaseNames[s.mode]+(s.untilAt?' · חזרה למצב תקין ב־'+time(s.untilAt):'');
 $('#source').textContent=s.lastSource?time(s.lastSource.at)+' · '+phaseNames[s.lastSource.mode]:'טרם התקבלה';
 $('#image').textContent=s.lastImage?time(s.lastImage.at)+' · '+(s.lastImage.asset==='a'?'תמונה ראשונה':'תמונה שנייה')+' · '+({ok:'בקשה רגילה',error:'בקשת כשל',slow:'בקשה מושהית'}[s.lastImage.behavior]||''):'טרם התקבלה';
 $('#counts').textContent=`${s.sourceCount} מידע · ${s.imageCount} תמונה`;
 const sourceSeen=s.lastSource?.rev===s.rev,imageSeen=s.lastImage?.rev?.startsWith(s.rev+'-');
 let evidence=sourceSeen?'התקבלה בקשת מידע במצב הנוכחי.':'עדיין אין בקשת מידע במצב הנוכחי. הישארות המפה לבדה אינה מוכיחה שהמצב נבדק.';
 if(s.mode==='image-error'||s.mode==='slow')evidence=imageSeen?'התקבלה גם בקשת התמונה של מצב הבדיקה הנוכחי. כעת צריך להשוות למה שמוצג באייפון.':'עדיין לא התקבלה בקשת תמונה של מצב הבדיקה הנוכחי; אי אפשר לקבוע שהוא נבדק.';
 $('#evidence').textContent=evidence;
 if(s.observation)$('#observation').textContent='התצפית האחרונה נשמרה ב־'+time(s.observation.at)+': '+({visible:'המפה מוצגת',blank:'המפה נעלמה',old:'מפה ישנה / חזרה אחורה'}[s.observation.result]);
}
async function action(body){if(busy)return;busy=true;try{show(await api(body));if(body?.action==='set')message('מצב הבדיקה עודכן. חזור לווידג׳ט ובדוק את המפה.');else if(body?.action==='observation')message('התצפית נשמרה.');}catch{message('לא ניתן לקרוא או לעדכן את מצב הבדיקה כרגע. נסה שוב; העותק המקורי לא השתנה.',true);}finally{busy=false;}}
const select=()=>{const t=$('#json');t.focus();t.select();t.setSelectionRange(0,t.value.length);};
$('#select').addEventListener('click',select);
async function copyWidget(text,label){if(!text)return;try{await navigator.clipboard.writeText(text);message(label+' הועתק. ייבא ב־Widgy מהלוח.');}catch{$('#manual').hidden=false;$('#json').value=text;select();try{if(document.execCommand('copy')){$('#manual').hidden=true;message(label+' הועתק.');return;}}catch{}message('בחר ״העתק״ בתפריט הטקסט.',true);}}
$('#copy').addEventListener('click',()=>copyWidget(copyText,'הווידג׳ט המלא'));
$('#copy-map').addEventListener('click',()=>{try{copyWidget(JSON.stringify(mapIsolation15(payload.widget)),'עותק המפה בלבד');}catch{message('לא ניתן להכין את עותק המפה. העותק המקורי לא השתנה.',true);}});
$('#refresh').addEventListener('click',()=>action());
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>action({action:'set',mode:b.dataset.mode}));
for(const b of document.querySelectorAll('[data-result]'))b.addEventListener('click',()=>action({action:'observation',result:b.dataset.result}));
try{
 const keyText=new URLSearchParams(location.hash.slice(1)).get('key');if(!/^[A-Za-z0-9_-]{43}$/.test(keyText||''))throw Error();
 const response=await fetch('./map-stability-15.enc.json',{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error();const e=await response.json();if(e.v!==1)throw Error();
 const key=await crypto.subtle.importKey('raw',decode(keyText),'AES-GCM',false,['decrypt']);
 const zipped=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(e.iv),additionalData:new TextEncoder().encode('map-stability-15:v1')},key,decode(e.data));
 const bytes=await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(bytes.byteLength!==e.bytes||sha!==e.sha256)throw Error();
 payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(payload.widget?.['3']!=='Widgy Weather 15 — Stability'||!Array.isArray(payload.widget['1'])||!/^[A-Za-z0-9_-]{43}$/.test(payload.control||''))throw Error();
 copyText=JSON.stringify(payload.widget);control=payload.control;
 // Status only: opening this helper must never advance a phase or fetch a map.
 show(await api());for(const b of document.querySelectorAll('button'))b.disabled=false;message('גרסה 15 לבדיקת יציבות מוכנה להעתקה.');
}catch{message('הבדיקה לא נטענה. פתח את הקישור המלא מהשיחה ב־Chrome ולחץ רענון.',true);}
