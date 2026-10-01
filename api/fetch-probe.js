// Controlled fetch diagnostic. No location or request data is returned/logged.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return res.status(405).end();
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({probe:'WIDGY_FETCH_OK'});
}
