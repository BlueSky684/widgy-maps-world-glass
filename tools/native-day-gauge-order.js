// Widgy stores siblings front to back. The full-canvas chrome image is opaque
// in the day-progress strip, so the native gauge must precede it.
export function fixNativeDayGaugeOrder(original) {
  const widget = structuredClone(original);
  const home = widget['1'].find(n => n.s === 'HOME' && n.d0 === 245);
  if (!home) throw Error('unexpected_home');
  const layers = home['1'];
  const gaugeIndex = layers.findIndex(n => n.z === '18' && n.d0 === 82317);
  const chromeIndex = layers.findIndex(n => n.s === 'Approved Glass · Chrome and Frames' && n.d0 === 80309);
  if (gaugeIndex !== chromeIndex + 1 || chromeIndex < 0)
    throw Error('unexpected_day_gauge_order');
  [layers[chromeIndex], layers[gaugeIndex]] = [layers[gaugeIndex], layers[chromeIndex]];
  return widget;
}
