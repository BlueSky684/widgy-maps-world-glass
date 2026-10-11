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
  try {
    const response = await fetch('./Widgy_Device_Chart_Compare_1.json?v=1', {cache:'no-store'});
    if (!response.ok) throw Error('load_failed');
    const value = await response.text();
    const widget = JSON.parse(value);
    if (!Array.isArray(widget['1']) || widget['3'] !== 'Widgy Device Chart Compare 1' || widget['1'].length !== 4 || widget['1'][1].z !== '8' || widget['1'][2].z !== '9' || widget['1'].slice(1,3).some(n=>n['2']!=='Battery Level')) throw Error('widget');
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
