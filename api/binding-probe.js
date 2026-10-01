import sharp from 'sharp';

// Small, isolated image-loader control. Only synthetic labels are used by the
// diagnostic widget; its native location values remain in local text layers.
const images = new Map();
async function tile(ok) {
  if (!images.has(ok)) images.set(ok, sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="128"><rect width="320" height="128" rx="16" fill="${ok ? '#c5ff0a' : '#ffbc55'}"/><path d="${ok ? 'M119 65l27 27 56-58' : 'M134 38l52 52m0-52l-52 52'}" fill="none" stroke="#091116" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  )).png().toBuffer());
  return images.get(ok);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const url = new URL(req.url, 'https://probe.invalid');
  const label = url.searchParams.get('label');
  const ok = label === 'SyntheticTest';
  const name = /^[A-F]$/.test(url.searchParams.get('case') || '') ? url.searchParams.get('case') : 'unknown';
  try {
    const png = await tile(ok);
    console.info('widgy-binding-probe', {case: name, labelMatches: ok});
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Binding-Result', ok ? 'resolved' : 'unresolved');
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(png);
  } catch {
    console.error('widgy-binding-probe', {case: name, error: 'render-failed'});
    return res.status(500).json({error: 'Probe rendering unavailable'});
  }
}
