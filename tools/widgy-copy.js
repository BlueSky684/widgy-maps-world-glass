import {prepareWidget} from './calendar-widget-export.js?v=perf-5-ringfix-1';
import {withNativeClock} from './widget-native-clock.js?v=native-clock-1';
const $=id=>document.getElementById(id);
const nativeClock=new URLSearchParams(window.location.search).get('clock')==='native';
if(nativeClock){
  document.title='הווידג׳ט המלא עם שעון חלופי';
  $('heading').textContent='הווידג׳ט המלא עם שעון חלופי.';
  $('explanation').textContent='המפה וכל הנתונים האמיתיים חוזרים. השעון משתמש במקור השעה הרגיל של Widgy בפורמט HH:mm, עם אותו פונט, גודל ומיקום. נבדוק במכשיר את מהירות המעבר ואת החלפת הדקה האוטומטית לפני שנקבע שזו הגרסה הסופית.';
  $('clock-speed-check').hidden=false;
  $('clock-minute-check').hidden=false;
  $('download').download='Widgy_Calendar_Native_Clock_Trial.json';
}
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
    const result=await prepareWidget();
    payload=nativeClock ? JSON.stringify(withNativeClock(JSON.parse(result.payload))) : result.payload;
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status(nativeClock ? 'עותק Native Clock Trial מוכן. המפה והנתונים האמיתיים פעילים; גם תיקון טבעת הצעדים כלול.' : `מוכן להעתקה. ביומנים שבחרת נמצאו ${result.data.today.total} אירועים היום.`);
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
