// Platform-independent checks. Original PNG bytes are never re-encoded.
export const MAX_BYTES = 6 * 1024 * 1024
export const WIDTH = 2400
export const HEIGHT = 1131
type MapSize = { width: number; height: number }
const CURRENT_SIZE: MapSize = { width: WIDTH, height: HEIGHT }
// Read-only migration support: never request or publish a new legacy-size image.
const LEGACY_SIZE: MapSize = { width: 3306, height: 1558 }
const signature = [137, 80, 78, 71, 13, 10, 26, 10]
const table = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  table[n] = c >>> 0
}
export function crc32(bytes: Uint8Array, start = 0, end = bytes.length): number {
  let c = 0xffffffff
  for (let i = start; i < end; i++) c = table[(c ^ bytes[i]) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function u32(a: Uint8Array, i: number): number {
  return (a[i] * 16777216 + (a[i + 1] << 16) + (a[i + 2] << 8) + a[i + 3]) >>> 0
}
export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
export function checkPNG(bytes: Uint8Array) { return checkSize(bytes, CURRENT_SIZE) }

function checkSize(bytes: Uint8Array, expected: MapSize) {
  if (bytes.length < 57 || bytes.length > MAX_BYTES) throw new Error("PNG size rejected")
  if (!signature.every((v, i) => bytes[i] === v)) throw new Error("Not a PNG image")
  let offset = 8, count = 0, dataBytes = 0, ended = false
  while (offset < bytes.length) {
    if (bytes.length - offset < 12) throw new Error("Truncated PNG chunk")
    const len = u32(bytes, offset)
    const next = offset + 12 + len
    if (next > bytes.length) throw new Error("Truncated PNG data")
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    if (crc32(bytes, offset + 4, offset + 8 + len) !== u32(bytes, offset + 8 + len)) {
      throw new Error("PNG checksum mismatch")
    }
    if (count === 0 && (type !== "IHDR" || len !== 13)) throw new Error("PNG header missing")
    if (type === "IHDR") {
      if (count !== 0 || len !== 13) throw new Error("Duplicate PNG header")
      if (u32(bytes, offset + 8) !== expected.width || u32(bytes, offset + 12) !== expected.height) {
        throw new Error("Unexpected PNG dimensions")
      }
    }
    if (type === "IDAT") dataBytes += len
    if (type === "IEND") {
      if (len !== 0 || next !== bytes.length || dataBytes === 0) throw new Error("Invalid PNG end")
      ended = true
    }
    count++
    offset = next
  }
  if (!ended) throw new Error("PNG download is incomplete")
  return { bytes: bytes.length, width: expected.width, height: expected.height,
    fingerprint: crc32(bytes).toString(16).padStart(8, "0") }
}

// Preserve the last good map during upgrade, including a legacy-size backup.
// All new downloads and publications are strictly 2400 x 1131.
export function checkSavedPNG(bytes: Uint8Array) {
  const size = [CURRENT_SIZE, LEGACY_SIZE].find(s =>
    bytes.length >= 24 && u32(bytes, 16) === s.width && u32(bytes, 20) === s.height)
  if (!size) throw new Error("Unsupported saved map dimensions")
  return checkSize(bytes, size)
}

export type IO = {
  exists(path: string): Promise<boolean>
  read(path: string): Promise<Uint8Array>
  write(path: string, data: Uint8Array): Promise<void>
  remove(path: string): Promise<void>
}
export type Paths = { current: string; stage: string; backup: string }
async function writeVerified(io: IO, path: string, bytes: Uint8Array) {
  await io.write(path, bytes)
  if (!equalBytes(await io.read(path), bytes)) throw new Error("File verification failed")
}
async function validFile(io: IO, path: string) {
  if (!(await io.exists(path))) return null
  const bytes = await io.read(path)
  try { return { bytes, result: checkSavedPNG(bytes) } } catch (_) { return null }
}
// Recovery happens before a new download. Keep a bounded backup on disk.
export async function recoverCurrent(io: IO, paths: Paths): Promise<Uint8Array | null> {
  return (await recoverSnapshot(io, paths))?.bytes ?? null
}
async function recoverSnapshot(io: IO, paths: Paths) {
  const current = await validFile(io, paths.current)
  if (current) return current
  const backup = await validFile(io, paths.backup)
  if (backup) { await writeVerified(io, paths.current, backup.bytes); return backup }
  return null
}
export async function publishCandidate(
  io: IO, paths: Paths, bytes: Uint8Array,
  decode: (bytes: Uint8Array) => Promise<void>,
) {
  const result = checkPNG(bytes)
  await decode(bytes)
  // No published file is touched by a download/validation/decode failure.
  const prior = await recoverCurrent(io, paths)
  return publishValidated(io, paths, bytes, prior, result)
}

// Call only while holding the shared map-writer lock. Capture a validated
// previous image once; the one-use publisher keeps that snapshot private.
export async function preparePublisher(io: IO, paths: Paths,
  observe: <T>(label: string, work: () => Promise<T>) => Promise<T> = (_, work) => work()) {
  const snapshot = await recoverSnapshot(io, paths)
  const prior = snapshot?.bytes ?? null
  let used = false
  return {
    hasCurrent: prior != null,
    // Metadata and bytes are from the same validated read under the writer
    // lock. Do not reread current just to obtain the baseline fingerprint.
    currentFingerprint: snapshot?.result.fingerprint ?? null,
    async publish(bytes: Uint8Array, decode: (bytes: Uint8Array) => Promise<void>, beforeWrite: () => void,
      beforeCurrentWrite: () => void = () => {}) {
      if (used) throw new Error("Prepared publisher has already been used")
      used = true
      const result = await observe("בדיקת מבנה PNG", async () => checkPNG(bytes))
      await observe("פענוח תמונה", () => decode(bytes))
      // A late download or decode cannot start any candidate/backup/current write.
      beforeWrite()
      return publishValidated(io, paths, bytes, prior, result, beforeCurrentWrite)
    },
  }
}

async function publishValidated(
  io: IO, paths: Paths, bytes: Uint8Array, prior: Uint8Array | null,
  result: ReturnType<typeof checkPNG>,
  beforeCurrentWrite: () => void = () => {},
) {
  try {
    await writeVerified(io, paths.stage, bytes)
    if (prior) await writeVerified(io, paths.backup, prior)
    // A suspension during temporary/backup I/O must not begin a late overwrite.
    // Keep this gate OUTSIDE the rollback catch: current has not been touched.
    beforeCurrentWrite()
    try {
      // Scripting documents overwrite, NOT atomic replacement. This experiment
      // tests native file handoff; it makes no crash-atomicity claim.
      await writeVerified(io, paths.current, bytes)
    } catch (error) {
      if (prior) {
        try { await writeVerified(io, paths.current, prior) }
        catch (_) { throw new Error("Write and restore failed; backup retained. Reopen the test.") }
      } else {
        try { if (await io.exists(paths.current)) await io.remove(paths.current) } catch (_) {}
      }
      throw new Error("Publish failed" + (prior ? "; previous map restored" : "") + ": " + String(error))
    }
    return result
  } finally {
    try { if (await io.exists(paths.stage)) await io.remove(paths.stage) } catch (_) {}
  }
}

