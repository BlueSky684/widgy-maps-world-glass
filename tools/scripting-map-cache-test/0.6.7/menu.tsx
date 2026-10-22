import { Button, List, Navigation, NavigationStack, Section, Text, useState } from "scripting"
import { api, preview, updateLiveMap, VERSION } from "./bridge"
import { prepareShortcutWriter } from "./writer"
import { SafeMapError } from "./platform"
import { startRecurring, stopRecurring, scheduleStatus, TICK_TITLE } from "./scheduler"
import { lastUpdateStatus } from "./quiet"
import { nativeHistory } from "./native-transfer"
import { SETUP } from "./setup"

// UI tap suppression; cross-process serialization is enforced in lock.ts.
let active = false

function TestMenu() {
  const dismiss = Navigation.useDismiss()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("0.6.7 מוסיפה ניסיון התאוששות יחיד ומפחיתה קריאות חוזרות של המפה. זו גרסת בדיקה. הקיצור הקיים מ־0.6.5 או 0.6.6 נשאר כפי שהוא.")
  async function run(work: () => Promise<string>, showResult = true) {
    if (active) return
    active = true; setBusy(true)
    try {
      const result = await work()
      setStatus(result)
      if (showResult) await api("Dialog").alert({ title: "Map Cache Test", message: result, buttonLabel: "הבנתי" })
    } catch (error) {
      const detail = error instanceof SafeMapError ? error.message :
        "לא ניתן להשלים את הפעולה כעת. בדוק את החיבור והרשאות המיקום ונסה שוב."
      const message = "הפעולה לא הושלמה:\n" + detail +
        "\n\nאפשר לבדוק את הקובץ הקיים דרך ״הצגת המפה השמורה״."
      setStatus(message)
      await api("Dialog").alert({ title: "תוצאת הבדיקה", message, buttonLabel: "סגירה" })
    } finally { active = false; setBusy(false) }
  }
  return <NavigationStack>
    <List navigationTitle={`Map Cache Test 2400 · ${VERSION}`} navigationBarTitleDisplayMode="inline">
      <Section header={<Text>בדיקת מסלול חדש · 2400 × 1131</Text>}>
        <Text>גודל המפה הוא 2400 × 1131, לפי המיקום והשעה שנשלחו בקיצור. הורדה שנדחתה לפני החלפת הקובץ משאירה את המפה הקודמת. השמירה כוללת גיבוי ובדיקת קריאה חוזרת.</Text>
        <Text>{status}</Text>
      </Section>
      <Section header={<Text>עדכון מ־0.6.5 או 0.6.6</Text>}>
        <Text>עצור את התזמון לפני הייבוא. אם הקיצור כבר מוריד את הקובץ ושולח אותו לפעולת Run השנייה, השאר אותו כפי שהוא. לאחר הייבוא הרץ את ״בדיקת מפה״ פעם אחת ובדוק את התוצאה; אחרי הצלחה הפעל שוב כל 15 דקות.</Text>
        <Text>עד שתי דקות מהכנת הבקשה ומיקום שגילו עד שתי דקות; לשלב השמירה עצמו מגבלה נפרדת של 20 שניות לפני התחלת החלפת המפה. ההיסטוריה מציגה את הזמנים בנפרד.</Text>
        <Button title="הוראות הקיצור — להתקנה ראשונה" disabled={busy} action={() => run(async () => SETUP)} />
        <Text>לא משנים את החיבור ל־Widgy, את שם הסקריפט או את כותרת האוטומציה. הקיצור הישן עדיין תואם, אך ממשיך להשתמש בהורדה הישנה.</Text>
      </Section>
      <Section header={<Text>התראות ותוצאת העדכון</Text>}>
        <Text>הצלחה שקטה. בכל אחד משני שלבי הסקריפט: אם התוצאה מכילה ״לא הושלם״ — הצגת עדכון עם אותה תוצאה. אין צורך לשנות את הגדרות ההתראות.</Text>
        <Button title="תוצאת העדכון האחרון" disabled={busy} action={() => run(lastUpdateStatus)} />
        <Button title="היסטוריית 64 הרצות — מסלול קיצורים" disabled={busy} action={() => run(nativeHistory)} />
        <Text>כשהתזמון פעיל, הורדה שלא הסתיימה בתוך שתי דקות יכולה להפעיל ניסיון התאוששות יחיד עם נתונים חדשים. כשל זמן שהתגלה בשלב השמירה יכול לבקש את הניסיון בעוד כדקה. אחרי שהניסיון נוצל, לא יתבקש עוד ניסיון נוסף עד לעדכון מוצלח; התזמון הרגיל ממשיך.</Text>
        <Text>אם גם ניסיון ההתאוששות אינו מחזיר תוצאה, תתבקש תזכורת לבדוק את מצב המפה. התזכורת אינה מפעילה הורדה ואינה הוכחה לכשל. אם בדיקת השלמה התפספסה, ההרצה הבאה יכולה לרשום את הכשל הקודם ולהתחיל בקשה חדשה באותה הפעלה.</Text>
        <Text>היעדר התראה אינו מוכיח שהקיצור הופעל. אם iOS אינו מפעיל את האוטומציה, גם בדיקת המעקב אינה יכולה לדווח בזמן אמת. הצלחה מאוחרת אינה מוחקת את הכשלים מההיסטוריה. זו עדיין גרסת בדיקה, לא הגרסה הסופית.</Text>
      </Section>
      <Section header={<Text>עדכונים אוטומטיים</Text>}>
        <Text>משתמשים באוטומציית ״בדיקת מפה״ שכבר הגדרת, עם הכותרת:</Text>
        <Text>{TICK_TITLE}</Text>
        <Text>אותה אוטומציה מפעילה גם את ניסיון ההתאוששות. בעדכון: עצור, ייבא, בדוק את הקיצור ידנית ואז הפעל שוב. תזמון של 15 דקות הוא בקשה למערכת ולא התחייבות להפעלה בזמן.</Text>
        <Button title="הפעלה כל 15 דקות" disabled={busy} action={() => run(startRecurring)} />
        <Button title="בדיקת מצב התזמון" disabled={busy} action={() => run(scheduleStatus)} />
        <Button title="עצירת העדכונים האוטומטיים" disabled={busy} action={() => run(stopRecurring)} />
        <Text>תוצאת העדכון נשמרת לקריאה בתפריט. רענון התמונה על המסך תלוי ב־Widgy.</Text>
      </Section>
      <Section header={<Text>המפה שלי</Text>}>
        <Button title="עדכון ידני במסלול הישן — לא לבדיקת 0.6.7" disabled={busy} action={() => run(() => updateLiveMap(setStatus))} />
        <Text>לבדיקת המסלול החדש הפעל את הקיצור המעודכן, לא את הכפתור הזה. אין צורך לחבר שוב את הקובץ ל־Widgy.</Text>
        <Text>אישור מיקום עשוי להופיע בהפעלה הראשונה. המיקום נשלח לשירות המפה הקיים לציור הסמן ושם העיר. השאר את Scripting פתוחה עד סיום העדכון.</Text>
        <Button title="הצגת המפה השמורה" disabled={busy} action={() => run(async () => { await preview(); return "התצוגה נסגרה. הקובץ נשאר במקומו." }, false)} />
      </Section>
      <Section header={<Text>הקיצור הקיים</Text>}>
        <Text>לאחר החיבור, הקיצור ״בדיקת מפה״ יעדכן את המפה המקומית לפי המיקום והשעה הנוכחיים. תמונה חדשה נשמרת לאחר בדיקה, עם גיבוי של המפה הקודמת.</Text>
        <Button title="חיבור לקיצור הקיים" disabled={busy} action={() => run(prepareShortcutWriter)} />
        <Text>החיבור משתמש בהרשאת התיקייה שכבר נתת. אם ייפתח חלון בחירה: ״ב־iPhone שלי״ → Scripting → MapCacheTest, ולחץ ״פתיחה״ לבחירת התיקייה.</Text>
        <Text>השתמש בכפתור החיבור רק אם מתקבלת הודעה שהחיבור חסר. הוא אינו מחליף את שינוי הפעולות בקיצור.</Text>
      </Section>
      <Section header={<Text>הקובץ שמחובר ל־Widgy</Text>}>
        <Text>ב־iPhone שלי → Scripting → MapCacheTest → map-current.png</Text>
        <Text>אחרי שינוי הקיצור יש לוודא שבתוצאת העדכון כתוב 0.6.7 וגם ״מסלול: הורדה בקיצורים ושמירה בסקריפט״. בהיסטוריה אמורה להופיע הרצה חדשה במצב ״הצליח״. תוצאה ריקה בקיצור אינה הוכחת הצלחה.</Text>
      </Section>
      <Button title="סגירה" disabled={busy} action={() => dismiss()} />
    </List>
  </NavigationStack>
}

export async function presentMenu() {
  await Navigation.present({ element: <TestMenu /> })
}

