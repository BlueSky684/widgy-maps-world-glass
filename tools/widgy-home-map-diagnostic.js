import {perf5DiagnosticBaseline,withoutHomeMap,withoutHomeMapAndCityLookup,withoutHomeNativeData,withoutHomeLiveClock,withMinimalHome,withMinimalHomeLiveClock,withMinimalHomeEvents,withMinimalHomeTimeText,withMinimalHomeNativeData,withMinimalHomeBackdrop,withoutHomeProgressArtwork,withoutHomeWeatherArtwork} from './widget-home-map-diagnostic.js?v=minimal-backdrop-1';
import {prepareWidget} from './calendar-widget-export.js?v=perf-5-ringfix-1';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(window.location.search);
const minimalBackdrop=params.get('home')==='minimal-backdrop';
const minimalNative=minimalBackdrop || params.get('home')==='minimal-native';
const minimalTime=minimalNative || params.get('home')==='minimal-time';
const minimalEvents=minimalTime || params.get('home')==='minimal-events';
const minimalLiveClock=minimalEvents || params.get('home')==='minimal-clock';
const weatherArtOff=params.get('home')==='weather-art-off';
const progressOff=params.get('home')==='progress-off';
const minimalHome=minimalLiveClock || params.get('home')==='minimal';
const clockOff=minimalHome || params.get('home')==='clock-off';
const nativeDataOff=clockOff || params.get('home')==='data-off';
const cityOff=nativeDataOff || params.get('city')==='off';
if(minimalBackdrop){
  document.title='בדיקת שכבת הזכוכית והמסגרות ב־Home';
  $('heading').textContent='הוספת הזכוכית והמסגרות בלבד.';
  $('explanation').textContent='זהה לעותק האחרון עם נתוני מזג האוויר והכושר, בתוספת שכבת העיצוב המקורית של הזכוכית והמסגרות בלבד. השעון, הטקסטים וכל מקורות הנתונים נשמרים בדיוק. המפה, מילוי הגרפים והאייקונים החסרים עדיין לא הוחזרו.';
  $('comparison').textContent='השווה לעותק האחרון שזה עתה בדקת, באותו סלוט וחיבור רשת. המתן להופעת המסגרות והנתונים, ואז עבור שלוש פעמים Calendar → Home. האם המהירות דומה, או שהוספת המסגרות יצרה האטה ברורה?';
  $('download').download='Widgy_Home_Minimal_Backdrop_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=minimal-native&v=minimal-backdrop-1';
  $('baseline-link').textContent='העותק הקודם עם הנתונים וללא המסגרות, להשוואה';
}else if(minimalNative){
  document.title='בדיקת הנתונים החיים ב־Home';
  $('heading').textContent='הוספת מזג האוויר ונתוני הכושר.';
  $('explanation').textContent='אותו עותק אחרון עם השעון, האירועים, הברכה, התאריך ואחוז היום. נוספו נתוני מזג האוויר, צעדים, מרחק וקלוריות, שעות הזריחה והשקיעה ומספר התזכורות, מהמקורות האמיתיים ובמיקומים המקוריים. המפה, הגרפים והרקע המעוצב עדיין חסרים בכוונה.';
  $('comparison').textContent='השווה לעותק האחרון שזה עתה בדקת, באותו סלוט וחיבור רשת. לאחר שהנתונים נטענו, עבור שלוש פעמים Calendar → Home. האם המעבר נשאר באותה מהירות, או שכעת חזרה האטה ברורה?';
  $('download').download='Widgy_Home_Minimal_Native_Data_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=minimal-time&v=minimal-native-1';
  $('baseline-link').textContent='העותק הקודם עם הברכה והתאריך, להשוואה';
}else if(minimalTime){
  document.title='בדיקת רכיבי הזמן ב־Home';
  $('heading').textContent='הוספת הברכה, התאריך ואחוז היום.';
  $('explanation').textContent='זהה לעותק האחרון עם השעון והאירועים, בתוספת הברכה לפי השעה, התאריך ואחוז התקדמות היום. כל הפונטים, המיקומים והמקורות המקוריים נשמרים. פס ההתקדמות הגרפי עדיין חסר; מוצגים רק הכיתוב והאחוז. המראה החלקי מכוון.';
  $('comparison').textContent='השווה לעותק עם השעון והאירועים שזה עתה בדקת, באותו סלוט וחיבור רשת. אחרי הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. האם המעבר עדיין מהיר יחסית, או שהופיעה האטה ברורה?';
  $('download').download='Widgy_Home_Minimal_Time_Text_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=minimal-events&v=minimal-time-1';
  $('baseline-link').textContent='העותק עם השעון והאירועים, להשוואה';
}else if(minimalEvents){
  document.title='בדיקת שדות האירועים ב־Home';
  $('heading').textContent='השעון + שדות האירועים.';
  $('explanation').textContent='זהה לעותק המינימלי עם השעון שהיה מהיר, בתוספת ארבעה שדות בלבד: מספר האירועים, הכיתוב שלצדו, שם האירוע ושורת המצב והשעה. הם מציגים נתוני יומן אמיתיים, בפונטים ובמיקומים המקוריים. כל היתר נשאר כמו בבדיקה הקודמת; המראה החלקי מכוון.';
  $('comparison').textContent='השווה לעותק המינימלי עם השעון שזה עתה בדקת, באותו סלוט וחיבור רשת. אחרי הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. האם המעבר נשאר מהיר גם כשהאירועים מוצגים, או שההמתנה חזרה?';
  $('download').download='Widgy_Home_Minimal_Events_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=minimal-clock&v=minimal-events-1';
  $('baseline-link').textContent='העותק המינימלי עם השעון בלבד, להשוואה';
}else if(minimalLiveClock){
  document.title='בדיקה ב׳ עם השעון המאושר';
  $('heading').textContent='בדיקה ב׳ + השעון בלבד.';
  $('explanation').textContent='אותו Home מינימלי שהיה מהיר בבדיקה ב׳, עם השעון הישן והמאושר בלבד. Home יציג רקע, ניווט ושעון בגודל ובפונט המקוריים. כל שאר המקורות והכרטיסיות זהים לבדיקה ב׳. זו בדיקת אבחון; המראה הריק מכוון.';
  $('comparison').textContent='השווה לבדיקה ב׳ המקורית באותו סלוט וחיבור רשת; יש קישור אליה למטה. אחרי הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. האם Home נשאר מהיר, או שהוספת השעון מחזירה את ההמתנה?';
  $('download').download='Widgy_Home_Minimal_Live_Clock_Diagnostic.json';
  $('baseline-test').hidden=false;
}else if(weatherArtOff){
  document.title='בדיקת אייקון מזג האוויר ב־Home';
  $('heading').textContent='בדיקה אחרונה: אייקון מזג האוויר.';
  $('explanation').textContent='זהה לבדיקת Progress-Off האחרונה, עם שינוי נוסף אחד: אייקון מזג האוויר ב־Home וקבוצות התנאים שלו הוסרו זמנית. הטמפרטורות, הטקסט, כל הנתונים האמיתיים, השעון הישן והמפה נשמרים. מילוי טבעת הצעדים ופס היום עדיין חסרים, כמו בבדיקה הקודמת.';
  $('comparison').textContent='השווה לעותק Progress-Off האחרון באותו סלוט וחיבור רשת. לאחר שהמפה והנתונים נטענו, עבור שלוש פעמים Calendar → Home. האם יש שיפור מורגש לעומת הבדיקה הקודמת?';
  $('download').download='Widgy_Home_Weather_Art_Off_Diagnostic.json';
}else if(progressOff){
  document.title='בדיקת הגרפים של Home';
  $('heading').textContent='בדיקת טבעת הצעדים ופס היום.';
  $('explanation').textContent='עותק של הווידג׳ט המלא עם השעון הישן והנתונים האמיתיים. הוסרו זמנית רק המילוי של טבעת הצעדים ופס התקדמות היום: 200 שכבות. מספר הצעדים, אחוז היום, המסגרות, המפה וכל שאר התוכן נשמרים. זו בדיקת אבחון; הגרפים החסרים מכוונים.';
  $('comparison').textContent='השווה לווידג׳ט המלא עם השעון הישן, באותו סלוט וחיבור רשת. לאחר שהמפה והנתונים נטענו, עבור שלוש פעמים Calendar → Home. האם ההמתנה התקצרה באופן מורגש?';
  $('download').download='Widgy_Home_Progress_Off_Diagnostic.json';
}else if(minimalHome){
  document.title='בדיקת Home מינימלי';
  $('heading').textContent='בדיקה ב׳: Home מינימלי.';
  $('explanation').textContent='בדיקת אבחון: Home יהיה כמעט ריק, עם רקע ופס הניווט בלבד. Calendar ושאר הכרטיסיות נשמרים. כל המשתנים נשמרים כמו בבדיקה א׳. העותק הזה בודק אם ההמתנה נשארת גם לאחר הסרת תוכן Home.';
  $('comparison').textContent='לאחר הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. האם גם Home הריק איטי, או שכעת המעבר מהיר יותר?';
  $('download').download='Widgy_Home_Minimal_Diagnostic.json';
}else if(clockOff){
  document.title='בדיקת Home עם שעון קבוע';
  $('heading').textContent='בדיקה א׳: שעון קבוע.';
  $('explanation').textContent='בהשוואה לעותק Native-Data-Off שכבר בדקת, משתנה כאן רק מקור השעון הגדול: במקום שעון חי הוא מציג זמנית 12:34. הפונט, הגודל, השכבות, הכפתורים וכל שאר המקורות נשמרים.';
  $('comparison').textContent='לאחר הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. האם המעבר מהיר יותר? אם אין שינוי, המשך לבדיקה ב׳ באמצעות הקישור למטה.';
  $('download').download='Widgy_Home_Clock_Off_Diagnostic.json';
  $('next-test').hidden=false;
}else if(nativeDataOff){
  document.title='בדיקת מקורות הנתונים של Home';
  $('heading').textContent='בדיקת הנתונים של Home.';
  $('explanation').textContent='עותק בדיקה המבוסס על Map-City-Off. נתוני מזג האוויר, הצעדים, המרחק, הקלוריות, מספר התזכורות ושעות הזריחה והשקיעה ב־Home מוחלפים זמנית בנתוני דוגמה. יופיע TEST DATA. המפה עדיין ריקה והעיר TEST; השעון והיומנים ממשיכים לפעול. כל השכבות והכפתורים נשמרים.';
  $('comparison').textContent='לאחר הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. השווה לעותק Map-City-Off האחרון באותו סלוט וחיבור רשת: האם ההמתנה ל־Home התקצרה? האם עדיין יש פער מול הכניסה ל־Calendar?';
  $('download').download='Widgy_Home_Native_Data_Off_Diagnostic.json';
}else if(cityOff){
  document.title='בדיקת Home ללא המפה וקריאת העיר';
  $('heading').textContent='בדיקת Home ללא קריאת העיר.';
  $('explanation').textContent='בהשוואה לעותק ללא המפה שכבר בדקת, כאן כבויה גם קריאת העיר החיצונית של Calendar. שם העיר יופיע זמנית כ־TEST. נתוני היומנים, יתר מקורות הנתונים, השכבות והכפתורים נשארים זהים לעותק הקודם.';
  $('comparison').textContent='לאחר הטעינה הראשונה, עבור שלוש פעמים Calendar → Home באותו חיבור רשת. השווה לעותק הקודם ללא המפה: האם החזרה ל־Home מהירה משמעותית, או כמעט אותו דבר?';
  $('download').download='Widgy_Home_Map_City_Off_Diagnostic.json';
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
    const transform=minimalBackdrop ? withMinimalHomeBackdrop : minimalNative ? withMinimalHomeNativeData : minimalTime ? withMinimalHomeTimeText : minimalEvents ? withMinimalHomeEvents : minimalLiveClock ? withMinimalHomeLiveClock : minimalHome ? withMinimalHome : clockOff ? withoutHomeLiveClock : nativeDataOff ? withoutHomeNativeData : cityOff ? withoutHomeMapAndCityLookup : withoutHomeMap;
    const original=JSON.parse(result.payload);
    payload=JSON.stringify(weatherArtOff ? withoutHomeWeatherArtwork(original) : progressOff ? withoutHomeProgressArtwork(original) : transform(perf5DiagnosticBaseline(original)));
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status(minimalBackdrop ? 'עותק Minimal Backdrop מוכן. נוספה רק שכבת הזכוכית והמסגרות המקורית.' : minimalNative ? 'עותק Minimal Native Data מוכן. נתוני מזג האוויר והכושר, זריחה ושקיעה ותזכורות חזרו לפעול.' : minimalTime ? 'עותק Minimal Time Text מוכן. נוספו הברכה, התאריך ואחוז התקדמות היום.' : minimalEvents ? 'עותק Minimal Events מוכן. Home יציג את השעון וארבעת שדות האירועים.' : minimalLiveClock ? 'עותק Minimal Live Clock מוכן. Home יציג רק רקע, ניווט ואת השעון המאושר.' : weatherArtOff ? 'עותק Weather-Art-Off מוכן. אייקון מזג האוויר חסר בכוונה; הטמפרטורות, המפה והשעון פעילים.' : progressOff ? 'עותק Progress-Off מוכן. המפה והשעון הישן פעילים; רק מילוי טבעת הצעדים ופס היום חסרים זמנית.' : minimalHome ? 'עותק Home Minimal מוכן. Home יהיה כמעט ריק, עם פס הניווט.' : clockOff ? 'עותק Clock-Off מוכן. השעון ב־Home יישאר זמנית על 12:34.' : nativeDataOff ? 'עותק Native-Data-Off מוכן. נתוני הדוגמה ב־Home מסומנים TEST DATA. זהו עותק אבחון זמני.' : cityOff ? 'עותק Map-City-Off מוכן. המפה ריקה ושם העיר הוא TEST. זהו עותק אבחון זמני.' : 'עותק האבחון מוכן. אזור המפה יהיה ריק; שאר הווידג׳ט נשאר זהה.');
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
