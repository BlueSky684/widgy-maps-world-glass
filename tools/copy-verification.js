export const verificationMarkup = `
<button id="verify-copy" type="button" class="secondary">בדיקת הטקסט שהועתק</button>
<p id="verify-status" role="status" aria-live="polite" class="small">לאחר ההעתקה, לחץ לבדיקה שהתוכן הועתק במלואו.</p>
<details id="verify-manual"><summary>אימות באמצעות הדבקת הטקסט</summary>
<p class="small">הדבק כאן את הטקסט שהעתקת ולחץ על אימות.</p>
<textarea id="verify-text" aria-label="הדבק כאן את הטקסט שהועתק" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
<button id="verify-paste" type="button" class="secondary">אימות הטקסט שהודבק</button>
</details>`;

// Read only on an explicit verification click. Clipboard contents stay on the
// device: no logging, network calls or automatic rendering of clipboard data.
export function installCopyVerification(getExpected) {
  const button = document.getElementById('verify-copy');
  const status = document.getElementById('verify-status');
  const manual = document.getElementById('verify-manual');
  const input = document.getElementById('verify-text');
  const pasteButton = document.getElementById('verify-paste');
  const message = (value, error = false) => {
    status.textContent = value;
    status.classList.toggle('error', error);
  };
  const normalize = value => String(value).replace(/\r\n/g, '\n');
  function verify(value, expected) {
    if (!expected || getExpected() !== expected) {
      message('הקובץ עדיין לא מוכן, או שצורת ההעתקה השתנתה. העתק שוב ובדוק.', true);
      return;
    }
    if (normalize(value) === normalize(expected)) {
      message('✓ ההעתקה אומתה: כל הטקסט תואם לקובץ המלא. אפשר להדביק ב־Widgy.');
    } else {
      message('הטקסט אינו תואם לקובץ המלא. לחץ שוב על Copy Full JSON ואז בדוק שוב.', true);
    }
  }
  button.addEventListener('click', async () => {
    const expected = getExpected();
    if (!expected) { verify('', expected); return; }
    // No await before readText: preserve the browser's user activation.
    try {
      const value = await navigator.clipboard.readText();
      verify(value, expected);
    } catch {
      manual.open = true;
      message('הדפדפן לא אפשר לקרוא את ההעתקה. הדבק את הטקסט בשדה שמתחת ולחץ על אימות.');
    }
  });
  pasteButton.addEventListener('click', () => verify(input.value, getExpected()));
  const reset = () => message('הטקסט טרם אומת. לחץ על בדיקת הטקסט שהועתק.');
  input.addEventListener('input', reset);
  document.getElementById('multiline').addEventListener('change', reset);
  document.getElementById('copy').addEventListener('click', reset);
}
