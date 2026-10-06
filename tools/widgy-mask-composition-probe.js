import {personalizedWidget} from './calendar-connect-widget.js?v=perf-5-ringfix-1';
import {consolidateWidget} from './widget-consolidation.js?v=consolidated-1';
import {compactCalendarDots} from './calendar-compact-dots.js?v=compact-dots-1';
import {thinNativeStepsRing} from './native-steps-ring.js?v=native-ring-2';
import {withMaskCompositionProbe} from './mask-composition-probe.js?v=mask-composition-probe-1';

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
    const response=await fetch('./Widgy_Home_Glass_Calendar_C16.json',{cache:'no-store'});
    if(!response.ok)throw Error('template_failed');
    const origin=new URL(window.location.href).origin;
    const full=personalizedWidget(await response.json(),
      origin+'/api/calendar-dots?token=unused-mask-test',
      origin+'/api/calendar-widget?token=unused-mask-test');
    const prepared=thinNativeStepsRing(compactCalendarDots(consolidateWidget(full)));
    payload=JSON.stringify(withMaskCompositionProbe(prepared,origin));
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status('מוכן: Widgy Mask Composition Probe 1. אין צורך לשנות הגדרות לאחר הייבוא.');
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
