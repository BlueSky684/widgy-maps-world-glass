import { api, SafeMapError } from "./platform"
import { withMapLock } from "./lock"
import { accessKey, decode, disk, downloadForPublication, liveMapURL, paths } from "./bridge"
import { shortcutLocation, shortcutTimingSummary } from "./shortcut-location"
import { preparePublisher, Paths } from "./core"
import { UpdateTiming } from "./timing"
import { DownloadTrace } from "./download-trace"
import { OperationTrace } from "./operation-trace"
import { binding, bookmarkedMap, prepareShortcutProbe } from "./probe"

const markerName = "/map-cache-folder-id.txt"
const configurationPath = () => api("FileManager").appGroupDocumentsDirectory + "/MapCacheTest-writer.json"
const folderOf = (path: string) => path.substring(0, path.lastIndexOf("/"))
type WriterBinding = { schema: number; bookmarkName: string; folderId: string }

async function writerBinding(): Promise<WriterBinding> {
  try {
    const value = JSON.parse(await api("FileManager").readAsString(configurationPath()))
    if (value?.schema !== 2 || typeof value.bookmarkName !== "string" || !value.bookmarkName ||
        typeof value.folderId !== "string" || !/^[a-f0-9-]{36}$/i.test(value.folderId)) throw new Error()
    return value
  } catch (_) {
    throw new SafeMapError("פתח את Map Cache Test ב־Scripting ולחץ פעם אחת על ״חיבור לקיצור הקיים״ [WRITER_SETUP].")
  }
}

export async function prepareShortcutWriter(): Promise<string> {
  if (api("Script").env !== "index") throw new SafeMapError("את החיבור מבצעים בתוך Scripting.")
  return withMapLock(async () => {
    const fm = api("FileManager")
    await prepareShortcutProbe() // Reuses the owner's existing native bookmark.
    const record = await binding()
    const localFolder = folderOf(paths().current)
    const grantedFolder = folderOf(await bookmarkedMap(record.bookmarkName))
    const token = api("UUID").string()
    const challengeName = "/map-cache-access-" + token + ".tmp"
    try {
      // Fresh two-way challenge proves physical folder identity AND write
      // permission, unlike two copied images that merely have equal bytes.
      await fm.writeAsString(localFolder + challengeName, token)
      if (await fm.readAsString(grantedFolder + challengeName) !== token) throw new Error()
      await fm.writeAsString(grantedFolder + challengeName, token + "-verified")
      if (await fm.readAsString(localFolder + challengeName) !== token + "-verified") throw new Error()
      let folderId: string | undefined
      if (await fm.exists(localFolder + markerName)) folderId = await fm.readAsString(localFolder + markerName)
      if (!folderId || !/^[a-f0-9-]{36}$/i.test(folderId)) {
        folderId = api("UUID").string()
        await fm.writeAsString(localFolder + markerName, folderId)
      }
      if (await fm.readAsString(grantedFolder + markerName) !== folderId) throw new Error()
      const next: WriterBinding = { schema: 2, bookmarkName: record.bookmarkName, folderId: folderId! }
      await fm.writeAsString(configurationPath(), JSON.stringify(next))
      const saved = await writerBinding()
      if (saved.bookmarkName !== next.bookmarkName || saved.folderId !== next.folderId) throw new Error()
    } catch (_) {
      throw new SafeMapError("החיבור לכתיבה בתיקיית המפה לא אומת. המפה לא הוחלפה [FOLDER_WRITE_CHECK].")
    } finally {
      try { if (await fm.exists(localFolder + challengeName)) await fm.remove(localFolder + challengeName) } catch (_) {}
    }
    return "החיבור לקיצור מוכן.\nהקיצור ״בדיקת מפה״ ממשיך להשתמש במיקום ובזמן שהוא כבר מעביר לסקריפט.\nהפעם הקיצור יעדכן את הקובץ שמחובר ל־Widgy. אין צורך לבחור מחדש את קובץ המפה ב־Widgy."
  })
}

export async function authorizedPaths(): Promise<Paths> {
  const record = await writerBinding()
  const current = await bookmarkedMap(record.bookmarkName)
  const folder = folderOf(current)
  try {
    if (await api("FileManager").readAsString(folder + markerName) !== record.folderId) throw new Error()
  } catch (_) {
    throw new SafeMapError("הרשאת הקיצור אינה תואמת לתיקייה שחוברה. בצע שוב ״חיבור לקיצור הקיים״ [FOLDER_ID].")
  }
  return { current, stage: folder + "/candidate.tmp", backup: folder + "/previous-map.bin" }
}

export type UpdateOutcome =
  | { ok: true; message: string }
  | { ok: false; message: string; code: string; publicationStarted: boolean }

// Keep the diagnostic entry point for existing regression checks. The intent
// uses the structured result so notification policy never parses Hebrew text.
export async function runShortcutUpdate(input?: unknown): Promise<string> {
  return (await performShortcutUpdate(input)).message
}

export async function performShortcutUpdate(input?: unknown): Promise<UpdateOutcome> {
  let stage = "בדיקת המיקום מהקיצור", publicationStarted = false
  let inputTiming = ""
  const timing = new UpdateTiming()
  const download = new DownloadTrace()
  const operations = new OperationTrace()
  try {
    if (api("Script").env !== "intent") throw new SafeMapError("הפעל את הקיצור ״בדיקת מפה״ מתוך קיצורים.")
    const receivedAt = Date.now()
    inputTiming = shortcutTimingSummary(input, receivedAt)
    // Reject missing, invalid, or stale input before lock, disk or network work.
    const supplied = shortcutLocation(input, receivedAt)
    timing.mark("קלט מהקיצור")
    stage = "חיבור לקיצור"
    const result = await withMapLock(async () => {
      // authorizedPaths validates writer binding and exact folder identity.
      const target = await operations.measure("חיבור לתיקייה", authorizedPaths)
      stage = "בדיקת המפה הקיימת והגיבוי"
      const publisher = await preparePublisher(operations.io(disk(), target), target,
        (label, work) => operations.measure(label, work))
      if (!publisher.hasCurrent) throw new SafeMapError("לא נמצאה מפה תקינה. בצע עדכון ידני בתוך Scripting [NO_SAVED_MAP].")
      timing.mark("הכנה")
      // Revalidate the original request age after asynchronous preparation.
      shortcutLocation(input)
      const point = { latitude: supplied.latitude, longitude: supplied.longitude,
        timestamp: supplied.requestedAt }
      stage = "הורדת המפה"
      const url = liveMapURL(point, accessKey())
      const bytes = await downloadForPublication(url, timing.remaining(), download)
      timing.mark("הורדה")
      timing.remaining()
      stage = "בדיקת התמונה"
      // One full CRC/dimensions/structure check and one native decode, followed
      // by verified stage, backup and current writes. No race cancels file I/O.
      const published = await publisher.publish(bytes, decode, () => {
        timing.mark("בדיקה")
        timing.remaining()
        stage = "שמירת הקובץ הזמני והגיבוי"
      }, () => {
        timing.remaining()
        stage = "החלפת המפה ואימות הקריאה בחזרה"
        publicationStarted = true
      })
      timing.mark("שמירה")
      return published
    }, (label, work) => operations.measure(label, work))
    operations.finish()
    timing.mark("סיום")
    return { ok: true, message: "עדכון המפה הצליח · 0.6.6.\n" +
      `משך שלב הסקריפט: ${timing.total()} שניות.\n` +
      inputTiming +
      "קובץ המפה נכתב ונקרא בחזרה בהצלחה.\n" +
      operations.summary() +
      timing.summary() + "\n" +
      download.summary() +
      "הקובץ שמחובר ל־Widgy עודכן ונבדק.\nמקור המיקום: קיצורים.\n" +
      `${result.width} × ${result.height} · ${(result.bytes / 1000000).toFixed(2)} MB\n` +
      `קוד המפה: ${result.fingerprint}\n` +
      "הצלחה מאשרת שמירת קובץ; רענון התצוגה ב־Widgy נבדק בנפרד." }
  } catch (error) {
    operations.finish()
    timing.mark(stage)
    const reason = error instanceof SafeMapError ? error.message : "תקלה ללא פירוט בטוח [INTERNAL]."
    const code = reason.match(/\[([A-Z_]+)\]/)?.[1] || "INTERNAL"
    const inputFailure = code.startsWith("SHORTCUT_")
    const downloadFailure = stage === "הורדת המפה"
    // Never expose native errors, authenticated URLs, coordinates or the key.
    // Put the error, file state, slowest operation and gap before verbose detail:
    // iOS truncates even expanded notifications on the user's device.
    return { ok: false, code, publicationStarted, message: "עדכון המפה לא הושלם · 0.6.6.\n" +
      `קוד: ${code} · משך: ${timing.total()} שניות.\n` +
      (publicationStarted ? "החלה החלפת מפה; נדרש לבדוק את הקובץ.\n" : "לא התחילה החלפת המפה בתמונה חדשה.\n") +
      (downloadFailure ? download.compactSummary() : "") +
      (inputFailure ? inputTiming + reason + "\n" : "") +
      operations.summary() +
      "שלב: " + stage + ".\n" + (inputFailure ? "" : reason + "\n" + inputTiming) +
      timing.summary() + "\n" +
      download.summary() +
      (publicationStarted ? "בדוק את המפה השמורה; אם נדרש, פתח את Scripting לשחזור מהגיבוי.\n" : "לא הוחלפה המפה בתמונה חדשה.\n") +
      "שלח את תוצאת ההרצה." }
  }
}

