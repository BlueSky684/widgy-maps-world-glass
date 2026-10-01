// The Sun And Moon data sources supply today's local sunrise/sunset for Widgy's
// current location. JavaScript Date uses the device's current time zone, including
// its daylight-saving rules. Never store an Israel offset or a fixed day length.
export function localSolarTime(value, now) {
  let text = String(value == null ? '' : value)
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, c => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[\uff10-\uff19]/g, c => String(c.charCodeAt(0) - 0xff10))
    .replace(/\u00a0|\u202f/g, ' ').trim();
  if (!text || text.includes('${')) return NaN;
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const parsed = new Date(text);
    if (!Number.isFinite(parsed.getTime()) || parsed.getFullYear() !== now.getFullYear()
      || parsed.getMonth() !== now.getMonth() || parsed.getDate() !== now.getDate()) return NaN;
    return parsed.getTime();
  }
  const match = text.match(/^(\d{1,2})[:.](\d{2})(?::(\d{2}))?\s*(.*?)$/);
  if (!match) return NaN;
  let hour = Number(match[1]);
  const minute = Number(match[2]), second = Number(match[3] || 0);
  const suffix = match[4].toLowerCase().replace(/[.\s"'״׳]/g, '');
  const am = ['am', 'לפנהצ', '上午', 'ص'].includes(suffix);
  const pm = ['pm', 'אחהצ', '下午', 'م'].includes(suffix);
  if (suffix && !am && !pm) return NaN;
  if (minute > 59 || second > 59 || hour > 23 || ((am || pm) && (hour < 1 || hour > 12))) return NaN;
  if (am || pm) hour = hour % 12 + (pm ? 12 : 0);
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, 0);
  // A nonexistent local time during a clock change must not silently shift.
  if (result.getHours() !== hour || result.getMinutes() !== minute) return NaN;
  return result.getTime();
}

export function daylightPercent(now, sunrise, sunset) {
  const start = localSolarTime(sunrise, now), end = localSolarTime(sunset, now);
  // Missing data and days without a normal rise/set pair are shown as unavailable.
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return -1;
  return Math.max(0, Math.min(100, Math.floor((now.getTime() - start) * 100 / (end - start))));
}

export const daylightScript = `${localSolarTime.toString()}\n${daylightPercent.toString()}\nfunction main() {\n  return daylightPercent(new Date(), '\${widgy.sunrise_today}', '\${widgy.sunset_today}');\n}`;
export const daylightLabelScript = `function main() {\n  var value = Number('\${widgy.day_progress}');\n  return isFinite(value) && value >= 0 && value <= 100 ? value + '%' : '—';\n}`;
