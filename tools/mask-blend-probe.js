import {withMapFiveMinuteURL} from './map-five-minute-url.js?v=map-five-minute-url-1';

// Harmless native schema capture, not a solar-mask implementation or speed test.
// The user selects actual named blend modes in Widgy; no effect enums are guessed.
export function withMaskBlendProbe(original,origin){
  const widget=withMapFiveMinuteURL(original,origin);
  const home=widget['1'].find(n=>n.s==='HOME');
  const picture=home?.['1'].find(n=>n.d0===6170);
  if(!picture || picture.z!=='5' || picture['1']!=='Web URL')throw Error('unexpected_template');
  picture.s='Probe Image';
  picture['2']=origin+'/assets/calendar-glass/today-c13/1.png';
  // Retain the native image source/frame schema; no mask/blend fields inserted.
  home.s='Probe Group';home['1']=[picture];home.a=true;
  widget['1']=[home];widget['36']=[];
  widget['3']='Widgy Mask Blend Probe 1';
  widget['4']='Native blend schema capture only. One group and one static generic date image from a public asset. No location, variables, map, calendar account, health/weather data, navigation or dynamic source. In Widgy choose Multiply on Probe Image if available and Plus Lighter on Probe Group if available, then share this diagnostic file only. The saved native fields will establish serialization; they do not prove arbitrary image masking, group isolation, matching map appearance or speed. Leave the working Map Five Minute1 copy and Home Screen assignment unchanged.';
  if(/\$\{widgy\.|token=|\/api\//.test(JSON.stringify(widget)))throw Error('unexpected_template');
  return widget;
}
