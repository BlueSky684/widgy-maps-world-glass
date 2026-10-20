import { api } from "./platform"
import { withMapLock } from "./lock"
import { DownloadError, DownloadTrace } from "./download-trace"
export { api } from "./platform"
import { checkPNG, checkSavedPNG, DEFAULT_SIZE, MapSize, equalBytes, MAX_BYTES, publishCandidate, recoverCurrent, IO, Paths } from "./core"

import { selectedSize, selectSize } from "./resolution"

export const VERSION = "0.6.1"
export function paths(): Paths {
  const folder = api("FileManager").documentsDirectory + "/MapCacheTest"
  return { current: folder + "/map-current.png", stage: folder + "/candidate.tmp",
    backup: folder + "/previous-map.bin" }
}
export function disk(): IO {
  const fm = api("FileManager")
  return {
    exists: p => fm.exists(p), read: p => fm.readAsBytes(p),
    write: (p, b) => fm.writeAsBytes(p, b), remove: p => fm.remove(p),
  }
}
async function prepare() {
  if (api("Script").env !== "index") throw new Error("Open this test inside the Scripting app")
  const fm = api("FileManager")
  const folder = fm.documentsDirectory + "/MapCacheTest"
  if (!(await fm.exists(folder))) await fm.createDirectory(folder, true)
  return recoverCurrent(disk(), paths())
}
export function mapURL(label: "A" | "B", accessKey: string, size: MapSize = DEFAULT_SIZE): string {
  // Fixed sample time/location only. The existing map access key is packaged
  // privately for the owner, never committed or included in diagnostics.
  const time = label === "A" ? "2026-10-19T06:00:00Z" : "2026-10-19T18:00:00Z"
  return "https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?delivery=vercel-file-v1&" +
    `mode=live&width=${size.width}&presentation=glass&atlas=r6&lat=0&lon=0&city=` +
    encodeURIComponent("TEST " + label) + "&at=" + encodeURIComponent(time) +
    "&location_key=" + encodeURIComponent(accessKey)
}
export function liveMapURL(point: {latitude: number; longitude: number; timestamp: number}, accessKey: string, now = Date.now(), size: MapSize = DEFAULT_SIZE): string {
  if (!point || typeof point.latitude !== "number" || typeof point.longitude !== "number" ||
      !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) ||
      Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180 ||
      typeof point.timestamp !== "number" || !Number.isFinite(point.timestamp) ||
      now - point.timestamp > 120000 || point.timestamp - now > 60000) {
    throw new Error("לא התקבל מיקום עדכני. המפה השמורה נשארת ללא שינוי.")
  }
  // Vercel renders the PNG; the server controls the city backend and quota handoff.
  // No fixed test time/name: the server renders the current day/night map.
  return "https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?delivery=vercel-file-v1&" +
    `mode=live&width=${size.width}&presentation=glass&atlas=r6&reuse=60&shared_location=1&lat=` +
    point.latitude.toFixed(5) + "&lon=" + point.longitude.toFixed(5) +
    "&t=" + Math.floor(now / 60000) + "&location_key=" + encodeURIComponent(accessKey)
}
export async function currentLocation(timeoutMs = 15000) {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    // A late location result cannot trigger a download or modify the image.
    return await Promise.race([
      api("Location").requestCurrent({ forceRequest: true }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("קבלת המיקום ארכה יותר מדי. המפה השמורה נשארת ללא שינוי.")), timeoutMs)
      }),
    ])
  } finally { if (timer != null) clearTimeout(timer) }
}
export function accessKey(): string {
  const fm = api("FileManager")
  const config = JSON.parse(fm.readAsStringSync(api("Script").directory + "/private-config.json"))
  if (typeof config.mapAccessKey !== "string" || config.mapAccessKey.length < 32) {
    throw new Error("Private map configuration is missing")
  }
  return config.mapAccessKey
}
export async function downloadOnce(url: string, size: MapSize = DEFAULT_SIZE): Promise<Uint8Array> {
  return downloadBytes(url, 30000, true, new DownloadTrace(), size)
}

// Writer-only path: PNG validation and native decoding are mandatory in the
// prepared publisher before its first write. Avoid validating the same bytes twice.
export async function downloadForPublication(url: string, timeoutMs: number, trace = new DownloadTrace()): Promise<Uint8Array> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 30000) {
    throw new DownloadError("תקציב ההורדה אינו תקין [DOWNLOAD_BUDGET].", false)
  }
  return downloadBytes(url, timeoutMs, false, trace)
}

async function downloadBytes(url: string, timeoutMs: number, validatePNG: boolean, trace = new DownloadTrace(), size: MapSize = DEFAULT_SIZE): Promise<Uint8Array> {
  const controller = new (api("AbortController"))()
  trace.start(timeoutMs)
  const abort = () => { try { controller.abort() } catch (_) {} }
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      trace.timeout()
      reject(new DownloadError("ההורדה לא הסתיימה בזמן [DOWNLOAD_TIMEOUT].", true))
      abort()
    }, timeoutMs)
  })
  try {
    const request = (async () => {
      const response = await api("fetch")(url, {
        timeout: Math.min(25, Math.max(1, Math.ceil(timeoutMs / 1000))), signal: controller.signal,
        headers: { Accept: "image/png", "Cache-Control": "no-cache" },
        debugLabel: "Map Cache Test",
      })
      trace.headers(response)
      // A response can resume before an overdue JS timer. Check elapsed wall
      // time here, before reading/decoding its body, independently of that timer.
      trace.next("BODY")
      if (response.status !== 200) {
        const status = Number.isInteger(response.status) ? response.status : 0
        throw new DownloadError("שירות המפה החזיר HTTP " + status + " [DOWNLOAD_HTTP].",
          [408, 429, 500, 502, 503, 504].includes(response.status))
      }
      if (response.headers.get("x-map-service") !== "vercel-file-v1") {
        throw new DownloadError("שירות המפה אינו בגרסת Vercel המתאימה [DOWNLOAD_SERVICE].", false)
      }
      const type = String(response.headers.get("content-type") || response.mimeType || "")
        .split(";")[0].trim().toLowerCase()
      if (type !== "image/png") throw new DownloadError("השירות לא החזיר PNG [DOWNLOAD_TYPE].", false)
      const rawLength = response.headers.get("content-length")
      const expected = rawLength == null ? null : Number(rawLength)
      if (expected != null && (!Number.isFinite(expected) || expected < 57 || expected > MAX_BYTES)) {
        throw new DownloadError("גודל התשובה אינו תקין [DOWNLOAD_SIZE].", false)
      }
      const data = await response.data()
      trace.next("CONVERT")
      if (data.size > MAX_BYTES) throw new DownloadError("התמונה גדולה מהמותר [DOWNLOAD_SIZE].", false)
      const bytes = data.toUint8Array()
      trace.check()
      if (!bytes || bytes.length > MAX_BYTES) throw new DownloadError("נתוני התמונה אינם תקינים [DOWNLOAD_DATA].", false)
      const encoding = response.headers.get("content-encoding")
      if ((!encoding || encoding === "identity") && expected != null && bytes.length !== expected) {
        throw new DownloadError("התמונה התקבלה באופן חלקי [DOWNLOAD_INCOMPLETE].", true)
      }
      if (validatePNG) {
        trace.next("PNG")
        try { checkPNG(bytes, size) }
        catch (_) { throw new DownloadError("בדיקת תקינות PNG נכשלה [DOWNLOAD_PNG].", false) }
        trace.check()
      }
      return bytes
    })().catch(error => {
      if (error instanceof DownloadError) throw error
      trace.check()
      // Never include raw errors: native fetch may embed the authenticated URL.
      throw new DownloadError("הבקשה או קריאת התמונה נכשלה [DOWNLOAD_NETWORK].", true)
    })
    // A late result can never publish: downloading has no filesystem writes.
    return await Promise.race([request, deadline])
  } finally {
    if (timer != null) clearTimeout(timer)
    trace.finish()
    abort()
  }
}
export async function decode(bytes: Uint8Array, size: MapSize = DEFAULT_SIZE) {
  const data = api("Data").fromUint8Array(bytes)
  const image = data ? api("UIImage").fromData(data) : null
  if (!image || image.width !== size.width || image.height !== size.height) {
    throw new Error("iOS could not open the requested PNG")
  }
  // Validation only: never call toPNGData, resize, JPEG, or draw/encode.
}
async function downloadAndPublish(url: string, label: string, progress: (s: string) => void, size: MapSize) {
  let bytes: Uint8Array | null = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    progress(`מוריד מפה ${label} · ניסיון ${attempt}/2…`)
    try { bytes = await downloadOnce(url, size); break }
    catch (error) {
      if (attempt === 2 || (error instanceof DownloadError && !error.retryable)) throw error
      progress("ההורדה לא הושלמה. ניסיון נוסף בעוד רגע…")
      await new Promise<void>(resolve => setTimeout(resolve, 1200))
    }
  }
  if (!bytes) throw new Error("No image downloaded")
  progress("בודק ושומר את המפה…")
  const result = await publishCandidate(disk(), paths(), bytes, b => decode(b, size), size)
  return `מפה ${label} נשמרה ונקראה בחזרה ללא שינוי.\n${result.width} × ${result.height} · ${(result.bytes / 1000000).toFixed(2)} MB\nקוד בדיקה: ${result.fingerprint}`
}
export async function updateMap(label: "A" | "B", progress: (s: string) => void) {
  return withMapLock(async () => {
    await prepare()
    const size = await selectedSize()
    return downloadAndPublish(mapURL(label, accessKey(), size), label, progress, size)
  })
}
export async function updateLiveMap(progress: (s: string) => void, width?: number) {
  return withMapLock(async () => {
  const size = width == null ? await selectedSize() : await selectSize(width)
  await prepare()
  progress("מקבל את המיקום הנוכחי…")
  const point = await currentLocation()
  // Validate coordinates and their age before any network call.
  const url = liveMapURL(point, accessKey(), Date.now(), size)
  const result = await downloadAndPublish(url, "עדכנית", progress, size)
  return result + "\nהעדכון הסתיים. חזור לעותק הבדיקה ב־Widgy."
  })
}
export async function failureTest() {
  return withMapLock(async () => {
  const prior = await prepare()
  if (!prior) throw new Error("הורד קודם מפה A או B")
  const io = disk(), p = paths()
  let rejected = false
  try { await publishCandidate(io, p, prior.subarray(0, prior.length - 20), decode) }
  catch (_) { rejected = true }
  if (!rejected || !equalBytes(prior, await io.read(p.current))) {
    throw new Error("בדיקת השימור נכשלה — אין להשתמש בחיבור הזה עדיין")
  }
  return "קובץ קטוע נדחה והמפה הקודמת נשארה זהה בכל הבתים. זו בדיקת כשל מדומה; עדיין צריך לבדוק גם ניתוק רשת אמיתי."
  })
}
export async function preview() {
  // A healthy current image can be inspected even while a writer is busy.
  // Acquire the mutex only if recovery (and thus a possible write) is needed.
  let bytes: Uint8Array | null = null
  try { bytes = await disk().read(paths().current); checkSavedPNG(bytes) }
  catch (_) { bytes = await withMapLock(prepare) }
  if (!bytes) throw new Error("הורד קודם מפה A")
  await api("QuickLook").previewURLs([paths().current])
}
