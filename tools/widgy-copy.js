import {prepareWidget} from './calendar-widget-export.js?v=perf-3';
const $=id=>document.getElementById(id);
let payload='',downloadURL='',busy=false;
const messages={
  unauthorized:'פתח את הקישור באותו דפדפן שבו חיברת את היומנים. אם הכניסה פגה, היכנס דרך הקישור להגדרות למטה וחזור לכאן.',
  choose_calendars:'בחר ושמור יומנים בהגדרות למטה, ואז חזור לכאן.',
  google_read_failed:'לא ניתן לקרוא כרגע את Google Calendar. בדוק את החיבור בהגדרות היומנים.',
  apple_holidays_read_failed:'יומן החגים אינו זמין כרגע. נסה שוב בעוד רגע.',
  unexpected_template:'קובץ הווידג׳ט לא נטען. נסה שוב בעוד רגע.'
};
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
async function prepare(){
  if(busy)return;busy=true;payload='';
  if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL='';
  $('copy').disabled=true;$('download').hidden=true;$('retry').hidden=true;
  status('קורא את היומנים ומכין את העותק האישי…');
  try{
    const result=await prepareWidget();payload=result.payload;
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status(`מוכן להעתקה. ביומנים שבחרת נמצאו ${result.data.today.total} אירועים היום.`);
  }catch(error){
    status(messages[error.message] || 'לא ניתן להכין את העותק כרגע. נסה שוב; אם הבעיה נמשכת, בדוק את חיבור היומנים בהגדרות למטה.',true);
    $('retry').hidden=false;
  }finally{busy=false;}
}
$('copy').addEventListener('click',async()=>{
  if(!payload)return;
  try{await navigator.clipboard.writeText(payload);status('הועתק! עבור ל־Widgy, בחר Import URL Or JSON והדבק.');}
  catch{status('הדפדפן חסם העתקה. לחץ על הורדת קובץ לייבוא וב־Widgy בחר Import .widgy File From Files.',true);}
});
$('retry').addEventListener('click',prepare);
window.addEventListener('pageshow',event=>{if(event.persisted)prepare();});
prepare();
