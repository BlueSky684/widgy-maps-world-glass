import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const WIDTH = 1536;
const HEIGHT = 963;

const PAD_X = 113;
const PAD_TOP = 25;
const INNER_W = 1310;
const INNER_H = 913;

const LON_MIN = -180.0;
const LON_MAX = 180.0;
const LAT_MIN = -58.0;
const LAT_MAX = 85.0;

const MAP_PATH = path.join(process.cwd(), 'public', 'world_map_georef_mercator_fullnorth.png');
let cachedBase = null;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mercatorY(lat) {
  const safe = clamp(lat, -85, 85) * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + safe / 2));
}

const MERC_TOP = mercatorY(LAT_MAX);
const MERC_BOTTOM = mercatorY(LAT_MIN);

function loadBaseMap() {
  if (!cachedBase) {
    cachedBase = PNG.sync.read(fs.readFileSync(MAP_PATH));
    if (cachedBase.width !== WIDTH || cachedBase.height !== HEIGHT) {
      throw new Error(`world map must be ${WIDTH}x${HEIGHT}`);
    }
  }
  return cachedBase;
}

function blendPixel(png, x, y, r, g, b, alpha) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || alpha <= 0) return;
  const i = (png.width * y + x) << 2;
  const sa = clamp(alpha, 0, 255) / 255;
  const da = png.data[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  png.data[i] = Math.round((r * sa + png.data[i] * da * (1 - sa)) / oa);
  png.data[i + 1] = Math.round((g * sa + png.data[i + 1] * da * (1 - sa)) / oa);
  png.data[i + 2] = Math.round((b * sa + png.data[i + 2] * da * (1 - sa)) / oa);
  png.data[i + 3] = Math.round(oa * 255);
}

function drawCircle(png, cx, cy, radius, color, alpha) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy-radius-1); y <= Math.ceil(cy+radius+1); y++) {
    for (let x = Math.floor(cx-radius-1); x <= Math.ceil(cx+radius+1); x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx*dx + dy*dy <= r2) {
        blendPixel(png, x, y, color[0], color[1], color[2], alpha);
      }
    }
  }
}

function project(lat, lon) {
  const x = PAD_X + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * INNER_W;
  const current = mercatorY(lat);
  const y = PAD_TOP + ((MERC_TOP - current) / (MERC_TOP - MERC_BOTTOM)) * INNER_H;
  return { x, y };
}

export default async function handler(req, res) {
  try {
    const headerLat = Number(req.headers['x-vercel-ip-latitude']);
    const headerLon = Number(req.headers['x-vercel-ip-longitude']);
    const queryLat = req.query.lat !== undefined ? Number(req.query.lat) : NaN;
    const queryLon = req.query.lon !== undefined ? Number(req.query.lon) : NaN;

    const lat = Number.isFinite(queryLat) ? queryLat : headerLat;
    const lon = Number.isFinite(queryLon) ? queryLon : headerLon;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(400).json({ error: 'No usable coordinates' });
      return;
    }

    if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) {
      res.status(400).json({
        error: `Coordinates outside visible map bounds: lat ${LAT_MIN}..${LAT_MAX}, lon ${LON_MIN}..${LON_MAX}`
      });
      return;
    }

    const base = loadBaseMap();
    const png = new PNG({ width: WIDTH, height: HEIGHT, colorType: 6 });
    base.data.copy(png.data);

    const { x, y } = project(lat, lon);
    const blue = [10, 132, 255];
    drawCircle(png, x, y, 34, blue, 30);
    drawCircle(png, x, y, 23, blue, 78);
    drawCircle(png, x, y, 13, blue, 255);
    drawCircle(png, x, y, 6, [255,255,255], 255);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(PNG.sync.write(png));
  } catch (err) {
    res.status(500).json({ error: err?.message || 'world-map renderer v3 failed' });
  }
}
