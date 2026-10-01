import assert from 'node:assert/strict';
import {STEPS_RING} from './home_glass_design.mjs';

// Short convex capsules overlap to form a continuous round-ended stroke.
// Unlike a long concave outline, each individual layer has no hole to fill.
// The 3.6-degree chord differs from the radius-63 circle by <0.032 pixels.
export function stepRingSegment(percent) {
  assert(Number.isInteger(percent) && percent >= 1 && percent <= 100);
  const {width, height, radius, stroke} = STEPS_RING;
  const a0 = -Math.PI / 2 + (percent - 1) * 2 * Math.PI / 100;
  const a1 = -Math.PI / 2 + percent * 2 * Math.PI / 100;
  const start = [radius * Math.cos(a0), radius * Math.sin(a0)];
  const end = [radius * Math.cos(a1), radius * Math.sin(a1)];
  const tangent = Math.atan2(end[1] - start[1], end[0] - start[0]);
  const points = [];
  for (const [center, angle] of [[end, tangent - Math.PI / 2], [start, tangent + Math.PI / 2]]) {
    for (let i = 0; i <= 12; i++) {
      const a = angle + Math.PI * i / 12;
      points.push({
        x: Math.round((width / 2 + center[0] + stroke / 2 * Math.cos(a)) / width * 1e6) / 1e6,
        y: Math.round((height / 2 + center[1] + stroke / 2 * Math.sin(a)) / height * 1e6) / 1e6,
      });
    }
  }
  return points;
}

export function replaceStepsRing(widget) {
  const home = widget['1'].find(n => n.d0 === 245);
  const layers = home['1'].filter(n => n.s?.startsWith('Steps Goal Ring'));
  assert.equal(layers.length, 100);
  for (const layer of layers) {
    assert.equal(layer.o1['1'], 5);
    const library = JSON.parse(Buffer.from(layer['2'], 'base64').toString());
    const item = library.items.find(item => item.id === layer['3']);
    assert(item);
    item.shape.points = stepRingSegment(Number(layer.o1['2']));
    item.shape.rounding = 0;
    layer['2'] = Buffer.from(JSON.stringify(library)).toString('base64');
  }
  return widget;
}
