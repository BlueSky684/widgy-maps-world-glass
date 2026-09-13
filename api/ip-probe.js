import { PNG } from 'pngjs';

export default async function handler(req, res) {
  try {
    const lat = req.headers['x-vercel-ip-latitude'] || null;
    const lon = req.headers['x-vercel-ip-longitude'] || null;
    const city = req.headers['x-vercel-ip-city'] || null;
    const country = req.headers['x-vercel-ip-country'] || null;
    const region = req.headers['x-vercel-ip-country-region'] || null;

    console.log('WIDGY_IP_GEO', JSON.stringify({
      lat, lon, city, country, region,
      ua: req.headers['user-agent'] || null
    }));

    const png = new PNG({ width: 1, height: 1, colorType: 6 });
    png.data.fill(0);
    const buffer = PNG.sync.write(png);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('WIDGY_IP_GEO_ERROR', err?.message || err);
    res.status(500).json({ error: err?.message || 'probe failed' });
  }
}
