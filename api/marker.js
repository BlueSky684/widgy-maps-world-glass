import { PNG } from 'pngjs';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function blendPixel(png, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || a <= 0) return;

  const idx = (png.width * y + x) << 2;
  const srcA = clamp(a, 0, 255) / 255;
  const dstA = png.data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;

  png.data[idx] = Math.round((r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
  png.data[idx + 1] = Math.round((g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
  png.data[idx + 2] = Math.round((b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
  png.data[idx + 3] = Math.round(outA * 255);
}

function drawCircle(png, cx, cy, radius, color, alpha) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius - 1); y <= Math.ceil(cy + radius + 1); y++) {
    for (let x = Math.floor(cx - radius - 1); x <= Math.ceil(cx + radius + 1); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) {
        blendPixel(png, x, y, color[0], color[1], color[2], alpha);
      }
    }
  }
}

export default async function handler(req, res) {
  try {
    // Optional query override is kept only for controlled testing.
    const qLat = Number(req.query.lat);
    const qLon = Number(req.query.lon);

    const hLat = Number(req.headers['x-vercel-ip-latitude']);
    const hLon = Number(req.headers['x-vercel-ip-longitude']);

    const lat = Number.isFinite(qLat) ? qLat : hLat;
    const lon = Number.isFinite(qLon) ? qLon : hLon;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(400).json({ error: 'No usable location coordinates' });
      return;
    }

    const width = 1536;
    const height = 963;

    // Exact visual bounds of the approved map silhouette.
    const MAP_LEFT = 49;
    const MAP_RIGHT = 1456;
    const MAP_TOP = 93;
    const MAP_BOTTOM = 861;

    // Visual latitude coverage of this approved world silhouette.
    const LAT_TOP = 83;
    const LAT_BOTTOM = -58;

    const x = MAP_LEFT + ((lon + 180) / 360) * (MAP_RIGHT - MAP_LEFT);
    const y = MAP_TOP + ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * (MAP_BOTTOM - MAP_TOP);

    const png = new PNG({ width, height, colorType: 6 });
    png.data.fill(0);

    // Approved marker appearance: visible, bright, but not neon-heavy.
    const blue = [10, 132, 255];
    const outer = 34;
    const middle = 23;
    const blueCore = 13;
    const whiteCore = 6;

    drawCircle(png, x, y, outer, blue, 30);
    drawCircle(png, x, y, middle, blue, 78);
    drawCircle(png, x, y, blueCore, blue, 255);
    drawCircle(png, x, y, whiteCore, [255, 255, 255], 255);

    console.log('WIDGY_MARKER_GEO', JSON.stringify({
      lat, lon,
      city: req.headers['x-vercel-ip-city'] || null,
      country: req.headers['x-vercel-ip-country'] || null,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    }));

    const buffer = PNG.sync.write(png);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to render marker' });
  }
}
