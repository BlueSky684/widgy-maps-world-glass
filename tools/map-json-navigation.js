import {withMapStaticOnly} from './map-static-only.js?v=map-static-only-1';

// Provider fields transcribed from the owner's successful native 27.0.1
// one-image export (2026-10-07 21:28). No file/bookmark or image data is copied.
export function withMapJsonNavigation(original, origin) {
  const widget = withMapStaticOnly(original, origin);
  const image = widget['1'].find(n => n.d0 === 245)?.['1'].find(n => n.d0 === 6170);
  if (image?.z !== '5' || image['1'] !== 'Web URL' || widget['36'].length !== 0) {
    throw new Error('unexpected_template');
  }
  image['1'] = 'JSON Endpoint';
  image['2'] = new URL('/assets/diagnostics/map-mask-compare-1/night.png', origin).href;
  image['8'] = new URL('/tools/widgy-map-source.json', origin).href;
  image['9'] = 'GET';
  image['11'] = {__widgy_auth_prefix: 'Bearer', __widgy_auth_header_name: 'Authorization'};
  image['13'] = ['image'];
  // The native JSON Endpoint export omits the old Web URL cache field.
  // Use its provider default; do not carry a different provider's cache flag.
  delete image['3'];
  widget['3'] = 'Widgy Map JSON Navigation 1';
  widget['4'] = 'Temporary 21-layer Home/Calendar performance test using the native Image JSON Endpoint fields from the successful one-image export. Home retains the static-control image frame, ID, name and position. The stable metadata URL selects image; field2 retains the last resolved full-resolution night PNG as in the native export. Web URL cache field3 is removed to match native provider defaults. Zero variables, widget JavaScript, location or calendar data. Calendar is the same static navigation control. This tests repeated navigation with a prepared external image; it does not create a live map or prove background refresh. Keep the full widget for normal use.';
  return widget;
}
