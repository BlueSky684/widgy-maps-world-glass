// AirNow/EPA US AQI bands. Hues retained; lightness adjusted for dark glass.
// https://www.airnow.gov/aqi/aqi-basics/
export function aqiColor(value){
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)return '#aeb7c6';
  const n=Math.round(value);
  return n<=50?'#62d28a':n<=100?'#f1d45c':n<=150?'#f4a15b':n<=200?'#f17777':n<=300?'#c694df':'#dd7794';
}
