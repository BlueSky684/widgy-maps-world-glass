import { api, accessKey, currentLocation, decode, downloadOnce, liveMapURL, paths } from "./bridge"
import { checkSavedPNG, equalBytes } from "./core"
import { SafeMapError } from "./platform"

const configurationName = "/MapCacheTest-background-probe.json"
type Binding = { schema: number; bookmarkName: string }

function configurationPath(): string {
  return api("FileManager").appGroupDocumentsDirectory + configurationName
}
export async function binding(): Promise<Binding> {
  const fm = api("FileManager")
  const value = JSON.parse(await fm.readAsString(configurationPath()))
  if (value?.schema !== 1 || typeof value.bookmarkName !== "string" || !value.bookmarkName) {
    throw new Error("Missing folder permission")
  }
  return value
}
class SavedMapError extends SafeMapError {}
async function savedMap(path: string) {
  const fm = api("FileManager")
  // Use the same byte-reading path that passed on the owner's phone in 0.2.0.
  // Do not infer PNG validity from stat.type or a platform-specific size field.
  let exists: boolean
  try { exists = await fm.exists(path) }
  catch (_) { throw new SavedMapError("לא ניתן לבדוק גישה למפה השמורה [MAP_ACCESS].") }
  if (!exists) throw new SavedMapError("קובץ המפה לא נמצא במיקום הצפוי [MAP_MISSING].")
  let bytes: Uint8Array
  try { bytes = await fm.readAsBytes(path) }
  catch (_) { throw new SavedMapError("הקובץ קיים, אך לא ניתן לקרוא אותו [MAP_READ].") }
  try {
    // Retains all existing byte-size, signature, dimensions, CRC and end checks.
    return { bytes, summary: checkSavedPNG(bytes) }
  } catch (_) {
    throw new SavedMapError("הקובץ נקרא, אך תוכן תמונת ה־PNG לא עבר את בדיקת התקינות [MAP_PNG].")
  }
}
async function imageSummary(path: string) {
  return (await savedMap(path)).summary
}
function localFolder(value: unknown): string {
  if (typeof value !== "string" || !value) {
    throw new SavedMapError("ההרשאה השמורה לא החזירה נתיב לתיקייה [BOOKMARK_PATH].")
  }
  let path = value
  // Native paths are used as returned. Decode only an explicit local file URL;
  // do not decode percent signs in ordinary paths or rewrite container aliases.
  if (/^file:/i.test(path)) {
    const match = /^file:\/\/(?:localhost)?(\/[^?#]*)$/i.exec(path)
    if (!match) throw new SavedMapError("כתובת התיקייה אינה כתובת קובץ מקומית נתמכת [BOOKMARK_URL].")
    try { path = decodeURIComponent(match[1]) }
    catch (_) { throw new SavedMapError("לא ניתן לפענח את כתובת התיקייה [BOOKMARK_URL].") }
  }
  path = path.replace(/\/+$/, "")
  if (!path.startsWith("/") || /[\u0000\r\n]/.test(path) || path.split("/").some(p => p === "." || p === "..")) {
    throw new SavedMapError("לא התקבל נתיב מקומי תקין לתיקייה [BOOKMARK_PATH].")
  }
  if (path.substring(path.lastIndexOf("/") + 1) !== "MapCacheTest") {
    throw new SavedMapError("ההרשאה מצביעה על תיקייה אחרת. נדרשת תיקיית MapCacheTest [FOLDER_NAME].")
  }
  return path
}
export async function bookmarkedMap(name: string): Promise<string> {
  let folder: unknown
  try { folder = await api("FileManager").bookmarkedPath(name) }
  catch (_) { throw new SavedMapError("לא ניתן לפתוח את הרשאת התיקייה השמורה [BOOKMARK_RESOLVE].") }
  return localFolder(folder) + "/map-current.png"
}
async function verifyBookmark(name: string, expected: Uint8Array): Promise<void> {
  const candidate = (await savedMap(await bookmarkedMap(name))).bytes
  if (!equalBytes(candidate, expected)) {
    throw new SavedMapError("המפה בתיקייה שנבחרה שונה מהמפה המקומית הנוכחית [MAP_MISMATCH].")
  }
  // Exact content equality is sufficient only for this read-only probe. It
  // does not prove file identity and must not authorize a future writer.
}
async function saveBinding(name: string): Promise<void> {
  try {
    await api("FileManager").writeAsString(configurationPath(), JSON.stringify({ schema: 1, bookmarkName: name }))
    if ((await binding()).bookmarkName !== name) throw new Error("Readback mismatch")
  } catch (_) { throw new SavedMapError("שמירת הגדרת הקיצורים לא אומתה [BINDING_SAVE].") }
}
export async function prepareShortcutProbe(): Promise<string> {
  if (api("Script").env !== "index") throw new Error("פתח את ההכנה בתוך Scripting.")
  const fm = api("FileManager")
  const current = paths().current
  const expectedBytes = (await savedMap(current)).bytes
  const expectedFolder = current.substring(0, current.lastIndexOf("/"))
  const ready = "ההכנה הושלמה. בקיצורים השתמש ב־Run Intent Script של Scripting עם Map Cache Test והצגת תוצאה."
  // Reuse permissions created in earlier attempts, including the renamed
  // bookmark from the owner's 0.3.1 setup. Do not enumerate unrelated bookmarks.
  let priorName: string | undefined
  if (await fm.exists(configurationPath())) {
    try { priorName = (await binding()).bookmarkName } catch (_) { /* Try the known prior names. */ }
  }
  for (const name of new Set([priorName, "MapCacheTest031", "MapCacheTest"])) {
    if (!name) continue
    try { await verifyBookmark(name, expectedBytes) }
    catch (_) { continue }
    if (name !== priorName) await saveBinding(name)
    return ready
  }
  const picker = api("DocumentPicker")
  if (typeof picker.pickDirectoryBookmark !== "function") {
    throw new Error("גרסת Scripting הזו אינה כוללת בחירת תיקייה עם הרשאה מתמשכת. צריך לעדכן את Scripting לפני בדיקת הקיצורים.")
  }
  const chosen = await picker.pickDirectoryBookmark({
    preferredName: "MapCacheTest", initialDirectory: expectedFolder,
  })
  if (chosen == null) return "בחירת התיקייה בוטלה. המפה וההכנה נשארו ללא שינוי."
  if (typeof chosen.bookmarkName !== "string" || !chosen.bookmarkName) {
    throw new SavedMapError("הבחירה לא החזירה שם הרשאה שמורה [BOOKMARK_NAME].")
  }
  // Resolve the saved permission, exactly as the later intent does. The picker
  // display path need not be textually identical to Documents' container path.
  await verifyBookmark(chosen.bookmarkName, expectedBytes)
  // Store only the name of the native permission. Never copy keys or an image
  // to shared storage and never manufacture security-scoped bookmark data.
  await saveBinding(chosen.bookmarkName)
  return ready
}

async function downloadedSummary(progress: (stage: string) => void) {
  progress("קבלת מיקום עדכני")
  const point = await currentLocation()
  progress("אימות המיקום והגדרת הגישה לשירות המפה")
  const url = liveMapURL(point, accessKey())
  // One bounded attempt: this is a capability probe, not a scheduled writer.
  progress("הורדת המפה ובדיקת תקינות PNG")
  const bytes = await downloadOnce(url)
  const summary = checkSavedPNG(bytes)
  progress("פתיחת התמונה באיכות המקורית")
  await decode(bytes)
  return summary
}

export async function runShortcutProbe(): Promise<string> {
  let stage = "סביבת ההפעלה"
  const started = Date.now()
  try {
    if (api("Script").env !== "intent") {
      return "הפעל את הבדיקה בקיצורים באמצעות Run Intent Script של Scripting ובחר Map Cache Test."
    }
    stage = "גישה לתיקיית המפה; יש לבצע תחילה ״הכנה לבדיקת קיצורים״ בתוך Scripting"
    const record = await binding()
    const current = await bookmarkedMap(record.bookmarkName)
    stage = "קריאת המפה השמורה"
    const before = await imageSummary(current)
    const downloaded = await downloadedSummary(value => { stage = value })
    stage = "קריאה חוזרת של המפה השמורה"
    const after = await imageSummary(current)
    if (before.bytes !== after.bytes || before.fingerprint !== after.fingerprint) {
      return "ההורדה והבדיקה הצליחו, אך הקובץ השמור השתנה בזמן הבדיקה. הבדיקה עצמה אינה כותבת לקובץ. סיים עדכון ידני והרץ שוב את הקיצור."
    }
    return "בדיקת קיצורים הצליחה.\n" +
      "גישה למפה השמורה: תקינה.\nמיקום: עדכני.\n" +
      `מפה שהורדה ונפתחה: ${downloaded.width} × ${downloaded.height} · ${(downloaded.bytes / 1000000).toFixed(2)} MB\n` +
      `קוד המפה שהורדה: ${downloaded.fingerprint}\n` +
      `משך הבדיקה: ${((Date.now() - started) / 1000).toFixed(1)} שניות.\n` +
      "המפה ב־Widgy לא הוחלפה. אין עדיין תזמון אוטומטי."
  } catch (error) {
    // Do not return native network errors: some contain authenticated URLs.
    return "בדיקת קיצורים לא הושלמה.\nשלב: " + stage +
      ".\n" + (error instanceof SavedMapError ? error.message + "\n" : "") +
      "הבדיקה לא כתבה לקובץ המפה. שלח צילום של התוצאה."
  }
}
