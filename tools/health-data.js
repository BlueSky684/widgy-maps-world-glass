// Native picker names transcribed from the owner's Widgy 27.0.1 video.
// The data is evaluated by Widgy/HealthKit on the phone, never sent to Vercel.
export const HEALTH_SOURCES = {
  calories: ['Health (Daily)', 'Active Energy Burned'],
  distance: ['Pedometer', 'Distance'],
  exercise: ['Health (Activity)', 'Exercise'],
  stand: ['Health (Activity)', 'Stand'],
  workouts: ['Health (Workouts)', 'Workouts Today'],
  heart: ['Health (Last Reading)', 'Heart Rate'],
  hrv: ['Health (Daily)', 'Heart Rate Variability SDNN (Avg)'],
  resting: ['Health (Last Reading)', 'Resting Heart Rate'],
  oxygen: ['Health (Last Reading)', 'Oxygen Saturation'],
  sleep: ['Health (Daily)', 'Sleep Analysis (Duration)'],
  breathing: ['Health (Last Reading)', 'Apple Sleeping Breathing Disturbances'],
  cardio: ['Health (Last Reading)', 'VO2Max'],
};

// Preserve the native unit/locale string. Do not reinterpret kcal as kJ, metres
// as kilometres, minutes as hours, or a breathing index as events per hour.
export function nativeReading(raw, {positive = false} = {}) {
  const s = String(raw ?? '').trim();
  if (!s || s.includes('${') || !/[0-9]/.test(s) || /^(?:nan|infinity|null|undefined|n\/a)/i.test(s)) return '—';
  if (/^-\s*\d/.test(s)) return '—';
  if (positive && !/[1-9]/.test(s.match(/^[\d\s.,:%]+/)?.[0] || '')) return '—';
  return s;
}
export function stepValue(raw, percent = false) {
  const s = String(raw ?? '').trim().replace(/[,\s]/g, '');
  if (!/^\d+$/.test(s)) return '—';
  const n = Number(s);
  if (!Number.isSafeInteger(n)) return '—';
  return percent ? Math.floor(n / 10000 * 100) + '%' : s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export const source = (category, field) => ({'5': category, '6': field});
export const customText = value => ({'5':'Custom Text', '6':'Text', '25':value});
export const javascript = value => ({'5':'Javascript', '6':'Script', '10':value});
export function readingScript(key, prefix = '') {
  const positive = ['heart','hrv','resting','oxygen','sleep','breathing','cardio'].includes(key);
  return `function main(){var read=${nativeReading.toString()};var value=read('${'${widgy.health_'+key+'}'}',{positive:${positive}});return ${JSON.stringify(prefix)}+value;}`;
}
export function stepsScript(percent = false) {
  return `function main(){var read=${stepValue.toString()};return read('${'${widgy.steps_today}'}',${percent});}`;
}
export const SOURCE_LIMITATIONS = [
  'Daily sleep is the native daily duration, not a verified last-night session.',
  'Last-reading timestamps are not mapped; never display widget refresh time as measurement time.',
  'Historical date selection is not mapped. Six previous days remain unconnected; only today is live.',
  'Native HealthKit permission, absence handling, units, ring scales and rendering require phone verification.',
  'Zero-valued health readings (including breathing) are conservatively hidden until native absence behavior is verified; activity zeroes remain valid.',
];
