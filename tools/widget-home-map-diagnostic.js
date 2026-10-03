// Transform only a private in-browser export; never publish user calendar data.
export function withoutHomeMap(original){
  if(original['3']!=='Widgy Calendar Unified')throw Error('unexpected_template');
  const widget=structuredClone(original);
  const home=widget['1'].find(n=>n.s==='HOME');
  const maps=home?.['1'].filter(n=>n.s==='Home Hero World Map');
  if(maps?.length!==1||maps[0].z!=='5'||maps[0]['2']!=='${widgy.map_request}')throw Error('unexpected_template');
  home['1']=home['1'].filter(n=>n!==maps[0]);
  const removed=new Set(['map_request']);
  if(widget['36'].filter(v=>removed.has(v['1'])).length!==1)throw Error('unexpected_template');
  widget['36']=widget['36'].filter(v=>!removed.has(v['1']));
  const rest=JSON.stringify(widget);
  for(const name of removed)if(rest.includes('${widgy.'+name+'}'))throw Error('unexpected_template');
  widget['3']='Widgy Home Map-Off Diagnostic';
  widget['4']='Separate perf-5 diagnostic copy. Only the Home map image and its map_request variable are removed. The map area is intentionally empty. The independent Calendar city lookup and its shared GPS inputs are retained. All other visual layers, buttons, Calendar sources and conditions are identical to the normal personalized export. Import separately and compare Home transitions in the same slot and network. Restore the normal widget after testing. Keep this private calendar export private.';
  return widget;
}
