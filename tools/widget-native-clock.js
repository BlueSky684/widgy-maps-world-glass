// Separate full-widget candidate. No diagnostic removals or sample values.
export function withNativeClock(original){
  if(original['3']!=='Widgy Calendar Unified')throw Error('unexpected_template');
  const widget=structuredClone(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  const clocks=home?.['1'].filter(n=>n.s==='Hero Time');
  const source=clocks?.[0]?.['66'];
  if(clocks?.length!==1 || source?.length!==1 || source[0]['5']!=='Date And Time' ||
      source[0]['6']!=='Live Timer (24 hours, No Seconds)')throw Error('unexpected_template');
  clocks[0]['66']=[{'5':'Date And Time','6':'HH:mm'}];
  widget['3']='Widgy Calendar Native Clock Trial';
  widget['4']='Full private widget based on the normal perf-5 export with the restored cumulative steps ring. Only Hero Time changes from Live Timer (24 hours, No Seconds) to the native Date And Time HH:mm source. Its approved HomeGlassTime-Light font, frame and color are retained, as are the full map, actual Calendar/weather/fitness data, every other layer, variable and tap action. This is a candidate pending iPhone verification of transition speed, clock appearance and automatic minute changes without tapping. No fixed clock text or synthetic data. Keep this private calendar export private.';
  return widget;
}
