import { Button, List, Navigation, NavigationStack, Section, Text, useState } from "scripting"
import { api, failureTest, preview, updateMap, updateLiveMap, VERSION } from "./bridge"
import { prepareShortcutWriter } from "./writer"
import { SafeMapError } from "./platform"
import { startRecurring, stopRecurring, scheduleStatus, TICK_TITLE } from "./scheduler"

// UI tap suppression; cross-process serialization is enforced in lock.ts.
let active = false
const instructions = "1. הורד מפה A והצג אותה. אמור להופיע TEST A.\n\n" +
  "2. צור עותק בדיקה ב־Widgy. רק בעותק, בחר בשכבת המפה Image → System → Files ובחר: ״ב־iPhone שלי״ → Scripting → MapCacheTest → map-current.png.\n\n" +
  "3. אחרי ש־A מוצגת ב־Widgy, חזור לכאן והורד B. חזור ל־Widgy ועבור Calendar → Home בלי לבחור שוב קובץ. בדוק אם מופיע TEST B.\n\n" +
  "4. הפעל בדיקת כשל ובדוק ש־B נשארת. בדיקת רשת אמיתית: במצב טיסה, נסה להוריד A ובדוק ש־B נשמרת.\n\n" +
  "המפות מסומנות לצורך בדיקה ומשתמשות במיקום ובשעה לדוגמה. זו הפעלה ידנית; השאר את Scripting פתוחה בזמן ההורדה."

function TestMenu() {
  const dismiss = Navigation.useDismiss()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("בחר עדכון לפי המיקום שלך. המפה השמורה תוחלף רק לאחר הורדה ובדיקה תקינות.")
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
    <List navigationTitle={`Map Cache Test ${VERSION}`} navigationBarTitleDisplayMode="inline">
      <Section header={<Text>מפה מקומית ועדכון מקיצורים</Text>}>
        <Text>גרסה 0.6.1: בחירה ב־2400 × 1131 שומרת על גודל התצוגה בווידג׳ט. אפשר לחזור לרזולוציה המקורית בכפתור למטה. הבחירה משמשת גם לעדכונים האוטומטיים; כשל בהורדה משאיר את המפה התקינה האחרונה.</Text>
        <Text>{status}</Text>
      </Section>
      <Section header={<Text>עדכונים אוטומטיים</Text>}>
        <Text>משתמשים באוטומציית ״בדיקת מפה״ שכבר הגדרת, עם הכותרת:</Text>
        <Text>{TICK_TITLE}</Text>
        <Text>לבדיקת הנראות, עצור את העדכונים ובחר ״עדכון ב־2400״. לאחר הבדיקה אפשר להפעיל כל 15 דקות. התזמון אינו נעצר מעצמו.</Text>
        <Button title="הפעלה כל 15 דקות" disabled={busy} action={() => run(() => startRecurring(15))} />
        <Button title="בדיקת מצב התזמון" disabled={busy} action={() => run(scheduleStatus)} />
        <Button title="עצירת העדכונים האוטומטיים" disabled={busy} action={() => run(stopRecurring)} />
        <Text>בחירת תדירות מחליפה את התזמון הקודם. השאר בינתיים את התראות התוצאה פעילות כדי לראות אם כל עדכון הסתיים.</Text>
      </Section>
      <Section header={<Text>המפה שלי</Text>}>
        <Button title="עדכון ב־2400" disabled={busy} action={() => run(() => updateLiveMap(setStatus, 2400))} />
        <Button title="חזרה לרזולוציה המקורית" disabled={busy} action={() => run(() => updateLiveMap(setStatus, 3306))} />
        <Text>כל בחירה מורידה מפה עדכנית ושומרת את הרזולוציה גם להמשך. בחזרה למקור: 3306 × 1558. אין צורך לחבר שוב את הקובץ ל־Widgy.</Text>
        <Text>אישור מיקום עשוי להופיע בהפעלה הראשונה. המיקום נשלח לשירות המפה הקיים לציור הסמן ושם העיר. השאר את Scripting פתוחה עד סיום העדכון.</Text>
        <Button title="הצגת המפה השמורה" disabled={busy} action={() => run(async () => { await preview(); return "התצוגה נסגרה. הקובץ נשאר במקומו." }, false)} />
      </Section>
      <Section header={<Text>הקיצור הקיים</Text>}>
        <Text>לאחר החיבור, הקיצור ״בדיקת מפה״ יעדכן את המפה המקומית לפי המיקום והשעה הנוכחיים. תמונה חדשה נשמרת לאחר בדיקה, עם גיבוי של המפה הקודמת.</Text>
        <Button title="חיבור לקיצור הקיים" disabled={busy} action={() => run(prepareShortcutWriter)} />
        <Text>החיבור משתמש בהרשאת התיקייה שכבר נתת. אם ייפתח חלון בחירה: ״ב־iPhone שלי״ → Scripting → MapCacheTest, ולחץ ״פתיחה״ לבחירת התיקייה.</Text>
        <Text>הקיצור הקיים עם שלוש שורות עדיין נתמך. לאבחון מלא הוסף מיד אחרי ״קבלת המיקום הנוכחי״ פעולת ״תאריך נוכחי״ חדשה והמר אותה ל־ISO 8601 עם שעה. הוסף את התאריך החדש בשורה הרביעית במלל. השורה השלישית נשארת התאריך שנוצר לפני המיקום.</Text>
      </Section>
      <Section header={<Text>הורדה ובדיקה</Text>}>
        <Button title="1 · הורדת מפה A" disabled={busy} action={() => run(() => updateMap("A", setStatus))} />
        <Button title="2 · החלפה למפה B" disabled={busy} action={() => run(() => updateMap("B", setStatus))} />
        <Button title="3 · בדיקת כשל מדומה" disabled={busy} action={() => run(failureTest)} />
      </Section>
      <Section header={<Text>חיבור ל־Widgy</Text>}>
        <Text>ב־iPhone שלי → Scripting → MapCacheTest → map-current.png</Text>
        <Button title="הוראות הבדיקה" disabled={busy} action={() => run(async () => {
          await api("Dialog").alert({ title: "בדיקת A → B", message: instructions, buttonLabel: "הבנתי" })
          return "ההוראות זמינות כאן בכל עת."
        }, false)} />
        <Text>קובץ מפה קבוע וגיבוי יחיד. לאחר העדכונים בדוק שהמפה מופיעה והמעבר Calendar → Home נשאר מהיר.</Text>
      </Section>
      <Button title="סגירה" disabled={busy} action={() => dismiss()} />
    </List>
  </NavigationStack>
}

export async function presentMenu() {
  await Navigation.present({ element: <TestMenu /> })
}
