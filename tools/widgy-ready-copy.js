const button = document.getElementById('copy');
const status = document.getElementById('status');
const manual = document.getElementById('manual');
const text = document.getElementById('text');
let payload = '';
function message(value, error = false) {
  status.textContent = value;
  status.classList.toggle('error', error);
}
function bytes(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
function selectAll() {
  text.focus();
  text.select();
  text.setSelectionRange(0, text.value.length);
}
document.getElementById('select').addEventListener('click', selectAll);
button.addEventListener('click', async () => {
  if (!payload) return;
  try {
    // Invoke synchronously within the tap to retain iOS clipboard permission.
    await navigator.clipboard.writeText(payload);
    message('כל ה־JSON הועתק! כעת אפשר להדביק ב־Widgy.');
    button.textContent = 'הועתק ✓ — העתק שוב';
  } catch {
    manual.hidden = false;
    text.value = payload;
    selectAll();
    message('הדפדפן חסם העתקה אוטומטית. בחר ״העתק״ בתפריט הטקסט, או פתח את הקישור ב־Chrome.', true);
  }
});
async function load() {
  const keyText = new URLSearchParams(location.hash.slice(1)).get('key');
  if (!keyText || !/^[A-Za-z0-9_-]{43}$/.test(keyText)) {
    message('פתח את הקישור המלא שנשלח לך בשיחה כדי לטעון את הקובץ.', true);
    return;
  }
  try {
    const response = await fetch('./widgy-gauge-1-clean.enc.json', { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('load_failed');
    const envelope = await response.json();
    if (envelope.v !== 1) throw new Error('version');
    const key = await crypto.subtle.importKey('raw', bytes(keyText), 'AES-GCM', false, ['decrypt']);
    const zipped = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(envelope.iv), additionalData: new TextEncoder().encode('widgy-ready-copy:v1:gauge-1') }, key, bytes(envelope.data));
    const stream = new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'));
    const value = await new Response(stream).text();
    const widget = JSON.parse(value);
    if (!Array.isArray(widget['1']) || widget['3'] !== 'Widgy Native Day Gauge 1') throw new Error('widget');
    payload = value;
    button.disabled = false;
    message('כל התוכן מוכן. לחץ להעתקה.');
  } catch {
    message('לא ניתן לטעון את הקובץ. פתח מחדש את הקישור המלא בשיחה באמצעות Chrome.', true);
  }
}
load();
