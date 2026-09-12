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

  png.data[idx] = Math.round(
    (r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA
  );
  png.data[idx + 1] = Math.round(
    (g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA
  );
  png.data[idx + 2] = Math.round(
    (b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA
  );
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
      if (dx * dx + dy * dy <= r2) {
        blendPixel(
          png, x, y,
          color[0], color[1], color[2],
          alpha
        );
      }
    }
  }
}

function mercatorY(lat) {
  const safeLat = clamp(lat, -85, 85);
  const rad = safeLat * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    // Match the actual approved world_map.png aspect ratio.
    const width = clamp(Number(req.query.w) || 1584, 64, 2048);
    const height = clamp(Number(req.query.h) || 993, 32, 2048);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 || lat > 90 ||
      lon < -180 || lon > 180
    ) {
      res.status(400).json({
        error: 'Use lat=-90..90 and lon=-180..180'
      });
      return;
    }

    // X remains longitude-linear.
    const x = ((lon + 180) / 360) * width;

    // The approved map visually matches a cropped Mercator world view
    // much better than an equirectangular latitude scale.
    const LAT_MAX = 82;
    const LAT_MIN = -58;

    const top = mercatorY(LAT_MAX);
    const bottom = mercatorY(LAT_MIN);
    const current = mercatorY(lat);

    const y = ((top - current) / (top - bottom)) * height;

    const png = new PNG({
      width,
      height,
      colorType: 6
    });
    png.data.fill(0);

    // Approved marker: clearly visible, but not neon-heavy.
    const blue = [10, 132, 255];

    const outer = Math.max(18, width * 0.030);
    const middle = Math.max(12, width * 0.020);
    const blueCore = Math.max(7, width * 0.0115);
    const whiteCore = Math.max(3.5, width * 0.0052);

    drawCircle(png, x, y, outer, blue, 32);
    drawCircle(png, x, y, middle, blue, 82);
    drawCircle(png, x, y, blueCore, blue, 255);
    drawCircle(png, x, y, whiteCore, [255, 255, 255], 255);

    const buffer = PNG.sync.write(png);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(buffer);

  } catch (err) {
    res.status(500).json({
      error: err?.message || 'Failed to render marker'
    });
  }
}
