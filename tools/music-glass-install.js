const zipURL = 'https://raw.githubusercontent.com/BlueSky684/widgy-maps-world-glass/f50-widget-test/tools/Music_Glass_M1.zip';
const sourceURL = 'https://raw.githubusercontent.com/BlueSky684/widgy-maps-world-glass/f50-widget-test/tools/Music_Glass_M1_Source.txt';
// Documented developer import URL. Raw GitHub keeps the package reachable by
// Scripting without relying on a browser's Vercel Preview authentication cookie.
document.querySelector('#install').href = 'https://scripting.fun/import_scripts?urls=' + encodeURIComponent(JSON.stringify([zipURL]));
document.querySelector('#download').href = zipURL;
const status = document.querySelector('#status');
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    document.body.append(field);
    field.select();
    const success = document.execCommand('copy');
    field.remove();
    if (!success) throw new Error('לא ניתן להעתיק אוטומטית. סמן את הטקסט והעתק ידנית.');
  }
}
document.querySelector('#copy-link').addEventListener('click', async () => {
  try { await copy(zipURL); status.textContent = 'קישור החבילה הועתק.'; }
  catch (error) { status.textContent = String(error.message || error); }
});
document.querySelector('#copy-source').addEventListener('click', async () => {
  const button = document.querySelector('#copy-source');
  button.disabled = true;
  try {
    const response = await fetch(sourceURL);
    if (!response.ok) throw new Error('טעינת הקוד נכשלה. נסה שוב.');
    const source = await response.text();
    document.querySelector('#source').value = source;
    await copy(source);
    button.textContent = 'הקוד הועתק';
  } catch (error) { button.textContent = String(error.message || error); }
  finally { button.disabled = false; }
});
