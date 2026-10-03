import {prepareWidget} from './calendar-widget-export.js?v=perf-3';
const $=id=>document.getElementById(id);
let state, listing=[], payload='', downloadURL='';
const messages={
  unauthorized:'מפתח הכניסה אינו תקין או שהכניסה פגה. היכנס שוב.',
  server_configuration:'האתר ממתין להגדרת המפתחות הפרטיים.',
  google_not_configured:'יש להשלים את הגדרת Google באתר.',
  google_permissions_required:'נדרשות שתי הרשאות הקריאה של היומן. נסה להתחבר מחדש ולאשר אותן.',
  google_connection_cancelled:'החיבור ל־Google בוטל. אפשר לנסות שוב.',
  google_connection_failed:'החיבור ל־Google נכשל או פג. נסה להתחבר מחדש.',
  google_read_failed:'לא הצלחנו לקרוא את יומני Google. בדוק את ההרשאה והתחבר שוב.',
  icloud_credentials_invalid:'יש להזין כתובת חשבון Apple וסיסמה ייעודית במבנה xxxx-xxxx-xxxx-xxxx.',
  icloud_connection_failed:'החיבור ל־iCloud נכשל. בדוק את כתובת החשבון ואת הסיסמה הייעודית.',
  apple_holidays_read_failed:'יומן החגים הציבורי של Apple אינו זמין כרגע. נסה שוב בעוד רגע; אין צורך לשנות סיסמה.',
  provider_read_failed:'אחד החשבונות לא זמין כרגע. חבר אותו מחדש לפני שמירת הבחירה.',
  choose_calendars:'בחר בין יומן אחד לשישה יומנים.',
  selection_too_large:'הבחירה ארוכה מדי. נסה לבחור פחות יומנים.',
  invalid_timezone:'אזור הזמן אינו מזוהה. לדוגמה: Asia/Jerusalem.',
  oauth_expired:'חלון האישור פג. חזור לדף והתחבר שוב.',
  invalid_selection:'רשימת היומנים השתנתה. רענן את הדף ובחר שוב.',
  unexpected_template:'קובץ הווידג׳ט אינו תואם לגרסת הבסיס. לא נוצר קובץ.',
  connection_failed:'החיבור נכשל. נסה שוב; אם הבעיה חוזרת, שמור את שם השלב שבו נעצרה.'
};
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
async function api(op,input){
  const response=await fetch(`/api/calendar-bridge?op=${op}`,input===undefined ? {cache:'no-store'} : {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error || 'connection_failed');
  return data;
}
async function run(button,job){
  button.disabled=true;
  try{await job();}catch(e){status(messages[e.message] || messages.connection_failed,true);}
  finally{button.disabled=false;}
}
function invalidateExport(){payload='';if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL='';$('download-section').hidden=true;}
async function refresh(){
  state=await api('state');
  $('configuration').hidden=state.ready.base;
  $('login-section').hidden=!state.ready.base||state.authenticated;
  $('workspace').hidden=!state.authenticated;
  if(!state.ready.base){status('הקוד מוכן להגדרה; החשבונות עדיין אינם מחוברים.');return;}
  if(!state.authenticated){status('האתר מוכן לכניסה הפרטית שלך.');return;}
  $('google-state').textContent=state.connected.google?'מחובר':state.ready.google?'מוכן לחיבור':'ממתין להגדרת Google באתר';
  $('google-connect').disabled=!state.ready.google;
  $('google-connect').textContent=state.connected.google?'חיבור Google מחדש':'חיבור Google';
  $('icloud-state').textContent=state.connected.icloud?'מחובר':'טרם חובר';
  $('zone').value=state.zone;
  $('export-section').hidden=!state.sources.length;
  {
    status('טוען את היומנים הזמינים…');
    const result=await api('calendars');listing=result.calendars;
    drawSources();
    if(result.errors.length){status(`קריאת החשבון נכשלה: ${result.errors.join(', ')}. התחבר אליו מחדש.`,true);return;}
  }
  status(state.sources.length?'בחירת היומנים נשמרה. אפשר להכין עותק אישי לבדיקה.':'חבר חשבון ובחר את היומנים שתרצה להציג.');
}
function drawSources(){
  const root=$('sources');root.replaceChildren();
  listing.forEach((calendar,index)=>{
    const saved=state.sources.find(s=>s.provider===calendar.provider&&s.id===calendar.id);
    const row=document.createElement('div');row.className='source-row';
    const label=document.createElement('label');
    const check=document.createElement('input');check.type='checkbox';check.checked=Boolean(saved);check.dataset.index=index;
    const name=document.createElement('span');name.textContent=calendar.name;
    const provider=document.createElement('small');provider.textContent={'google':'Google Calendar','icloud':'iCloud','apple-holidays':'Apple · חגים בעברית'}[calendar.provider];name.append(provider);label.append(check,name);
    const select=document.createElement('select');select.setAttribute('aria-label',`צבע עבור ${calendar.name}`);
    ['כחול','סגול','זהב','ירוק'].forEach((name,color)=>{const option=document.createElement('option');option.value=color;option.textContent=name;select.append(option);});
    select.value=saved?.color??0;
    const paint=()=>{select.style.borderColor=state.colors[Number(select.value)];};
    const edited=()=>{paint();invalidateExport();$('export-section').hidden=true;status('שמור את הבחירה לפני הכנת הקובץ.');};
    select.addEventListener('change',edited);check.addEventListener('change',edited);paint();
    row.append(label,select);root.append(row);
  });
  $('sources-section').hidden=!listing.length;
}
$('login-form').addEventListener('submit',event=>{event.preventDefault();run(event.submitter,async()=>{await api('login',{key:$('login-key').value});$('login-key').value='';await refresh();});});
$('google-connect').addEventListener('click',event=>run(event.currentTarget,async()=>{status('פותח את מסך ההרשאות של Google…');const data=await api('google',{});location.assign(data.url);}));
$('icloud-form').addEventListener('submit',event=>{event.preventDefault();run(event.submitter,async()=>{
  status('בודק את החיבור ל־iCloud…');
  const credentials={username:$('apple-id').value,password:$('apple-password').value};$('apple-password').value='';
  await api('icloud',credentials);$('icloud-details').open=false;invalidateExport();await refresh();
});});
$('sources-form').addEventListener('submit',event=>{event.preventDefault();run(event.submitter,async()=>{
  status('מאמת את בחירת היומנים…');
  const sources=[...$('sources').querySelectorAll('.source-row')].flatMap(row=>{
    const check=row.querySelector('input');if(!check.checked)return [];
    const {provider,id}=listing[Number(check.dataset.index)];return [{provider,id,color:Number(row.querySelector('select').value)}];
  });
  await api('select',{sources,zone:$('zone').value.trim()});invalidateExport();await refresh();
});});
$('build-widget').addEventListener('click',event=>run(event.currentTarget,async()=>{
  status('קורא את האירועים ומכין את הקובץ האישי…');invalidateExport();
  const prepared=await prepareWidget(),data=prepared.data;payload=prepared.payload;
  downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));$('download-widget').href=downloadURL;
  $('read-result').textContent=`הקריאה הצליחה: נמצאו אירועים ב־${data.daysWithEvents} ימים בטווח המוצג של ${data.month}.`;
  const details=$('read-details');details.replaceChildren();
  for(const source of data.sources){
    const calendar=listing.find(c=>c.provider===source.provider && c.id===source.id);
    const line=document.createElement('p');
    line.textContent=`${calendar?.name || source.provider} — ${['כחול','סגול','זהב','ירוק'][source.color]}: ${source.daysWithEvents} ימים עם אירועים בטווח; ${source.todayEvents} אירועים היום.`;
    details.append(line);
  }
  const heading=document.createElement('p');heading.textContent=`TODAY והנקודות משתמשים באותם ${data.today.total} אירועים של היום. מוצגים עד ארבעה.`;details.append(heading);
  for(const row of data.today.rows){
    const line=document.createElement('p');line.textContent=`${row.allDay?'כל היום':row.start+'–'+row.end} · ${row.title} · ${['כחול','סגול','זהב','ירוק'][row.color]}`;details.append(line);
  }
  if(data.today.home){
    const line=document.createElement('p');
    line.textContent=`Home: ${data.today.total} אירועים היום · ${data.today.home.label} · ${data.today.home.title}${data.today.home.time?' · '+data.today.home.time:''}`;
    details.append(line);
  }
  $('download-section').hidden=false;status('הקובץ מוכן. ייבא אותו ב־Widgy כעותק נוסף לבדיקה.');
}));
$('copy-widget').addEventListener('click',event=>run(event.currentTarget,async()=>{
  if(!payload)return;
  try{await navigator.clipboard.writeText(payload);status('הועתק. ב־Widgy בחר Import URL Or JSON, הדבק וייבא כעותק נוסף.');}
  catch{status('הדפדפן חסם את ההעתקה. השתמש בקישור להורדת הקובץ.');}
}));
$('generate-keys').addEventListener('click',()=>{
  const bytes=()=>crypto.getRandomValues(new Uint8Array(32));
  $('seal-key').value=[...bytes()].map(v=>v.toString(16).padStart(2,'0')).join('');
  $('setup-key').value=btoa(String.fromCharCode(...bytes())).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  $('generated-keys').hidden=false;$('generate-keys').disabled=true;
});
$('refresh').addEventListener('click',event=>run(event.currentTarget,refresh));
$('zone').addEventListener('input',()=>{invalidateExport();$('export-section').hidden=true;});
$('callback').textContent=`${location.origin}/api/calendar-bridge?op=google-callback`;
const callbackError=location.hash.slice(1);history.replaceState(null,'',location.pathname);
refresh().then(()=>{if(messages[callbackError])status(messages[callbackError],true);}).catch(()=>status(messages.connection_failed,true));
