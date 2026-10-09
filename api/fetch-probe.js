// Controlled fetch diagnostic. No location or request data is returned/logged.
export default async function handler(req, res) {
  // A narrow deployment rewrite shares this function's slot with Weather.
  // Existing diagnostic requests retain their original response and headers.
  const url = new URL(req.url || '/api/fetch-probe', 'https://probe.invalid');
  if (url.pathname === '/api/weather-panel' || url.searchParams.get('weather_panel') === '1' || req.query?.weather_panel === '1') {
    const {default: weather} = await import('../lib/weather/handler.js');
    return weather(req, res);
  }
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return res.status(405).end();
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({probe:'WIDGY_FETCH_OK'});
}
