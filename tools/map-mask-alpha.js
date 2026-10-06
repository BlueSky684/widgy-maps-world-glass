// A separate candidate based on the owner's fast Appeared Off1 copy.
// Preserve all transition fields; change just the two mask representations.
export function withMapMaskAlpha(appeared){
  if(appeared?.['3']!=='Widgy Map Mask Appeared Off 1')throw Error('unexpected_baseline');
  const widget=structuredClone(appeared);
  const flat=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]);
  const nodes=flat(widget['1']);
  const multiply={a:[{a:1,b:547,c:0,d:547}],b:0};
  for(const [id,part] of [[84011,'day'],[84021,'night']]){
    const matches=nodes.filter(n=>n.d0===id),mask=matches[0];
    if(matches.length!==1||mask.z!=='5'||mask['1']!=='Web URL'||
        mask['2']!=='${widgy.mask_'+part+'_request}'||JSON.stringify(mask.t)!==JSON.stringify(multiply))
      throw Error('unexpected_mask_'+part);
    // Omitted t is the native default Normal, as in the unchanged static images
    // and original full-map template. Do not invent a new blend enum object.
    delete mask.t;
    const vars=widget['36'].filter(v=>v['1']==='mask_'+part+'_request');
    if(vars.length!==1)throw Error('unexpected_variable_'+part);
    const source=vars[0]['3']['66'][0],old='/api/solar-mask?rev=live-1&part='+part+'&t=';
    if(source['10'].split(old).length!==2)throw Error('unexpected_mask_url_'+part);
    source['10']=source['10'].replace(old,'/api/solar-mask?rev=alpha-1&part='+part+'&t=');
  }
  const title=nodes.find(n=>n.d0===84050);
  if(title?.['66']?.[0]?.['25']!=='APPEARED OFF')throw Error('unexpected_title');
  title['66'][0]['25']='ALPHA MASK';
  widget['3']='Widgy Map Mask Alpha 1';
  widget['4']='Separate alpha-mask display trial derived from the owner-reported fast Appeared Off1. Retain all eight appeared-Off fields, group hierarchy, Plus Lighter night group, static3306x1558 assets, frames, four cached images, three synchronous scripts, five-minute epoch and native navigation. Only two mask revisions become alpha-1 and their image Multiply field is removed for native default Normal. The522x246 PNGs contain black RGB and inverse solar/stamp weight in alpha; D/N glyphs and time are encoded in mask alpha over the existing fixed white diagnostic plates. No new timer, geocoder, coordinate, weather, health or calendar account source. Native transparency, colour handling, complete composition, paired refresh and retained speed require phone verification. Replacing white exposure with a black or incomplete map is failure. Keep fast Appeared Off1 and Five Minute1 controls. No claim of exact approved-renderer parity or automatic five-minute background refresh.';
  return widget;
}
