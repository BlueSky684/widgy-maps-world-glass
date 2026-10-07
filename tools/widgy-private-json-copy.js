const picker = document.getElementById('file');
const button = document.getElementById('copy');
const status = document.getElementById('status');
let payload = '', selection = 0;
function message(text, error = false) {
  status.textContent = text;
  status.classList.toggle('error', error);
}
picker.addEventListener('change', async () => {
  const current = ++selection;
  payload = '';
  button.disabled = true;
  const file = picker.files?.[0];
  if (!file) { message('בחר קובץ כדי להכין אותו להעתקה.'); return; }
  message('קורא את הקובץ במכשיר…');
  try {
    const text = (await file.text()).replace(/^\uFEFF/, '');
    if (current !== selection) return;
    const widget = JSON.parse(text);
    if (!Array.isArray(widget['1']) || typeof widget['3'] !== 'string') throw new Error('invalid_widget');
    payload = text;
    button.disabled = false;
    message(`מוכן להעתקה: ${widget['3']}`);
  } catch {
    if (current !== selection) return;
    message('לא זוהה קובץ JSON תקין של Widgy. בחר את הקובץ שהורדת מהשיחה.', true);
  }
});
button.addEventListener('click', async () => {
  if (!payload) return;
  try {
    await navigator.clipboard.writeText(payload);
    message('הועתק! ב־Widgy בחר Import URL Or JSON והדבק.');
  } catch {
    message('ההעתקה נחסמה. פתח את הדף ב־Chrome ולחץ שוב על הכפתור.', true);
  }
});
