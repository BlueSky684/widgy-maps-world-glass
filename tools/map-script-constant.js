import {withMapURLVariable} from './map-url-variable.js?v=map-url-variable-1';

// Isolate synchronous JS source evaluation while keeping the same constant URL.
export function withMapScriptConstant(original,origin){
  const widget=withMapURLVariable(original,origin);
  const variable=widget['36'][0],source=variable?.['3']?.['66']?.[0];
  if(widget['36'].length!==1 || variable['1']!=='map_request' ||
      variable['3']['66'].length!==1 || source['5']!=='Custom Text' ||
      source['6']!=='Text' || typeof source['25']!=='string')throw Error('unexpected_template');
  variable['3']['66']=[{'5':'Javascript','6':'Script',
    '10':'function main() {\n  return '+JSON.stringify(source['25'])+';\n}'}];
  widget['3']='Widgy Map Script Constant 1';
  widget['4']='Temporary matched follow-up after Map URL Variable 1 was reported normal with no delays. Replace only its one Custom Text source with synchronous Javascript/Script main() returning the exact same constant URL. Keep the same variable identity, image binding, all 21 layers, navigation, image frame/provider/cache flag/parent/order and every other field except trial name/description. One variable; no GPS, city lookup, fetch, async completion, date/time, timestamp or changing URL. Same current-time server endpoint, full lossless 3306x1558 PNG, existing cache behavior and explicit empty lat/lon. Local tests execute the actual generated script and compare its return value, but do not measure or emulate Widgy scheduling, invocation count, refresh or timing. A fast result does not establish the cost of dynamic GPS-dependent scripts; a slow result does not prove all JavaScript is slow. No Home content or final location/city is restored yet.';
  return widget;
}
