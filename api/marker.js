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
  const minX = Math.floor(cx - radius - 1);
  const maxX = Math.ceil(cx + radius + 1);
  const minY = Math.floor(cy - radius - 1);
  const maxY = Math.ceil(cy + radius + 1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) {
        blendPixel(png, x, y, color[0], color[1], color[2], alpha);
      }
    }
  }
}

export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const width = clamp(Number(req.query.w) || 1000, 64, 2048);
    const height = clamp(Number(req.query.h) || 500, 32, 2048);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Use lat=-90..90 and lon=-180..180' });
      return;
    }

    // Equirectangular world-map projection.
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;

    const png = new PNG({ width, height, colorType: 6 });
    png.data.fill(0);

    // Apple-like blue locator marker with subtle halo.
    const blue = [10, 132, 255];
    drawCircle(png, x, y, Math.max(7, width * 0.028), blue, 46);
    drawCircle(png, x, y, Math.max(5, width * 0.017), blue, 96);
    drawCircle(png, x, y, Math.max(3, width * 0.010), blue, 255);
    drawCircle(png, x, y, Math.max(1.5, width * 0.004), [255, 255, 255], 255);

    const buffer = PNG.sync.write(png);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to render marker' });
  }
}
