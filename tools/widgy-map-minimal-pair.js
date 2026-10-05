import {personalizedWidget} from './calendar-connect-widget.js?v=perf-5-ringfix-1';
import {consolidateWidget} from './widget-consolidation.js?v=consolidated-1';
import {compactCalendarDots} from './calendar-compact-dots.js?v=compact-dots-1';
import {thinNativeStepsRing} from './native-steps-ring.js?v=native-ring-2';

import {withMapMinimalPair} from './map-minimal-pair.js?v=map-minimal-pair-1';

const $=id=>document.getElementById(id);
let payload='',downloadURL='',busy=false;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
async function prepare(){
  if(busy)return;
  busy=true;payload='';
  if(downloadURL)URL.revokeObjectURL(downloadURL);
  downloadURL='';$('download').removeAttribute('href');
  $('copy').disabled=true;$('download').hidden=true;$('retry').hidden=true;
  status('מכין את עותק הבדיקה…');
  try{
    // Public template only: no calendar export/session request in this test.
    const response=await fetch('./Widgy_Home_Glass_Calendar_C16.json',{cache:'no-store'});
    if(!response.ok)throw Error('template_failed');
    // Feed the existing Lean preparation chain inert placeholders; the minimal
    // transform removes them and refuses any remaining calendar URL/token.
    const origin=new URL(window.location.href).origin;
    const full=personalizedWidget(await response.json(),
      origin+'/api/calendar-dots?token=unused-map-test',
      origin+'/api/calendar-widget?token=unused-map-test');
    payload=JSON.stringify(withMapMinimalPair(thinNativeStepsRing(compactCalendarDots(consolidateWidget(full)))));
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status('מוכן: Widgy Map Minimal Pair 1. מסך Calendar יהיה ריק בכוונה, למעט הכותרת והניווט.');
  }catch(error){
    status('לא ניתן להכין את העותק כרגע. בדוק את החיבור לרשת ונסה שוב.',true);
    $('retry').hidden=false;
  }finally{busy=false;}
}
$('copy').addEventListener('click',async()=>{
  if(!payload)return;
  try{await navigator.clipboard.writeText(payload);status('הועתק! ב־Widgy בחר Import URL Or JSON והדבק.');}
  catch{status('ההעתקה נחסמה. הורד את הקובץ וב־Widgy בחר Import .widgy File From Files.',true);}
});
$('retry').addEventListener('click',prepare);
window.addEventListener('pageshow',event=>{if(event.persisted)prepare();});
prepare();
