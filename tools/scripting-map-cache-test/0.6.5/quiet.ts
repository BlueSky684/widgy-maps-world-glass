import { api, SafeMapError } from "./platform"
import { performShortcutUpdate, UpdateOutcome } from "./writer"
import { VERSION } from "./bridge"
import { requestRecovery, finishRecovery } from "./recovery"

// Distinct from World Glass Map Tick: errors must not trigger the automation.
export const FAILURE_TITLE = "World Glass · עדכון המפה נכשל"
const reportPath = () => api("FileManager").appGroupDocumentsDirectory + "/MapCacheTest-last-update.json"
export type Report = {
  schema: 1; version: string; completedAt: string; ok: boolean; message: string
  alert: "not-needed" | "pending" | "requested" | "failed" | "retry-queued" | "shortcut-result"
}

// Diagnostic I/O must never turn a successful publication into a map failure,
// or prevent an error notification. One bounded record; no location/key/URL log.
export async function saveReport(report: Report): Promise<void> {
  try { await api("FileManager").writeAsString(reportPath(), JSON.stringify(report)) } catch (_) {}
}

async function notifyFailure(outcome: Extract<UpdateOutcome, { ok: false }>): Promise<void> {
  await api("Notification").schedule({
    title: FAILURE_TITLE,
    body: `קוד: ${outcome.code}.\n` +
      (outcome.publicationStarted ? "יש לבדוק את המפה השמורה.\n" : "לא הוחלפה המפה בתמונה חדשה.\n") +
      "הניסיון הבא יבוצע בתזמון הקיים. לפרטים: פתח Map Cache Test ובחר ״תוצאת העדכון האחרון״.",
    silent: false,
    interruptionLevel: "active",
    tapAction: "none",
    customUI: false,
    threadIdentifier: "world-glass-map-failure",
    userInfo: { purpose: "world-glass-map-failure", version: VERSION }
  })
}

export async function runQuietUpdate(input?: unknown): Promise<string> {
  let outcome: UpdateOutcome
  try {
    outcome = await performShortcutUpdate(input)
  } catch (_) {
    // An unexpected failure outside the writer's guard must not leak native
    // details or assert that the saved file is intact without checking it.
    outcome = { ok: false, code: "INTERNAL", publicationStarted: true,
      message: "עדכון המפה לא הושלם [INTERNAL]. יש לבדוק את המפה השמורה." }
  }
  let recovered = false
  if (outcome.ok === true) recovered = await finishRecovery(true)
  else {
    const recovery = await requestRecovery(outcome)
    if (recovery === "queued") {
      await saveReport({ schema: 1, version: VERSION, completedAt: new Date().toISOString(), ok: false,
        message: ("העדכון התעכב. התבקש ניסיון התאוששות יחיד בעוד כדקה באמצעות האוטומציה הקיימת.\n" +
          "זה עדיין אינו אישור לעדכון מוצלח. אם ההרצה הבאה תיכשל, הקיצור יציג התראה.\n\n" + outcome.message).slice(0, 6000),
        alert: "retry-queued" })
      // Empty means no result banner, NOT success. The saved record says failed
      // with retry pending. No downloaded bytes, location or dates are reused.
      return ""
    }
    await finishRecovery(false)
    if (recovery === "exhausted") outcome.message = "ניסיון ההתאוששות כבר נוצל; לא יתוזמן ניסיון נוסף לפני עדכון מוצלח.\n" + outcome.message
    else if (recovery === "unavailable") outcome.message += "\nלא ניתן לאשר ניסיון התאוששות נוסף; התראת הכשל מוצגת כעת."
  }
  if (recovered) outcome.message = "המפה עודכנה בהצלחה לאחר כשל קודם.\n" + outcome.message
  const report: Report = { schema: 1, version: VERSION, completedAt: new Date().toISOString(),
    ok: outcome.ok, message: outcome.message.slice(0, 6000), alert: outcome.ok ? "not-needed" : "pending" }
  await saveReport(report)
  if (outcome.ok === true) return ""
  try {
    await notifyFailure(outcome)
    // The API accepted the request. Actual onscreen delivery is controlled by iOS.
    report.alert = "requested"
  } catch (_) {
    report.alert = "failed"
  }
  await saveReport(report)
  return outcome.message + (report.alert === "failed" ? "\nלא ניתן היה לשלוח התראת כשל [ALERT_FAILED]." : "")
}

export async function lastUpdateStatus(): Promise<string> {
  try {
    const fm = api("FileManager"), path = reportPath()
    if (!await fm.exists(path)) return "עדיין לא נשמרה תוצאת עדכון מגרסה זו. הפעל את הקיצור פעם אחת."
    const raw = await fm.readAsString(path)
    if (raw.length > 16000) throw new Error()
    const report: Report = JSON.parse(raw)
    if (report?.schema !== 1 || typeof report.ok !== "boolean" || typeof report.message !== "string" ||
        report.message.length > 6000 || typeof report.version !== "string" || !/^\d+\.\d+\.\d+$/.test(report.version) ||
        typeof report.completedAt !== "string" || !Number.isFinite(Date.parse(report.completedAt)) ||
        !["not-needed", "pending", "requested", "failed", "retry-queued", "shortcut-result"].includes(report.alert)) throw new Error()
    return "העדכון האחרון דרך הקיצור: " + new Date(report.completedAt).toLocaleString() +
      "\nגרסה: " + report.version + "\n" + report.message +
      (report.alert === "failed" ? "\nלא ניתן היה לשלוח התראת כשל [ALERT_FAILED]." :
       report.alert === "pending" ? "\nלא נרשם אישור לבקשת התראת הכשל." :
       report.alert === "shortcut-result" ? "\nהוחזר טקסט כשל לקיצור. הצגת ההתראה תלויה בתנאי ״לא הושלם״ שהוגדר בו." : "")
  } catch (_) {
    throw new SafeMapError("לא ניתן לקרוא את תוצאת העדכון האחרון. המפה והתזמון לא שונו [REPORT_READ].")
  }
}

export async function testFailureAlert(): Promise<string> {
  // Explicit foreground action only. Does not run or falsify a failed map update.
  if (api("Script").env !== "index") throw new SafeMapError("את בדיקת ההתראה מפעילים בתפריט Scripting.")
  try {
    await api("Notification").schedule({
      title: "World Glass · בדיקת התראת כשל",
      body: "זו בדיקת התראה בלבד. לא אירעה תקלה במפה; התזמון והמפה נשארו כפי שהם.",
      silent: false, interruptionLevel: "active", tapAction: "none", customUI: false,
      threadIdentifier: "world-glass-map-failure",
      userInfo: { purpose: "world-glass-map-failure-test", version: VERSION }
    })
    return "בקשת התראת הבדיקה נשלחה. בדוק שהופיעה במרכז העדכונים. המפה ותוצאת העדכון האחרון לא שונו."
  } catch (_) { throw new SafeMapError("לא ניתן לשלוח התראת בדיקה. בדוק את הרשאות ההתראות של Scripting [ALERT_FAILED].") }
}

