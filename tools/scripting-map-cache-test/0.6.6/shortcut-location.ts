import { SafeMapError } from "./platform"

const isoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})$/

function inputLines(input: unknown): string[] {
  if (typeof input !== "string" || input.length > 1024) {
    throw new SafeMapError("חבר ל־Parameter מלל עם קו רוחב, קו אורך וזמן התחלה; לאבחון הוסף בשורה רביעית זמן אחרי קבלת המיקום [SHORTCUT_LOCATION_SETUP].")
  }
  const lines = input.trim().split(/\r?\n/).map(line => line.trim())
  if ((lines.length !== 3 && lines.length !== 4) || lines.some(line => !line)) {
    throw new SafeMapError("נדרשות שלוש שורות, או ארבע עם זמן אחרי קבלת המיקום [SHORTCUT_LOCATION_INPUT].")
  }
  return lines
}

function readTime(value: string): number {
  if (!isoDate.test(value)) {
    throw new SafeMapError("בחר ISO 8601 עם שעה בפעולות המרת התאריך [SHORTCUT_DATE_FORMAT].")
  }
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) {
    throw new SafeMapError("לא ניתן לפענח את התאריך שהועבר מהקיצור [SHORTCUT_DATE_INVALID].")
  }
  return timestamp
}

// Wall-clock intervals, NOT sensor-fix timestamps. Line 3 stays BEFORE location
// acquisition; optional line 4 is captured immediately AFTER it. Neither time
// is refreshed by this script to bypass the original 120-second freshness gate.
export function shortcutTimingSummary(input: unknown, now = Date.now()): string {
  try {
    const lines = inputLines(input), started = readTime(lines[2])
    const seconds = (milliseconds: number) => (milliseconds / 1000).toFixed(1)
    const total = `מתחילת הקיצור עד Scripting: ${seconds(now - started)} ש׳.\n`
    if (lines.length === 3) return total + "אבחון חלקי: חסר זמן אחרי קבלת המיקום.\n"
    const ready = readTime(lines[3])
    return total + `עד סיום המיקום: ${seconds(ready - started)} ש׳ · מסיום המיקום לסקריפט: ${seconds(now - ready)} ש׳.\n`
  } catch (_) {
    // Never echo raw input, coordinates, native errors or invalid date text.
    return "מדידת הקיצור אינה זמינה: בדוק את שורות התאריך.\n"
  }
}

export function shortcutLocation(input: unknown, now = Date.now()) {
  const lines = inputLines(input)
  const number = (value: string) => {
    if (!/^[+-]?\d{1,3}(?:[.,]\d+)?$/.test(value)) return NaN
    return Number(value.replace(",", "."))
  }
  const latitude = number(lines[0]), longitude = number(lines[1])
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new SafeMapError("המיקום שהועבר אינו קו רוחב וקו אורך תקינים. בדוק את משתני הטקסט בקיצור [SHORTCUT_COORDINATES].")
  }
  const requestedAt = readTime(lines[2])
  const locationReturnedAt = lines.length === 4 ? readTime(lines[3]) : undefined
  if (requestedAt > now + 5000 || (locationReturnedAt !== undefined && locationReturnedAt > now + 5000)) {
    throw new SafeMapError("חותמת זמן מהקיצור מקדימה את שעון הסקריפט ביותר מ־5 שניות [SHORTCUT_CLOCK_FUTURE].")
  }
  if (locationReturnedAt !== undefined && locationReturnedAt < requestedAt) {
    throw new SafeMapError("זמן סיום המיקום מוקדם מזמן ההתחלה. בדוק את סדר משתני התאריך או שינוי בשעון [SHORTCUT_TIME_ORDER].")
  }
  if (now - requestedAt > 120000) {
    throw new SafeMapError(`עברו ${((now - requestedAt) / 1000).toFixed(1)} שניות מתחילת הבקשה; המגבלה היא 120 שניות [SHORTCUT_LOCATION_AGE].`)
  }
  return { latitude, longitude, requestedAt, locationReturnedAt }
}

