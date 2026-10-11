const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const keyText=new URLSearchParams(location.hash.slice(1)).get('key');
for(const card of document.querySelectorAll('[data-copy]')){
 const name=card.dataset.copy,button=card.querySelector('button'),status=card.querySelector('.status'),manual=card.querySelector('.manual'),text=card.querySelector('textarea');let payload='';
 const msg=(s,error=false)=>{status.textContent=s;status.classList.toggle('error',error);};
 const select=()=>{text.focus();text.select();text.setSelectionRange(0,text.value.length);};
 card.querySelector('.select').addEventListener('click',select);
 button.addEventListener('click',async()=>{
  if(!payload)return;
  try{await navigator.clipboard.writeText(payload);msg(`${name} הועתק במלואו. אפשר לייבא ל־Widgy.`);}
  catch{manual.hidden=false;text.value=payload;select();try{if(document.execCommand('copy')){manual.hidden=true;msg(`${name} הועתק במלואו.`);return;}}catch{}msg('בחר ״העתק״ בתפריט הטקסט.',true);}
 });
 (async()=>{
  try{
   if(!/^[A-Za-z0-9_-]{43}$/.test(keyText||''))throw Error('missing_key');
   const response=await fetch(`./map-host-ab-15-${name}.enc.json`,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   if(!response.ok)throw Error('fetch');const e=await response.json();if(e.v!==1||e.name!==name)throw Error('version');
   const key=await crypto.subtle.importKey('raw',decode(keyText),'AES-GCM',false,['decrypt']);
   const zipped=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(e.iv),additionalData:new TextEncoder().encode(`map-host-ab-15:${name}:v1`)},key,decode(e.data));
   const bytes=await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   const sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
   if(bytes.byteLength!==e.bytes||sha!==e.sha256)throw Error('integrity');
   const value=new TextDecoder('utf-8',{fatal:true}).decode(bytes),widget=JSON.parse(value);
   if(widget['3']!==name||!Array.isArray(widget['1']))throw Error('widget');
   payload=value;button.disabled=false;msg(`${name} מוכן להעתקה.`);
  }catch{msg('לא נטען. פתח את הקישור המלא מהשיחה ב־Chrome.',true);}
 })();
}
