import {loadHomeBackdropDataURL} from './widget-home-backdrop-data.js?v=embedded-backdrop-1';
import {perf5DiagnosticBaseline,withoutHomeMap,withoutHomeMapAndCityLookup,withoutHomeNativeData,withoutHomeLiveClock,withMinimalHome,withMinimalHomeLiveClock,withMinimalHomeEvents,withMinimalHomeTimeText,withMinimalHomeNativeData,withMinimalHomeBackdrop,withMinimalHomeEmbeddedBackdrop,withCompleteHomeArtwork,withCompleteHomeMap,withCompleteHomeStaticMap,withCompleteHomeMapWithoutCityFetch,withCompleteHomeSynchronousMap,withCompleteHomeStableMapURL,withCompleteHomeFixedLocationMap,withCompleteHomeDirectFixedMap,withCompleteHomeCDNFixedMap,withCompleteHomeDirectLiveMap,withCompleteHomeNativeLocationMap,withHomeMapBindingProbe,withoutHomeProgressArtwork,withoutHomeWeatherArtwork} from './widget-home-map-diagnostic.js?v=stable-map-recovery-1';
import {prepareWidget} from './calendar-widget-export.js?v=perf-5-ringfix-1';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(window.location.search);
const stableNativeCity=params.get('home')==='stable-native-city';
const cdnFixedMap=params.get('home')==='cdn-fixed-map';
const directFixedMap=params.get('home')==='direct-fixed-map';
const fixedLocationMap=params.get('home')==='fixed-map-location';
const stableMapURL=params.get('home')==='stable-map-url';
const synchronousMap=params.get('home')==='sync-map';
const bindingProbe=params.get('home')==='map-binding-check';
const nativeLocationMap=params.get('home')==='native-location-map';
const directLiveMap=params.get('home')==='direct-live-map';
const mapNoCity=params.get('home')==='map-no-city';
const staticMap=params.get('home')==='static-map';
const mapAddback=stableNativeCity || cdnFixedMap || directFixedMap || fixedLocationMap || stableMapURL || synchronousMap || bindingProbe || nativeLocationMap || directLiveMap || mapNoCity || staticMap || params.get('home')==='map-addback';
const fullArtwork=mapAddback || params.get('home')==='full-artwork';
const embeddedBackdrop=fullArtwork || params.get('home')==='embedded-backdrop';
const minimalBackdrop=embeddedBackdrop || params.get('home')==='minimal-backdrop';
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
if(stableNativeCity){
  document.title='חזרה לעותק Home שבו המפה עבדה';
  $('heading').textContent='חזרה למנגנון המפה שעבד.';
  $('explanation').textContent='הבדיקה עם שם העיר לא טענה את המפה. כפתור ההעתקה מחזיר כעת את עותק Stable Map URL הקודם, שבו המפה וסימון המיקום הופיעו. שם העיר במפה חסר זמנית ובמקומו קואורדינטות קצרות; Calendar עדיין מציג TEST. העיצוב, השעון ואיכות המפה נשמרים.';
  $('comparison').textContent='ייבא את העותק ובדוק רק שהמפה וסימון המיקום חוזרים להופיע. אין צורך לבצע כרגע עוד השוואת מהירות.';
  $('download').download='Widgy_Home_Stable_Map_URL_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=stable-map-url&v=stable-map-recovery-1';
  $('baseline-link').textContent='עמוד הבדיקה המקורי של אותו עותק';
}else if(cdnFixedMap){
  document.title='בדיקת מסירת המפה דרך CDN';
  $('heading').textContent='אותה מפה, דרך מטמון ההפצה.';
  $('explanation').textContent='עותק זה מציג את אותה מפת דוגמה באותה איכות, עם שינוי בדרך ההגשה: התמונה יכולה להישמר לזמן קצר גם ברשת ההפצה של Vercel. הסימון נשאר זמנית בנקודת הדוגמה 0°,0°. העיצוב ושאר הנתונים זהים לעותק האחרון; Calendar עדיין מציג TEST.';
  $('comparison').textContent='המתן שהמפה וסימון הדוגמה יופיעו. עבור באותו סלוט שלוש פעמים Calendar → Home, ואז פעם נוספת אחרי דקה. האם המעברים השתפרו לעומת Direct Fixed Map? אם המפה או הסימון חסרים, דווח על כך.';
  $('download').download='Widgy_Home_CDN_Fixed_Map_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=direct-fixed-map&v=cdn-fixed-map-1';
  $('baseline-link').textContent='עותק Direct Fixed Map הקודם, להשוואה';
}else if(directFixedMap){
  document.title='בדיקת אותה מפה ללא סקריפט';
  $('heading').textContent='אותה כתובת מפה, בלי סקריפט.';
  $('explanation').textContent='עותק זה מבקש בדיוק את אותה כתובת תמונה כמו Fixed Location Map, כשהכתובת כתובה ישירות במקום להיווצר בסקריפט. נקודת הדוגמה 0°,0°, איכות המפה, העיצוב ושאר הנתונים נשמרים. Calendar עדיין מציג TEST. המיקום הקבוע הוא לצורך הבדיקה בלבד.';
  $('comparison').textContent='המתן שהמפה וסימון הדוגמה יופיעו. עבור באותו סלוט שלוש פעמים Calendar → Home והשווה לעותק Fixed Location Map האחרון: מהיר יותר, אותו הדבר או איטי יותר? אם המפה או הסימון חסרים, דווח על כך לפני השוואת המהירות.';
  $('download').download='Widgy_Home_Direct_Fixed_Map_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=fixed-map-location&v=direct-fixed-map-1';
  $('baseline-link').textContent='עותק Fixed Location Map עם הסקריפט, להשוואה';
}else if(fixedLocationMap){
  document.title='בדיקת מפה עם מיקום דוגמה קבוע';
  $('heading').textContent='אותה מפה, עם מיקום דוגמה קבוע.';
  $('explanation').textContent='בעותק הזה סימון המיקום מופיע זמנית בנקודת הדוגמה 0°,0°, ולא במיקום שלך. ביחס ל־Stable Map URL הוחלפו רק קלטי המיקום של מנגנון המפה בערכים קבועים. המפה, האיכות, העיצוב ושאר הנתונים נשמרים; Calendar עדיין מציג TEST. זו בדיקה בלבד, ומקורות מיקום אחרים בווידג׳ט נשארים פעילים.';
  $('comparison').textContent='המתן שהמפה וסימון הדוגמה יופיעו. עבור באותו סלוט שלוש פעמים רצופות Calendar → Home, ואז פעם נוספת אחרי דקה. האם המעברים מהירים יותר מבדיקת Stable Map URL האחרונה? ציין אם המפה או סימון הדוגמה חסרים.';
  $('download').download='Widgy_Home_Fixed_Location_Map_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=stable-map-url&v=fixed-map-location-1';
  $('baseline-link').textContent='עותק Stable Map URL עם המיקום שלך, להשוואה';
}else if(stableMapURL){
  document.title='בדיקת מפה ללא החלפת כתובת מדי דקה';
  $('heading').textContent='מפה עם מיקום, בלי כתובת חדשה מדי דקה.';
  $('explanation').textContent='זהה לעותק Synchronous Map האחרון, עם שינוי אחד: הכתובת אינה מתחלפת רק בגלל שעברה דקה. המיקום נשאר פעיל, ולכן שינוי בקואורדינטות עדיין ישנה את הכתובת. המפה, האיכות והעיצוב נשמרים; שם העיר מוחלף זמנית בקואורדינטות ו־Calendar מציג TEST. זו בדיקת מהירות; תדירות עדכון היום־לילה עדיין טעונה בדיקה.';
  $('comparison').textContent='המתן שהמפה וסימון המיקום יופיעו. עבור באותו סלוט שלוש פעמים רצופות Calendar → Home, ואחר כך פעם נוספת אחרי דקה. ציין אם המעברים מהירים יותר מהעותק האחרון, ואם אחרי הדקה ההמתנה חוזרת. אם המפה או הסימון חסרים, דווח על כך לפני בדיקת המהירות.';
  $('download').download='Widgy_Home_Stable_Map_URL_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=sync-map&v=stable-map-url-1';
  $('baseline-link').textContent='עותק Synchronous Map הקודם, להשוואה';
}else if(synchronousMap){
  document.title='בדיקת החזרת כתובת המפה ב־Widgy';
  $('heading').textContent='אותה מפה, דרך אחרת למסירת הכתובת.';
  $('explanation').textContent='עותק זה חוזר למנגנון כתובת המפה שכבר הציג מפה וסימון מיקום, ומחליף את אופן החזרת הכתובת ל־Widgy. המפה החיה, הרזולוציה והעיצוב נשמרים. כמו בבדיקת Live Map No City Fetch, שם העיר מוחלף זמנית בקואורדינטות קצרות; שם העיר ב־Calendar נשאר TEST. לוח האבחון הוסר.';
  $('comparison').textContent='המתן שהמפה וסימון המיקום יופיעו. אם שניהם תקינים, עבור באותו סלוט שלוש פעמים Calendar → Home והשווה לבדיקת Live Map No City Fetch שבה חזרה האיטיות הקיצונית. האם המעבר מהיר יותר, זהה או איטי יותר? אם המפה או הסימון חסרים, דווח על כך לפני בדיקת המהירות.';
  $('download').download='Widgy_Home_Synchronous_Map_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=map-no-city&v=sync-map-1';
  $('baseline-link').textContent='בדיקת Live Map No City Fetch הקודמת, להשוואה';
}else if(bindingProbe){
  document.title='בדיקת כתובת המפה בתוך Widgy';
  $('heading').textContent='בדיקת הכתובת שנוצרת בפועל.';
  $('explanation').textContent='העותק הזה מציג לוח אבחון זמני על אזור השעון והאירועים: נתוני המיקום של Widgy, חיבורם לטקסט וכתובת המפה הסופית. מעליו המפה נטענת בכתובת קבועה ללא מיקום, כבדיקת ביקורת. ערכי המיקום יופיעו בצילום; קישורי היומן הפרטיים אינם מוצגים. זו בדיקת תקלה, לא עיצוב חדש ולא בדיקת מהירות.';
  $('comparison').textContent='ייבא את העותק ושלח צילום מלא וברור של לוח האבחון. אם הכתובת בשורה התחתונה קטנה מדי, הוסף צילום מוגדל שלה. ציין גם אם המפה מופיעה בחלק העליון. אין צורך לבדוק מעברים בעותק הזה.';
  $('download').download='Widgy_Home_Map_Binding_Check.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=direct-live-map&v=map-binding-check-1';
  $('baseline-link').textContent='עותק המפה הישירה ללא לוח האבחון';
}else if(nativeLocationMap){
  document.title='בדיקת מיקום ישיר במפה';
  $('heading').textContent='מיקום ישיר — בדיקה מתוקנת 2.';
  $('explanation').textContent='תוקן אופן חיבור כתובת המפה לאחר שהעותק הקודם הציג אזור שחור. המיקום והעיר עדיין מגיעים מהמקורות המובנים של Widgy, בלי סקריפט המפה ובלי שירות העיר החיצוני. איכות המפה והעיצוב נשמרים. קודם יש לוודא שהמפה חוזרת להופיע. שם העיר ב־Calendar עדיין TEST; תדירות עדכון היום־לילה תיבדק בנפרד.';
  $('comparison').textContent='תחילה ודא שהמפה, סימון המיקום ושם העיר הנכון מופיעים. אם משהו חסר או שגוי, דווח על כך. אם הכול תקין, עבור באותו סלוט שלוש פעמים Calendar → Home והשווה לבדיקה הקודמת ללא סימון המיקום: האם החזרת המיקום האטה את המעבר?';
  $('download').download='Widgy_Home_Native_Location_Map_2.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=direct-live-map&v=native-location-map-2';
  $('baseline-link').textContent='העותק הקודם ללא סימון המיקום, להשוואה';
}else if(directLiveMap){
  document.title='בדיקת מפה חיה בטעינה ישירה';
  $('heading').textContent='מפת יום־לילה בכתובת ישירה.';
  $('explanation').textContent='המפה מגיעה שוב מהשרת שמייצר את מצב היום־לילה, אך הפעם בכתובת קבועה, ללא הסקריפט שמכין אותה וללא מיקום או קריאת עיר. המידות והאיכות נשמרות. סימון המיקום ושם העיר חסרים בכוונה. זו בדיקת טעינה; תדירות העדכון האוטומטי תיבדק בנפרד.';
  $('comparison').textContent='המתן שתמונת המפה תופיע, ואז עבור באותו סלוט שלוש פעמים Calendar → Home. האם האיטיות הקיצונית נעלמה והמהירות קרובה לבדיקת המפה הקבועה, או שהמעבר עדיין איטי מאוד? אם המפה חסרה, דווח על כך.';
  $('download').download='Widgy_Home_Direct_Live_Map_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=static-map&v=direct-live-map-1';
  $('baseline-link').textContent='העותק עם המפה הקבועה שהיה מהיר יותר, להשוואה';
}else if(mapNoCity){
  document.title='בדיקת מפה חיה ללא המתנה לקריאת העיר';
  $('heading').textContent='מפה חיה, בלי להמתין לשירות העיר.';
  $('explanation').textContent='מפת היום־לילה החיה וסימון המיקום חזרו. כתובת המפה נמסרת כעת מיד, בלי קריאה לשירות העיר החיצוני. שם העיר שעל המפה יוחלף זמנית בקואורדינטות קצרות. הרזולוציה, העיצוב ושאר מקורות הנתונים נשמרים; שם העיר ב־Calendar עדיין TEST.';
  $('comparison').textContent='המתן שהמפה וסימון המיקום יופיעו, ואז עבור באותו סלוט שלוש פעמים Calendar → Home. האם השיפור שהיה עם המפה הקבועה נשמר, או שההמתנה הגדולה חזרה? אם המפה או סימון המיקום חסרים, דווח על כך.';
  $('download').download='Widgy_Home_Live_Map_No_City_Fetch_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=static-map&v=map-no-city-1';
  $('baseline-link').textContent='העותק הקודם עם המפה הקבועה, להשוואה';
}else if(staticMap){
  document.title='בדיקת תמונת מפה קבועה ב־Home';
  $('heading').textContent='מפה קבועה בגודל ובאיכות המקוריים.';
  $('explanation').textContent='זהה לעותק האחרון שהאט, עם שינוי אחד: מנגנון הטעינה הדינמי של המפה הוחלף בקישור לתמונת מפה קבועה. התמונה נוצרה מהמנוע ומהקבצים המאושרים, באותה רזולוציה וללא אובדן איכות. מצב היום־לילה קבוע וסימון המיקום האישי חסר בכוונה. כל שאר הווידג׳ט זהה.';
  $('comparison').textContent='המתן שתמונת המפה תופיע, ואז עבור באותו סלוט שלוש פעמים Calendar → Home. האם המעבר מהיר יותר לעומת הבדיקה האחרונה עם המפה הדינמית, או שההאטה נשארה? אם המפה חסרה, דווח על כך.';
  $('download').download='Widgy_Home_Static_Map_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=map-addback&v=static-map-1';
  $('baseline-link').textContent='העותק הקודם עם המפה הדינמית, להשוואה';
}else if(mapAddback){
  document.title='בדיקת החזרת המפה ל־Home';
  $('heading').textContent='אותו Home מלא, עם המפה.';
  $('explanation').textContent='זהה לעותק האחרון עם כל הגרפיקה, בתוספת המפה המקורית ומנגנון הטעינה שלה בלבד. העיצוב, השעון, המסגרות המוטמעות וכל יתר הנתונים נשמרים. שם העיר של Calendar עדיין TEST, כדי לבדוק את המפה בנפרד.';
  $('comparison').textContent='המתן עד שהמפה עצמה מופיעה, ואז עבור באותו סלוט שלוש פעמים Calendar → Home. השווה לעותק הקודם ללא המפה: האם ההמתנה גדלה במעברים החוזרים, או רק בטעינת המפה הראשונה? אם המפה לא מופיעה, דווח על כך.';
  $('download').download='Widgy_Home_Map_Add_Back_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=full-artwork&v=map-addback-1';
  $('baseline-link').textContent='העותק הקודם עם כל הגרפיקה וללא המפה, להשוואה';
}else if(fullArtwork){
  document.title='בדיקת הגרפיקה המלאה ב־Home';
  $('heading').textContent='החזרת הגרפיקה שנותרה ב־Home.';
  $('explanation').textContent='זהה לעותק האחרון עם המסגרות המוטמעות שכבר נראו תקין. הוחזרו טבעת הצעדים, פס התקדמות היום, אייקון מזג האוויר ויתר הסמלים והקווים המקוריים. השעון וכל הנתונים נשארו זהים. המפה עדיין חסרה ושם העיר ב־Calendar עדיין TEST.';
  $('comparison').textContent='השווה לעותק האחרון עם המסגרות המוטמעות, באותו סלוט וחיבור רשת. אחרי הטעינה הראשונה, עבור שלוש פעמים Calendar → Home. האם חזרה ההמתנה הגדולה, או שהמהירות דומה לבדיקה הקודמת?';
  $('download').download='Widgy_Home_Complete_Artwork_Diagnostic.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=embedded-backdrop&v=full-artwork-1';
  $('baseline-link').textContent='העותק האחרון עם המסגרות המוטמעות, להשוואה';
}else if(embeddedBackdrop){
  document.title='בדיקת תמונת עיצוב מוטמעת ב־Home';
  $('heading').textContent='אותה תמונה, בתוך קובץ הווידג׳ט.';
  $('explanation').textContent='עותק ניסיון של הבדיקה האחרונה: קובץ התמונה המקורי של הזכוכית והמסגרות נשמר בתוך הווידג׳ט, במקום כתובת התמונה ברשת. התמונה זהה לחלוטין, ללא שינוי איכות או מידות. קודם צריך לאמת ש־Widgy מציג אותה בצורת הייבוא הזו.';
  $('comparison').textContent='קודם ודא שהזכוכית וכל המסגרות מופיעות כמו בעותק האחרון. אם הן חסרות או השתנו, דווח על כך; אין משמעות להשוואת מהירות במצב הזה. אם המראה זהה, עבור באותו סלוט שלוש פעמים Calendar → Home והשווה לעותק האחרון.';
  $('download').download='Widgy_Home_Embedded_Backdrop_Trial.json';
  $('baseline-test').hidden=false;
  $('baseline-link').href='./widgy-home-map-diagnostic.html?home=minimal-backdrop&v=embedded-backdrop-1';
  $('baseline-link').textContent='העותק האחרון עם תמונת המסגרות המקורית ברשת, להשוואה';
}else if(minimalBackdrop){
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
  backdrop_image_failed:'לא ניתן להכין כרגע את התמונה המוטמעת. נסה שוב בעוד רגע.',
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
    payload=JSON.stringify(stableNativeCity ? withCompleteHomeStableMapURL(original,await loadHomeBackdropDataURL()) : cdnFixedMap ? withCompleteHomeCDNFixedMap(original,await loadHomeBackdropDataURL()) : directFixedMap ? withCompleteHomeDirectFixedMap(original,await loadHomeBackdropDataURL()) : fixedLocationMap ? withCompleteHomeFixedLocationMap(original,await loadHomeBackdropDataURL()) : stableMapURL ? withCompleteHomeStableMapURL(original,await loadHomeBackdropDataURL()) : synchronousMap ? withCompleteHomeSynchronousMap(original,await loadHomeBackdropDataURL()) : bindingProbe ? withHomeMapBindingProbe(original,await loadHomeBackdropDataURL()) : nativeLocationMap ? withCompleteHomeNativeLocationMap(original,await loadHomeBackdropDataURL()) : directLiveMap ? withCompleteHomeDirectLiveMap(original,await loadHomeBackdropDataURL()) : mapNoCity ? withCompleteHomeMapWithoutCityFetch(original,await loadHomeBackdropDataURL()) : staticMap ? withCompleteHomeStaticMap(original,await loadHomeBackdropDataURL()) : mapAddback ? withCompleteHomeMap(original,await loadHomeBackdropDataURL()) : fullArtwork ? withCompleteHomeArtwork(original,await loadHomeBackdropDataURL()) : embeddedBackdrop ? withMinimalHomeEmbeddedBackdrop(perf5DiagnosticBaseline(original),await loadHomeBackdropDataURL()) : weatherArtOff ? withoutHomeWeatherArtwork(original) : progressOff ? withoutHomeProgressArtwork(original) : transform(perf5DiagnosticBaseline(original)));
    downloadURL=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    $('download').href=downloadURL;$('download').hidden=false;$('copy').disabled=false;
    status(stableNativeCity ? 'העותק הקודם Stable Map URL מוכן להעתקה. בדוק שהמפה וסימון המיקום חזרו.' : cdnFixedMap ? 'עותק CDN Fixed Map מוכן. המתן למפה ולסימון הדוגמה לפני בדיקת המעברים.' : directFixedMap ? 'עותק Direct Fixed Map מוכן. המתן למפה ולסימון הדוגמה, ואז השווה את המעבר לעותק האחרון.' : fixedLocationMap ? 'עותק Fixed Location Map מוכן. הסימון יופיע זמנית בנקודת הדוגמה 0°,0°. ודא שהוא מופיע לפני השוואת המהירות.' : stableMapURL ? 'עותק Stable Map URL מוכן. בדוק שהמפה וסימון המיקום מופיעים, ואז השווה את המעברים מיד ושוב אחרי דקה.' : synchronousMap ? 'עותק Synchronous Map מוכן. ודא שהמפה וסימון המיקום מופיעים, ואז בדוק את המעבר Calendar → Home.' : bindingProbe ? 'עותק Map Binding Check מוכן. שלח צילום של לוח האבחון; זו אינה בדיקת מהירות.' : nativeLocationMap ? 'עותק Native Location Map 2 מוכן. ודא שהמיקום והעיר מופיעים נכון לפני השוואת המהירות.' : directLiveMap ? 'עותק Direct Live Map מוכן. המתן להופעת המפה לפני ההשוואה; סימון המיקום חסר בכוונה.' : mapNoCity ? 'עותק Live Map No City Fetch מוכן. המפה חיה; שם העיר מוחלף זמנית בקואורדינטות קצרות.' : staticMap ? 'עותק Static Map מוכן. תמונת המפה קבועה בכוונה; המתן להופעתה לפני בדיקת המעברים.' : mapAddback ? 'עותק Map Add-Back מוכן. המפה ומנגנון הטעינה המקורי הוחזרו; המתן להופעתה לפני ההשוואה.' : fullArtwork ? 'עותק Complete Artwork מוכן. כל הגרפיקה של Home הוחזרה; המפה עדיין חסרה.' : embeddedBackdrop ? 'עותק Embedded Backdrop מוכן. אחרי הייבוא יש לוודא שהזכוכית והמסגרות מופיעות כרגיל לפני השוואת המהירות.' : minimalBackdrop ? 'עותק Minimal Backdrop מוכן. נוספה רק שכבת הזכוכית והמסגרות המקורית.' : minimalNative ? 'עותק Minimal Native Data מוכן. נתוני מזג האוויר והכושר, זריחה ושקיעה ותזכורות חזרו לפעול.' : minimalTime ? 'עותק Minimal Time Text מוכן. נוספו הברכה, התאריך ואחוז התקדמות היום.' : minimalEvents ? 'עותק Minimal Events מוכן. Home יציג את השעון וארבעת שדות האירועים.' : minimalLiveClock ? 'עותק Minimal Live Clock מוכן. Home יציג רק רקע, ניווט ואת השעון המאושר.' : weatherArtOff ? 'עותק Weather-Art-Off מוכן. אייקון מזג האוויר חסר בכוונה; הטמפרטורות, המפה והשעון פעילים.' : progressOff ? 'עותק Progress-Off מוכן. המפה והשעון הישן פעילים; רק מילוי טבעת הצעדים ופס היום חסרים זמנית.' : minimalHome ? 'עותק Home Minimal מוכן. Home יהיה כמעט ריק, עם פס הניווט.' : clockOff ? 'עותק Clock-Off מוכן. השעון ב־Home יישאר זמנית על 12:34.' : nativeDataOff ? 'עותק Native-Data-Off מוכן. נתוני הדוגמה ב־Home מסומנים TEST DATA. זהו עותק אבחון זמני.' : cityOff ? 'עותק Map-City-Off מוכן. המפה ריקה ושם העיר הוא TEST. זהו עותק אבחון זמני.' : 'עותק האבחון מוכן. אזור המפה יהיה ריק; שאר הווידג׳ט נשאר זהה.');
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
