// Controlled fetch diagnostic. No location or request data is returned/logged.
const loadedRoutes=new Set();
async function measuredRoute(route,load,req,res) {
  const started=performance.now(),firstLoad=!loadedRoutes.has(route);
  loadedRoutes.add(route);
  let importMs,failed=false;
  try {
    const handler=await load();
    importMs=Math.round((performance.now()-started)*10)/10;
    return await handler(req,res);
  } catch(error) {failed=true;throw error;}
  finally {
    // Includes dynamic import time omitted by the inner handlers. It does not
    // include platform boot, network transit, or native widget drawing.
    try {console.info(JSON.stringify({event:'widget_route_v1',route,firstLoad,
      importMs,elapsedMs:Math.round((performance.now()-started)*10)/10,
      failed}));} catch {}
  }
}
export default async function handler(req, res) {
  // A narrow deployment rewrite shares this function's slot with Weather.
  // Existing diagnostic requests retain their original response and headers.
  const url = new URL(req.url || '/api/fetch-probe', 'https://probe.invalid');
  if (url.pathname === '/api/map-stability' || url.searchParams.get('map_stability') === '1' || req.query?.map_stability === '1') {
    const {default: stability} = await import('../lib/map-stability.js');
    return stability(req,res);
  }
  if (url.searchParams.get('location_admin') === '1') {
    const {default: admin} = await import('../lib/location/admin.js');
    return admin(req,res);
  }
  if (url.searchParams.get('location_shared') === '1') {
    if(url.searchParams.get('view')==='label-v1') {
      return measuredRoute('city-native',async ()=>(await import('../lib/location/native-label.js')).default,req,res);
    }
    return measuredRoute('city',async ()=>(await import('../lib/location/shared.js')).locationHandler,req,res);
  }
  if (url.pathname === '/api/weather-panel' || url.searchParams.get('weather_panel') === '1' || req.query?.weather_panel === '1') {
    return measuredRoute('weather',async ()=>(await import('../lib/weather/handler.js')).default,req,res);
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
