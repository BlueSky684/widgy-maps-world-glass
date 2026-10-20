import { api, SafeMapError } from "./platform"

// Keep the exact title used by the owner's working automation.
export const TICK_TITLE = "World Glass Map Tick"
const PURPOSE = "world-glass-map-recurring"
// Legacy 5-minute schedules are recognized only for status and replacement.
type ExistingInterval = 5 | 15
export const INTERVAL_MINUTES = 15

function notifications() {
  if (api("Script").env !== "index") {
    throw new SafeMapError("פתח את Map Cache Test ב־Scripting כדי לנהל את התזמון.")
  }
  const notification = api("Notification")
  for (const name of ["schedule", "getAllPendingsOfCurrentScript", "removeAllPendingsOfCurrentScript"]) {
    if (typeof notification[name] !== "function") {
      throw new SafeMapError("ניהול התזמון אינו זמין בגרסת Scripting הזו. התזמון הקיים לא שונה.")
    }
  }
  return notification
}

async function pending(notification: any): Promise<any[]> {
  const requests = await notification.getAllPendingsOfCurrentScript()
  if (!Array.isArray(requests)) throw new Error("Unexpected pending-notification response")
  return requests
}

function intervalOf(request: any): ExistingInterval | null {
  const info = request?.content?.userInfo
  if (request?.content?.title !== TICK_TITLE || info?.purpose !== PURPOSE) return null
  return info.intervalMinutes === 5 || info.intervalMinutes === 15 ? info.intervalMinutes : null
}

export async function scheduleStatus(): Promise<string> {
  try {
    const requests = await pending(notifications())
    if (requests.length === 0) return "אין כרגע התראות מפה מתוזמנות."
    const interval = requests.length === 1 ? intervalOf(requests[0]) : null
    if (interval != null) {
      return `קיימת התראה חוזרת אחת: כל ${interval} דקות.\n` +
        (interval === 5 ? "זהו תזמון קודם. בחר ״הפעלה כל 15 דקות״ כדי להחליף אותו.\n" : "") +
        "הפעלת הקיצור תלויה באוטומציה שכבר הגדרת. הודעת ״עדכון המפה הצליח״ מאשרת שהעדכון עצמו הושלם."
    }
    return "נמצאה התראה מהבדיקה הקודמת או תזמון שאינו תואם לגרסה הזו. בחר תדירות כדי להחליף אותו, או עצור את התזמון."
  } catch (error) {
    if (error instanceof SafeMapError) throw error
    throw new SafeMapError("לא ניתן לקרוא את מצב התזמון כרגע. לא בוצע שינוי.")
  }
}

export async function startRecurring(): Promise<string> {
  const intervalMinutes = INTERVAL_MINUTES
  let replacing = false
  let notification: any
  try {
    // Check available capabilities before removing an earlier schedule.
    notification = notifications()
    const Trigger = api("TimeIntervalNotificationTrigger")
    const trigger = new Trigger({ timeInterval: intervalMinutes * 60, repeats: true })
    await pending(notification)
    replacing = true
    // This script owns only map ticks, including the old one-shot probe.
    // Never remove other Scripting scripts' notifications.
    await notification.removeAllPendingsOfCurrentScript()
    if ((await pending(notification)).length !== 0) throw new Error("Cancellation not verified")
    await notification.schedule({
      title: TICK_TITLE,
      body: "הפעלה אוטומטית לעדכון מפת World Glass ב־2400 × 1131.",
      silent: true,
      interruptionLevel: "active",
      trigger,
      tapAction: "none",
      customUI: false,
      threadIdentifier: "world-glass-map-tick",
      userInfo: { purpose: PURPOSE, version: 1, intervalMinutes }
    })
    const requests = await pending(notification)
    if (requests.length !== 1 || intervalOf(requests[0]) !== intervalMinutes) {
      throw new Error("Scheduled notification not verified")
    }
    return `הוגדרה התראה חוזרת כל ${intervalMinutes} דקות.\n` +
      `ההתראה הראשונה צפויה בעוד ${intervalMinutes} דקות.\n` +
      "חזור למסך הבית. האוטומציה הקיימת אמורה להפעיל את הקיצור בלי לחיצה על ההתראה.\n" +
      "התזמון ממשיך עד לחיצה על ״עצירת העדכונים האוטומטיים״."
  } catch (error) {
    if (error instanceof SafeMapError) throw error
    if (replacing) {
      // A rejected/uncertain registration must not leave an unverified loop.
      try {
        await notification.removeAllPendingsOfCurrentScript()
        if ((await pending(notification)).length !== 0) throw new Error("Cleanup not verified")
      } catch (_) {
        throw new SafeMapError("לא ניתן לאמת את התזמון או את ביטולו. לחץ ״עצירת העדכונים האוטומטיים״. אם ההודעה חוזרת, כבה זמנית את אוטומציית ״בדיקת מפה״ ושלח צילום.")
      }
      throw new SafeMapError("התזמון החדש לא אומת ובוטל. אין כרגע התראות מפה מתוזמנות. המפה השמורה לא שונתה.")
    }
    throw new SafeMapError("לא ניתן להכין את התזמון כרגע. התזמון הקיים והמפה לא שונו.")
  }
}

export async function stopRecurring(): Promise<string> {
  try {
    const notification = notifications()
    await notification.removeAllPendingsOfCurrentScript()
    if ((await pending(notification)).length !== 0) throw new Error("Cancellation not verified")
    return "בוטלו התראות המפה הבאות.\nעדכון שכבר התחיל עשוי להסתיים. המפה השמורה נשארת זמינה."
  } catch (error) {
    if (error instanceof SafeMapError) throw error
    throw new SafeMapError("לא ניתן לאשר שהתזמון נעצר. נסה שוב; אם ההודעה חוזרת, כבה זמנית את אוטומציית ״בדיקת מפה״ ושלח צילום.")
  }
}
