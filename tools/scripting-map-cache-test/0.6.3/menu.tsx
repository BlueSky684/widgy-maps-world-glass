import { Button, List, Navigation, NavigationStack, Section, Text, useState } from "scripting"
import { api, preview, updateLiveMap, VERSION } from "./bridge"
import { prepareShortcutWriter } from "./writer"
import { SafeMapError } from "./platform"
import { startRecurring, stopRecurring, scheduleStatus, TICK_TITLE } from "./scheduler"
import { lastUpdateStatus, testFailureAlert } from "./quiet"

// UI tap suppression; cross-process serialization is enforced in lock.ts.
let active = false

function TestMenu() {
  const dismiss = Navigation.useDismiss()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("גרסת ביניים לשימוש יומיומי: עדכון מוצלח דרך הקיצור שקט; נשלחת התראה רק על כשל.")
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
      <Section header={<Text>שימוש יומיומי · 2400 × 1131</Text>}>
        <Text>המפה מתעדכנת תמיד ב־2400 × 1131, לפי המיקום והשעה הנוכחיים. גודל התצוגה בווידג׳ט נשאר כפי שהגדרת. המפה התקינה האחרונה נשמרת אם העדכון נכשל.</Text>
        <Text>{status}</Text>
      </Section>
      <Section header={<Text>התראות ותוצאת העדכון</Text>}>
        <Text>בקיצור ״בדיקת מפה״ הסר רק את הפעולה האחרונה ״הצגת העדכון״. הסקריפט שולח התראה בעצמו רק אם עדכון המפה נכשל.</Text>
        <Button title="תוצאת העדכון האחרון" disabled={busy} action={() => run(lastUpdateStatus)} />
        <Button title="בדיקת התראת כשל" disabled={busy} action={() => run(testFailureAlert)} />
        <Text>היעדר התראה אינו מוכיח שהקיצור הופעל. אפשר לראות כאן את מועד ותוצאת העדכון האחרון. לאחר כמה ימי שימוש תקינים נכין גרסה סופית ללא תפריט וללא התראות תוצאה.</Text>
      </Section>
      <Section header={<Text>עדכונים אוטומטיים</Text>}>
        <Text>משתמשים באוטומציית ״בדיקת מפה״ שכבר הגדרת, עם הכותרת:</Text>
        <Text>{TICK_TITLE}</Text>
        <Text>תזמון קיים ממשיך לעבוד. אין צורך להפעיל אותו מחדש אחרי הייבוא. הכפתור מחליף תזמון קודם, אם קיים.</Text>
        <Button title="הפעלה כל 15 דקות" disabled={busy} action={() => run(startRecurring)} />
        <Button title="בדיקת מצב התזמון" disabled={busy} action={() => run(scheduleStatus)} />
        <Button title="עצירת העדכונים האוטומטיים" disabled={busy} action={() => run(stopRecurring)} />
        <Text>תוצאת העדכון נשמרת לקריאה בתפריט. רענון התמונה על המסך תלוי ב־Widgy.</Text>
      </Section>
      <Section header={<Text>המפה שלי</Text>}>
        <Button title="עדכון ב־2400" disabled={busy} action={() => run(() => updateLiveMap(setStatus))} />
        <Text>העדכון הידני והאוטומטי משתמשים באותה רזולוציה. אין צורך לחבר שוב את הקובץ ל־Widgy.</Text>
        <Text>אישור מיקום עשוי להופיע בהפעלה הראשונה. המיקום נשלח לשירות המפה הקיים לציור הסמן ושם העיר. השאר את Scripting פתוחה עד סיום העדכון.</Text>
        <Button title="הצגת המפה השמורה" disabled={busy} action={() => run(async () => { await preview(); return "התצוגה נסגרה. הקובץ נשאר במקומו." }, false)} />
      </Section>
      <Section header={<Text>הקיצור הקיים</Text>}>
        <Text>לאחר החיבור, הקיצור ״בדיקת מפה״ יעדכן את המפה המקומית לפי המיקום והשעה הנוכחיים. תמונה חדשה נשמרת לאחר בדיקה, עם גיבוי של המפה הקודמת.</Text>
        <Button title="חיבור לקיצור הקיים" disabled={busy} action={() => run(prepareShortcutWriter)} />
        <Text>החיבור משתמש בהרשאת התיקייה שכבר נתת. אם ייפתח חלון בחירה: ״ב־iPhone שלי״ → Scripting → MapCacheTest, ולחץ ״פתיחה״ לבחירת התיקייה.</Text>
        <Text>הקיצור שכבר עובד נשאר מתאים. השתמש בכפתור החיבור רק אם מתקבלת הודעה שהחיבור חסר.</Text>
      </Section>
      <Section header={<Text>הקובץ שמחובר ל־Widgy</Text>}>
        <Text>ב־iPhone שלי → Scripting → MapCacheTest → map-current.png</Text>
        <Text>לאחר הייבוא והסרת ״הצגת העדכון״ בקיצור, הפעל את הקיצור פעם אחת. לא אמורה להופיע התראת הצלחה. אפשר לאמת את מועד ההצלחה דרך ״תוצאת העדכון האחרון״.</Text>
      </Section>
      <Button title="סגירה" disabled={busy} action={() => dismiss()} />
    </List>
  </NavigationStack>
}

export async function presentMenu() {
  await Navigation.present({ element: <TestMenu /> })
}
