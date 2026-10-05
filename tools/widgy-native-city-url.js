import {prepareWidget} from './calendar-widget-export.js?v=perf-5-ringfix-1';
import {consolidateWidget} from './widget-consolidation.js?v=consolidated-1';
import {compactCalendarDots} from './calendar-compact-dots.js?v=compact-dots-1';
import {thinNativeStepsRing} from './native-steps-ring.js?v=native-ring-2';

import {withNativeCityRecovery} from './native-city-url.js?v=native-city-recovery-1';

const $=id=>document.getElementById(id);
let payload='',downloadURL='',busy=false;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
async function prepare(){
  if(busy)return;
  busy=true;payload='';
  if(downloadURL)URL.revokeObjectURL(downloadURL);
  downloadURL='';$('download').removeAttribute('href');
  $('copy').disabled=true;$('download').hidden=true;$('retry').hidden=true;
  status('מכין את העותק האישי…');
  try{
    const result=await prepareWidget();
    payload=JSON.stringify(withNativeCityRecovery(thinNativeStepsRing(compactCalendarDots(consolidateWidget(JSON.parse(result.payload))))));
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status('מוכן: Widgy Native City Recovery 1. בדוק שהמפה חזרה ושהעיר הנכונה מופיעה ב־Calendar.');
  }catch(error){
    status(error.message==='unauthorized'?
      'פתח בכרום שבו חיברת את היומנים. אם הכניסה פגה, היכנס בהגדרות למטה וחזור לכאן.':
      'לא ניתן להכין את העותק כרגע. נסה שוב, או בדוק את חיבור היומנים בהגדרות למטה.',true);
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
