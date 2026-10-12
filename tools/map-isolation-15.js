// Diagnostic only: retain the full-resolution image provider and its exact
// frame/parent. Remove the rest of the document's layers and data dependencies.
// No API call, image fetch, new capability, or change to the original input.
export function mapIsolation15(original) {
  const widget = structuredClone(original);
  const home = widget['1']?.find(n => n.d0 === 245);
  const map = home?.['1']?.find(n => n.d0 === 6170);
  if (original['3'] !== 'Widgy Weather 15 — Stability' ||
      home?.z !== '13' || map?.z !== '5' || map['1'] !== 'JSON Endpoint' ||
      map['13']?.length !== 1 || map['13'][0] !== 'image' ||
      !Array.isArray(widget['36'])) throw Error('unexpected_stability_document');
  home['1'] = [map];
  widget['1'] = [home];
  widget['36'] = [];
  // No text remains, so custom font definitions are no longer needed.
  widget['38'] = [];
  widget['39'] = {};
  widget['3'] = 'Widgy Map Isolation 15';
  widget['4'] = 'Temporary two-layer diagnostic: same full-resolution image, exact provider, URL, frame and HOME parent as Weather 15 Stability. No other layers, variables or custom fonts. No new fault is activated. This is not a daily widget or a proven fix. A fresh minimal document also resets document state, so success alone does not prove memory pressure; compare with a fresh full copy before attributing a cause.';
  const text = JSON.stringify(widget);
  if (/\$\{widgy\.|Javascript|\/api\/calendar-|\/api\/location/.test(text))
    throw Error('unexpected_dependency');
  return widget;
}

// Comparison control: preserve every layer, variable, provider, and URL.
// A new display name helps the user import/select a separate full document.
// It does not promise that Widgy discards shared caches or internal state.
export function mapFreshFull15(original) {
  if (original?.['3'] !== 'Widgy Weather 15 — Stability' ||
      !Array.isArray(original['1'])) throw Error('unexpected_stability_document');
  const widget = structuredClone(original);
  widget['3'] = 'Widgy Weather 15 — Fresh Control';
  widget['4'] = 'Temporary full-document comparison after Map Isolation 15 displayed successfully. All layers, variables, image providers, URLs and image quality are identical to Weather 15 Stability. Import as a separate new widget and use the same screen slot. No server mode change or deliberate fault. This does not clear shared Widgy caches and is not a proven fix.';
  return widget;
}
