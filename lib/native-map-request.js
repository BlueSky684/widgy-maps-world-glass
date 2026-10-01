// Widgy composes this URL from native text data, without substituting values
// inside JavaScript. city_text is deliberately LAST: its complete tail is a
// single value, so an ampersand or plus in a city name cannot become a parameter.
export function parseMapRequest(rawUrl) {
  const marker = '&city_text=';
  const index = rawUrl.indexOf(marker);
  const url = new URL(index < 0 ? rawUrl : rawUrl.slice(0,index), 'https://widgy-maps-world-glass.vercel.app');
  if (index < 0) return url; // Existing requests preserve their original behavior.
  let city = rawUrl.slice(index + marker.length);
  try { city = decodeURIComponent(city); } catch {} // Tolerate literal percent signs.
  city = city.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,80);
  if (city.includes('${') || /^(?:undefined|null)$/i.test(city)) city = '';
  url.searchParams.set('city',city);
  return url;
}
