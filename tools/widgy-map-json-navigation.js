import {personalizedWidget} from './calendar-connect-widget.js?v=perf-5-ringfix-1';
import {consolidateWidget} from './widget-consolidation.js?v=consolidated-1';
import {compactCalendarDots} from './calendar-compact-dots.js?v=compact-dots-1';
import {thinNativeStepsRing} from './native-steps-ring.js?v=native-ring-2';
import {withMapJsonNavigation} from './map-json-navigation.js?v=1';

const $ = id => document.getElementById(id);
let payload = '', downloadURL = '', busy = false;
function status(text, error = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', error);
}
async function prepare() {
  if (busy) return;
  busy = true;
  payload = '';
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = '';
  $('download').removeAttribute('href');
  $('copy').disabled = true;
  $('download').hidden = true;
  $('retry').hidden = true;
  status('מכין את עותק הבדיקה…');
  try {
    const response = await fetch('./Widgy_Home_Glass_Calendar_C16.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('template_failed');
    const origin = window.location.origin;
    const full = personalizedWidget(await response.json(),
      origin + '/api/calendar-dots?token=unused-map-test',
      origin + '/api/calendar-widget?token=unused-map-test');
    payload = JSON.stringify(withMapJsonNavigation(
      thinNativeStepsRing(compactCalendarDots(consolidateWidget(full))), origin));
    downloadURL = URL.createObjectURL(new Blob([payload], {type: 'application/json'}));
    $('download').href = downloadURL;
    $('download').hidden = false;
    $('copy').disabled = false;
    status('מוכן: Widgy Map JSON Navigation 1. מפה מלאה ומעבר בין Home ל־Calendar.');
  } catch {
    status('לא ניתן להכין את העותק כרגע. בדוק את החיבור ונסה שוב.', true);
    $('retry').hidden = false;
  } finally {
    busy = false;
  }
}
$('copy').addEventListener('click', async () => {
  if (!payload) return;
  try {
    await navigator.clipboard.writeText(payload);
    status('הועתק! ב־Widgy בחר Import URL Or JSON והדבק.');
  } catch {
    status('ההעתקה נחסמה. השתמש בקישור להורדת הקובץ.', true);
  }
});
$('retry').addEventListener('click', prepare);
window.addEventListener('pageshow', event => { if (event.persisted) prepare(); });
prepare();
