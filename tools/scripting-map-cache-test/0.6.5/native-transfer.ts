import { api, SafeMapError } from "./platform"
import { accessKey, liveMapURL, disk, decode, VERSION } from "./bridge"
import { authorizedPaths } from "./writer"
import { shortcutLocation } from "./shortcut-location"
import { withMapLock } from "./lock"
import { preparePublisher, checkPNG, checkSavedPNG, MAX_BYTES } from "./core"
import { saveReport } from "./quiet"
import { UpdateTiming } from "./timing"

export const NATIVE_PREFIX = "NATIVE2400\n"
export const WATCH_PURPOSE = "world-glass-map-native-watch"
const TITLE = "World Glass Map Tick"
const ACCEPT_MS = 20000, WATCH_MS = 120000
const ORIGIN = "https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?"
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i
type Row = { token: string; started: number; requested: number; state: string; ended: number | null; code: string; monitor: string; baseline: string }

async function database() {
  const db = api("SQLite").open(api("FileManager").appGroupDocumentsDirectory + "/MapCacheTest-writer.sqlite", { busyMode: "immediateError" })
  await db.execute("CREATE TABLE IF NOT EXISTS map_native_runs (seq INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT UNIQUE NOT NULL, started REAL NOT NULL, requested REAL NOT NULL, state TEXT NOT NULL, ended REAL, code TEXT NOT NULL DEFAULT '', monitor TEXT NOT NULL DEFAULT '', baseline TEXT NOT NULL)")
  return db
}
async function latest(db: any): Promise<Row | undefined> {
  return (await db.fetchAll("SELECT * FROM map_native_runs ORDER BY seq DESC LIMIT 1"))[0]
}
function safeFailure(code: string, detail: string) {
  return `עדכון המפה לא הושלם · ${VERSION}.\nקוד: ${code}.\n${detail}`
}
async function report(ok: boolean, message: string) {
  await saveReport({ schema: 1, version: VERSION, completedAt: new Date().toISOString(), ok,
    message, alert: ok ? "not-needed" : "shortcut-result" })
}
function safeError(error: unknown) {
  return error instanceof SafeMapError ? error.message : "לא ניתן להשלים את הפעולה [NATIVE_INTERNAL]."
}
export function isNativeWatch(r: any): boolean {
  return r?.content?.title === TITLE && r?.content?.userInfo?.purpose === WATCH_PURPOSE
}
async function pending(): Promise<any[]> {
  const list = await api("Notification").getAllPendingsOfCurrentScript()
  if (!Array.isArray(list)) throw new Error("Pending unavailable")
  return list
}
async function cancelWatch(token: string) {
  const ids = (await pending()).filter(r => isNativeWatch(r) && r.content.userInfo.token === token).map(r => r.identifier)
  if (ids.some(id => typeof id !== "string" || !id)) throw new Error("Invalid identity")
  if (ids.length) await api("Notification").removePendings(ids)
  if ((await pending()).some(r => isNativeWatch(r) && r.content.userInfo.token === token)) throw new Error("Cancellation unverified")
}
function regular(r: any) {
  return r?.content?.title === TITLE && r.content.userInfo?.purpose === "world-glass-map-recurring" && r.content.userInfo.intervalMinutes === 15
}
async function armWatch(token: string): Promise<string> {
  const before = await pending()
  const regulars = before.filter(regular)
  // Explicit manual setup is allowed with the scheduler stopped. No schedule
  // is created behind the owner's back; errors then require another invocation.
  if (!regulars.length && !before.some(isNativeWatch)) return "manual"
  if (regulars.length !== 1 || before.some(isNativeWatch)) throw new SafeMapError("תזמון בדיקת ההשלמה אינו פנוי [NATIVE_WATCH].")
  const Trigger = api("TimeIntervalNotificationTrigger")
  await api("Notification").schedule({ title: TITLE, body: "בדיקת השלמת הורדת המפה.",
    silent: true, interruptionLevel: "active", tapAction: "none", customUI: false,
    trigger: new Trigger({ timeInterval: WATCH_MS / 1000, repeats: false }),
    threadIdentifier: "world-glass-map-tick", userInfo: { purpose: WATCH_PURPOSE, token } })
  const after = await pending()
  if (after.filter(regular).length !== 1 || after.filter(isNativeWatch).length !== 1 ||
      !after.some(r => isNativeWatch(r) && r.content.userInfo.token === token)) throw new SafeMapError("תזמון בדיקת ההשלמה לא אומת [NATIVE_WATCH].")
  return "scheduled"
}
export function tokenFromURL(input: unknown): string {
  if (typeof input !== "string" || input.length > 4096 || !input.startsWith(ORIGIN)) throw new SafeMapError("חבר את Result של שלב ההכנה ל־Parameter בשלב השמירה [NATIVE_TOKEN].")
  const query = input.slice(ORIGIN.length).split("&")
  const tokens = query.filter(p => p.startsWith("transfer_id="))
  if (tokens.length !== 1 || !UUID.test(tokens[0].slice(12)) || !query.includes("native_file=1")) throw new SafeMapError("מזהה ההורדה חסר או שגוי [NATIVE_TOKEN].")
  return tokens[0].slice(12).toLowerCase()
}
// Called only after full CRC/size/structure validation. A file from another
// run, cached image, image conversion, or HTML error cannot pass this binding.
export function checkTransfer(bytes: Uint8Array, token: string) {
  let matches = 0
  const key = "WorldGlassTransfer\0"
  for (let offset = 8; offset < bytes.length;) {
    const n = (bytes[offset] * 16777216 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    if (type === "tEXt" && n <= 256) {
      const value = String.fromCharCode(...bytes.subarray(offset + 8, offset + 8 + n))
      if (value.startsWith(key)) {
        if (value !== key + token) throw new SafeMapError("הקובץ שייך לבקשה אחרת [NATIVE_FILE_ID].")
        matches++
      }
    }
    offset += n + 12
  }
  if (matches !== 1) throw new SafeMapError("הקובץ אינו מכיל אישור לבקשה הזו. בדוק שהקובץ המקורי מועבר ללא המרה [NATIVE_FILE_ID].")
}
async function failRow(db: any, row: Row, code: string, detail: string): Promise<string> {
  await db.execute("UPDATE map_native_runs SET state='failed', ended=?, code=? WHERE token=?", [Date.now(), code, row.token])
  try { await cancelWatch(row.token) } catch (_) {}
  const message = safeFailure(code, detail)
  await report(false, message)
  return message
}

export async function beginNative(input: string): Promise<string> {
  try {
    if (api("Script").env !== "intent") throw new SafeMapError("הפעל דרך קיצורים [NATIVE_CONTEXT].")
    return await withMapLock(async () => {
      const db = await database(), previous = await latest(db)
      if (previous?.state === "waiting" || previous?.state === "publishing") {
        const age = Date.now() - previous.started
        if (previous.state === "publishing") return safeFailure("NATIVE_UNCONFIRMED_WRITE", "החלה שמירה קודמת אך לא נרשם סיום. יש לבדוק את המפה לפני ניסיון נוסף.")
        // A waiting download has no writer lock and no permission to publish
        // without revalidating its token under this same lock.
        if (age >= 0 && age < WATCH_MS) return ""
        return failRow(db, previous, "NATIVE_INCOMPLETE", "שלב ההורדה בקיצורים לא החזיר אישור שמירה בתוך שתי דקות. ייתכן כשל או עיכוב ברקע. המפה לא הוחלפה בהרצה זו; ניסיון חדש יבוצע בתזמון הבא.")
      }
      const supplied = shortcutLocation(input), timing = new UpdateTiming()
      // Only a completed attempt's own watch can be cleaned here. Never touch
      // an unrelated notification, or infer that a stopped schedule is active.
      if (previous) await cancelWatch(previous.token)
      const target = await authorizedPaths()
      const publisher = await preparePublisher(disk(), target)
      if (!publisher.hasCurrent) throw new SafeMapError("לא נמצאה מפה תקינה [NO_SAVED_MAP].")
      shortcutLocation(input); timing.remaining()
      const token = String(api("UUID").string()).toLowerCase()
      if (!UUID.test(token)) throw new SafeMapError("לא נוצר מזהה בקשה תקין [NATIVE_TOKEN].")
      const baseline = await disk().read(target.current)
      // Keep only an opaque checksum, not the image or private path, in SQL.
      const baselineHash = checkSavedPNG(baseline).fingerprint
      const started = Date.now()
      await db.execute("INSERT INTO map_native_runs (token,started,requested,state,baseline) VALUES (?,?,?,'waiting',?)", [token, started, supplied.requestedAt, baselineHash])
      const row: Row = { token, started, requested: supplied.requestedAt, state: "waiting", ended: null, code: "", monitor: "", baseline: baselineHash }
      try {
        const monitor = await armWatch(token)
        timing.remaining()
        if (Date.now() - started > 5000) throw new SafeMapError("הכנת ההורדה התעכבה [NATIVE_PREPARE_LATE].")
        await db.execute("UPDATE map_native_runs SET monitor=? WHERE token=?", [monitor, token])
        await db.execute("DELETE FROM map_native_runs WHERE seq NOT IN (SELECT seq FROM map_native_runs ORDER BY seq DESC LIMIT 64)")
        shortcutLocation(input); timing.remaining()
        if (Date.now() - started > 5000) throw new SafeMapError("הכנת ההורדה התעכבה [NATIVE_PREPARE_LATE].")
        // No location, URL, credential, downloaded bytes, or file path is stored
        // in the journal. The URL exists only in this Shortcut invocation.
        return liveMapURL({ latitude: supplied.latitude, longitude: supplied.longitude, timestamp: supplied.requestedAt }, accessKey()) +
          "&native_file=1&transfer_id=" + token
      } catch (error) {
        return failRow(db, row, "NATIVE_PREPARE", safeError(error) + "\nההורדה לא התחילה והמפה לא שונתה.")
      }
    })
  } catch (error) {
    const message = safeFailure("NATIVE_PREPARE", safeError(error)); await report(false, message); return message
  }
}

function localFile(files: unknown): string {
  if (!Array.isArray(files) || files.length !== 1 || typeof files[0] !== "string") throw new SafeMapError("חבר את הקובץ שהורד לשדה File URLs בשלב השמירה [NATIVE_FILE_INPUT].")
  let path = files[0]
  if (path.startsWith("file://localhost/")) path = path.slice(16)
  else if (path.startsWith("file:///")) path = path.slice(7)
  if (!path.startsWith("/") || path.includes("\0")) throw new SafeMapError("הקלט אינו קובץ מקומי [NATIVE_FILE_INPUT].")
  // Scripting may supply either a POSIX path or a percent-encoded file URL.
  return files[0].startsWith("file://") ? decodeURIComponent(path) : path
}
export async function finishNative(input: unknown, files: unknown): Promise<string> {
  let token: string
  try { token = tokenFromURL(input) } catch (error) { return safeFailure("NATIVE_TOKEN", safeError(error)) }
  try {
    return await withMapLock(async () => {
      const db = await database(), row = await latest(db)
      // Duplicate/obsolete continuations cannot overwrite a new map or report.
      if (!row || row.token !== token || row.state !== "waiting") return ""
      let publicationStarted = false
      const timing = new UpdateTiming()
      const fresh = () => {
        const now = Date.now(), age = now - row.started
        if (age < 0 || age >= ACCEPT_MS || now - row.requested > 120000 || row.requested - now > 60000) throw new SafeMapError("ההורדה או השמירה חרגו מהזמן המותר [NATIVE_LATE].")
        timing.remaining()
      }
      try {
        fresh()
        const file = localFile(files)
        const bytes: Uint8Array = await api("FileManager").readAsBytes(file)
        if (!bytes || bytes.length > MAX_BYTES) throw new SafeMapError("גודל הקובץ אינו תקין [NATIVE_SIZE].")
        fresh()
        try { checkPNG(bytes) } catch (_) { throw new SafeMapError("הקובץ שהתקבל אינו מפת PNG תקינה בגודל 2400 [NATIVE_PNG].") }
        checkTransfer(bytes, token)
        const target = await authorizedPaths()
        const publisher = await preparePublisher(disk(), target)
        if (!publisher.hasCurrent) throw new SafeMapError("המפה השמורה אינה תקינה [NO_SAVED_MAP].")
        const baseline = checkSavedPNG(await disk().read(target.current)).fingerprint
        if (baseline !== row.baseline) throw new SafeMapError("המפה עודכנה בהרצה אחרת במהלך ההורדה. הקובץ החדש יותר לא יוחלף [NATIVE_SUPERSEDED].")
        await db.execute("UPDATE map_native_runs SET state='publishing' WHERE token=? AND state='waiting'", [token])
        fresh()
        const result = await publisher.publish(bytes, decode, fresh, () => { fresh(); publicationStarted = true })
        await db.execute("UPDATE map_native_runs SET state='done',ended=?,code='OK' WHERE token=?", [Date.now(), token])
        let watchNote = ""
        try { await cancelWatch(token) } catch (_) { watchNote = "\nלא אומת ביטול בדיקת המעקב; עדכון המפה עצמו הצליח." }
        const message = `עדכון המפה הצליח · ${VERSION}.\nמסלול: הורדה בקיצורים ושמירה בסקריפט.\nמהכנת הבקשה עד שמירה: ${((Date.now()-row.started)/1000).toFixed(1)} שניות.\nשלב השמירה בסקריפט: ${timing.total()} שניות.\nקובץ המפה נכתב ונקרא בחזרה בהצלחה.\n${result.width} × ${result.height} · ${(result.bytes/1000000).toFixed(2)} MB\nקוד המפה: ${result.fingerprint}\nמעקב השלמה: ${row.monitor === "scheduled" ? "אוטומטי" : "ידני — התזמון כבוי"}.\nרענון התצוגה ב־Widgy נבדק בנפרד.` + watchNote
        await report(true, message)
        return ""
      } catch (error) {
        const detail = safeError(error), code = detail.match(/\[([A-Z_]+)\]/)?.[1] || "NATIVE_INTERNAL"
        return failRow(db, row, code, detail + (publicationStarted ? "\nהחלה החלפת המפה; יש לבדוק את הקובץ השמור." : "\nלא התחילה החלפת המפה בתמונה חדשה."))
      }
    })
  } catch (error) { return safeFailure("NATIVE_FINISH", safeError(error)) }
}

export async function nativeHistory(): Promise<string> {
  const rows: Row[] = await (await database()).fetchAll("SELECT * FROM map_native_runs ORDER BY seq DESC LIMIT 64")
  if (!rows.length) return "עדיין אין הרצות במסלול ההורדה דרך קיצורים. הייבוא לבדו אינו משנה את הקיצור."
  return "עד 64 הרצות במסלול קיצורים, החדשות בראש. זמן ההתחלה אינו אישור שההורדה הושלמה.\n\n" + rows.map(r =>
    `${new Date(r.started).toLocaleString()} · ${r.state === "done" ? "הצליח" : r.state === "failed" ? "לא הושלם" : r.state === "publishing" ? "שמירה ללא אישור סיום" : "ממתין להשלמה"}` +
    ` · ${r.code || "—"}${r.ended == null ? "" : " · " + ((r.ended-r.started)/1000).toFixed(1) + " ש׳"}`).join("\n")
}
