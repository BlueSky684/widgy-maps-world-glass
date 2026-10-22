import { api } from "./platform"
import type { UpdateOutcome } from "./writer"

export const RETRY_PURPOSE = "world-glass-map-recovery"
export const RETRY_SECONDS = 60
const TICK_TITLE = "World Glass Map Tick"
// One reservation survives failed runs and process restarts. A successful map
// publication re-arms recovery. No timer steals a writer lock or retries I/O.
const TABLE = "map_recovery_v1"
export const CREATE_RECOVERY = `CREATE TABLE IF NOT EXISTS ${TABLE} (slot INTEGER PRIMARY KEY CHECK(slot = 1), token TEXT NOT NULL, created_ms REAL NOT NULL)`
export const RESERVE_RECOVERY = `INSERT INTO ${TABLE} (slot, token, created_ms) VALUES (1, ?, ?)`

export function isRecovery(request: any): boolean {
  return request?.content?.title === TICK_TITLE && request?.content?.userInfo?.purpose === RETRY_PURPOSE
}
function isRecurring(request: any): boolean {
  const info = request?.content?.userInfo
  return request?.content?.title === TICK_TITLE && info?.purpose === "world-glass-map-recurring" && info.intervalMinutes === 15
}
async function pendings(): Promise<any[]> {
  const result = await api("Notification").getAllPendingsOfCurrentScript()
  if (!Array.isArray(result)) throw new Error("Pending requests unavailable")
  return result
}
async function database() {
  const db = api("SQLite").open(api("FileManager").appGroupDocumentsDirectory + "/MapCacheTest-writer.sqlite", { busyMode: "immediateError" })
  await db.execute(CREATE_RECOVERY)
  return db
}
async function ownsReservation(db: any, token: string): Promise<boolean> {
  const rows = await db.fetchAll(`SELECT token FROM ${TABLE} WHERE slot = 1`)
  return Array.isArray(rows) && rows.length === 1 && rows[0].token === token
}
export async function cancelRecovery(token?: string): Promise<void> {
  const requests = (await pendings()).filter(r => isRecovery(r) && (token == null || r.content.userInfo.token === token))
  if (!requests.length) return
  const ids = requests.map(r => r.identifier)
  if (ids.some(id => typeof id !== "string" || !id)) throw new Error("Missing request identity")
  await api("Notification").removePendings(ids)
  if ((await pendings()).some(r => isRecovery(r) && (token == null || r.content.userInfo.token === token))) throw new Error("Recovery cancellation unverified")
}

// Only observed elapsed-time failures qualify in this release. Invalid input,
// corrupt images, permission errors, contention and any started publication
// remain immediate failures; broad network-error retries are not assumed safe.
export function canRecover(outcome: UpdateOutcome): boolean {
  return outcome.ok === false && !outcome.publicationStarted &&
    ["UPDATE_TIME", "DOWNLOAD_TIMEOUT", "DOWNLOAD_LATE_HTTP", "DOWNLOAD_LATE_BODY", "DOWNLOAD_LATE_CONVERT",
      "NATIVE_EXPIRED", "NATIVE_LOCATION_AGE", "NATIVE_SAVE_LATE"].includes(outcome.code)
}

export type RecoveryResult = "queued" | "exhausted" | "unavailable" | "ineligible"

// Native GET can fail without ever entering the finalizer. Reserve the single
// recovery BEFORE handing the URL to Shortcuts, so its completion watch can
// request that one fresh invocation. An exhausted budget gets an alert-only
// watch, whose title cannot trigger the automation. No retry chain is possible.
export async function reserveRecoveryForWatch(token: string): Promise<"reserved" | "exhausted" | "unavailable"> {
  try {
    if (api("Script").env !== "intent") return "unavailable"
    const before = await pendings()
    if (before.filter(isRecurring).length !== 1 || before.some(isRecovery)) return "unavailable"
    const db = await database(), started = Date.now()
    try { await db.execute(RESERVE_RECOVERY, [token, started]) }
    catch (_) {
      const rows = await db.fetchAll(`SELECT token FROM ${TABLE} WHERE slot = 1`)
      return Array.isArray(rows) && rows.length === 1 ? "exhausted" : "unavailable"
    }
    const after = await pendings()
    return after.filter(isRecurring).length === 1 && !after.some(isRecovery) &&
      await ownsReservation(db, token) && Date.now() >= started && Date.now() - started <= 5000 ? "reserved" : "unavailable"
  } catch (_) { return "unavailable" }
}

export async function requestRecovery(outcome: UpdateOutcome, reservedNativeToken?: string): Promise<RecoveryResult> {
  if (!canRecover(outcome)) return "ineligible"
  let token: string | undefined
  try {
    if (api("Script").env !== "intent") return "unavailable"
    // Require the existing working automation's tick. Never enable a stopped
    // schedule, change its cadence, or introduce another recurring notification.
    const before = await pendings()
    if (before.filter(isRecurring).length !== 1) return "unavailable"
    const db = await database()
    token = reservedNativeToken ?? api("UUID").string()
    const reservedAt = Date.now()
    try {
      // A caught native timeout may move its own planned two-minute recovery
      // to one minute from now, after cancelling the original watch. It cannot
      // reuse a reservation owned by an earlier failed attempt.
      if (reservedNativeToken != null) {
        if (!await ownsReservation(db, token)) return "exhausted"
      } else await db.execute(RESERVE_RECOVERY, [token, reservedAt])
    }
    catch (_) {
      // A retained reservation prevents retries after failed retries. SQL/I/O
      // errors are also fail-closed: report the map failure immediately.
      const rows = await db.fetchAll(`SELECT token FROM ${TABLE} WHERE slot = 1`)
      return Array.isArray(rows) && rows.length === 1 ? "exhausted" : "unavailable"
    }
    // Do not add to an older pending retry, even if its reservation was lost.
    if (before.some(isRecovery)) return "unavailable"
    const current = await pendings()
    if (current.filter(isRecurring).length !== 1 || current.some(isRecovery) ||
        !await ownsReservation(db, token) || Date.now() - reservedAt > 5000 || Date.now() < reservedAt) return "unavailable"
    const Trigger = api("TimeIntervalNotificationTrigger")
    await api("Notification").schedule({
      title: TICK_TITLE, body: "ניסיון התאוששות יחיד לעדכון מפת World Glass.",
      silent: true, interruptionLevel: "active", tapAction: "none", customUI: false,
      trigger: new Trigger({ timeInterval: RETRY_SECONDS, repeats: false }),
      threadIdentifier: "world-glass-map-tick",
      userInfo: { purpose: RETRY_PURPOSE, token, version: 1 }
    })
    const after = await pendings()
    const retry = after.filter(isRecovery)
    if (after.filter(isRecurring).length !== 1 || retry.length !== 1 || retry[0].content.userInfo.token !== token ||
        !await ownsReservation(db, token) || Date.now() - reservedAt > 5000 || Date.now() < reservedAt) throw new Error("Recovery unverified")
    return "queued"
  } catch (_) {
    // Clean up only this request. Never cancel or replace the regular tick.
    if (token != null) { try { await cancelRecovery(token) } catch (_) {} }
    return "unavailable"
  }
}

export async function finishRecovery(ok: boolean): Promise<boolean> {
  // Best effort only; never turn a verified map publication into a failure.
  // Cancel first, then clear the reservation. If cleanup fails, keep the latch
  // closed so another failure cannot create overlapping recovery requests.
  try {
    await cancelRecovery()
    const db = await database()
    if (!ok) return false
    const rows = await db.fetchAll(`SELECT token FROM ${TABLE} WHERE slot = 1`)
    if (!Array.isArray(rows) || rows.length > 1) return false
    // Delete the exact reservation seen, not a concurrent newer reservation.
    if (rows.length) await db.execute(`DELETE FROM ${TABLE} WHERE slot = 1 AND token = ?`, [rows[0].token])
    return rows.length === 1
  } catch (_) { return false }
}

