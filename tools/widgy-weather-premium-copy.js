import {formatJSONLines} from './json-copy-lines.js?v=1';

const button = document.getElementById('copy');
const status = document.getElementById('status');
const manual = document.getElementById('manual');
const text = document.getElementById('text');
const multiline = document.getElementById('multiline');
let payload = '';
let compactPayload = '', linePayload = '';
const message = (value, error = false) => {
  status.textContent = value;
  status.classList.toggle('error', error);
};
const bytes = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
function selectAll() {
  text.focus(); text.select(); text.setSelectionRange(0, text.value.length);
}
document.getElementById('select').addEventListener('click', selectAll);
multiline.addEventListener('change', () => {
  payload = multiline.checked ? linePayload : compactPayload;
  button.textContent = 'Copy Full JSON';
  if (!manual.hidden) text.value = payload;
  if (payload) message(multiline.checked ? 'מוכן להעתקה בשורות. כל נתוני הווידג׳ט נשמרו.' : 'מוכן להעתקה בשורה אחת, כמו קודם.');
});
button.addEventListener('click', async () => {
  if (!payload) return;
  try {
    // No fetch/decryption before this call: preserve the iPhone tap activation.
    await navigator.clipboard.writeText(payload);
    message('כל תוכן הקובץ הועתק. אפשר להדביק ישירות ב־Widgy.');
    button.textContent = 'Copied ✓ — Copy Full JSON';
  } catch {
    manual.hidden = false; text.value = payload; selectAll();
    try {
      if (document.execCommand('copy')) {
        manual.hidden = true;
        message('כל תוכן הקובץ הועתק. אפשר להדביק ישירות ב־Widgy.');
        return;
      }
    } catch {}
    message('בחר ״העתק״ בתפריט הטקסט כדי להעתיק את כל התוכן.', true);
  }
});
async function load() {
  const keyText = new URLSearchParams(location.hash.slice(1)).get('key');
  if (!/^[A-Za-z0-9_-]{43}$/.test(keyText || '')) {
    message('פתח את הקישור המלא מהשיחה כדי לטעון את הקובץ.', true); return;
  }
  try {
    const response = await fetch('./widgy-weather-premium-8.enc.json', {credentials:'omit', referrerPolicy:'no-referrer'});
    if (!response.ok) throw Error('load_failed');
    const envelope = await response.json();
    if (envelope.v !== 1) throw Error('version');
    const key = await crypto.subtle.importKey('raw', bytes(keyText), 'AES-GCM', false, ['decrypt']);
    const zipped = await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(envelope.iv),additionalData:new TextEncoder().encode('widgy-weather-premium-copy:v1:20261009')},key,bytes(envelope.data));
    const raw = await new Response(new Blob([zipped]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',raw))].map(n=>n.toString(16).padStart(2,'0')).join('');
    if (raw.byteLength !== envelope.bytes || hash !== envelope.sha256) throw Error('integrity');
    const value = new TextDecoder('utf-8',{fatal:true}).decode(raw);
    const widget = JSON.parse(value);
    if (!Array.isArray(widget['1']) || widget['3'] !== 'Widgy Weather Premium 8') throw Error('widget');
    compactPayload = value;
    linePayload = formatJSONLines(value);
    // Validate the display-oriented representation before enabling copy. The
    // formatter itself preserves tokens; this also checks the complete object.
    if (JSON.stringify(JSON.parse(linePayload)) !== JSON.stringify(widget)) throw Error('format_integrity');
    payload = multiline.checked ? linePayload : compactPayload;
    button.disabled = false; multiline.disabled = false;
    message(multiline.checked ? 'הקובץ המלא נבדק ומוכן להעתקה בשורות. לחץ Copy Full JSON.' : 'הקובץ המלא נטען ונבדק. לחץ Copy Full JSON.');
  } catch {
    payload = ''; compactPayload = ''; linePayload = ''; button.disabled = true; multiline.disabled = true;
    message('הקובץ לא נטען. פתח מחדש את הקישור המלא מהשיחה ב־Chrome.', true);
  }
}
load();
