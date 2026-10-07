const endpoint = document.getElementById('endpoint');
const copy = document.getElementById('copy');
const status = document.getElementById('status');
const expected = new URL('./widgy-map-source.json', window.location.href);
endpoint.value = expected.href;

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(endpoint.value);
    status.textContent = 'הועתק. הדבק בשדה JSON Endpoint בשכבת התמונה ב־Widgy.';
  } catch {
    endpoint.focus();
    endpoint.select();
    status.textContent = 'בחר העתקה בתפריט כדי להעתיק את הכתובת המסומנת.';
  }
});

try {
  const response = await fetch(expected, {cache: 'no-store'});
  if (!response.ok) throw new Error('source_unavailable');
  const data = await response.json();
  const image = new URL(data.image);
  if (image.protocol !== 'https:' || !['A', 'B', 'C'].includes(data.revision)) {
    throw new Error('unexpected_source');
  }
  status.textContent = `המקור זמין: תמונת בדיקה ${data.revision}. אפשר להעתיק את הקישור.`;
  copy.disabled = false;
} catch {
  status.textContent = 'המקור לא זמין כרגע. טען את הדף מחדש בעוד רגע.';
}
