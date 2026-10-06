// Freeze the observed Alpha1 epoch to isolate native variable/URL evaluation.
// Sources remain cached Web URLs: this is not an offline or live-refresh trial.
export const ALPHA_FIXED_EPOCH = Date.parse('2026-10-06T10:05:00Z');

export function withMapMaskAlphaFixed(alpha,origin){
  if(alpha?.['3']!=='Widgy Map Mask Alpha 1')throw Error('unexpected_baseline');
  const base=new URL(origin);
  if(!['https:','http:'].includes(base.protocol)||base.origin!==origin)throw Error('unexpected_origin');
  const widget=structuredClone(alpha);
  if(JSON.stringify(widget['36']?.map(v=>v['1']))!==JSON.stringify(['mask_epoch','mask_day_request','mask_night_request']))
    throw Error('unexpected_variables');
  const flat=nodes=>nodes.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]);
  const nodes=flat(widget['1']);
  for(const [id,part]of [[84011,'day'],[84021,'night']]){
    const matches=nodes.filter(n=>n.d0===id),mask=matches[0];
    if(matches.length!==1||mask.z!=='5'||mask['1']!=='Web URL'||mask['3']!==true||
       mask['2']!=='${widgy.mask_'+part+'_request}'||Object.hasOwn(mask,'t'))throw Error('unexpected_mask_'+part);
    mask['2']=origin+'/api/solar-mask?rev=alpha-1&part='+part+'&t='+ALPHA_FIXED_EPOCH;
  }
  const title=nodes.find(n=>n.d0===84050);
  if(title?.['66']?.[0]?.['25']!=='ALPHA MASK')throw Error('unexpected_title');
  title['66'][0]['25']='FIXED ALPHA';
  widget['36']=[];
  widget['3']='Widgy Map Mask Alpha Fixed 1';
  widget['4']='Diagnostic control, not a live-refresh fix. Same Alpha1 map composition, static assets, masks, four cached Web URL providers, native blends, hierarchy, eight appeared-Off fields and Home/Calendar actions. Replace only two variable image-source bindings with literal alpha-1 URLs at2026-10-06T10:05Z (13:05 Israel), the epoch visible in the owner recording, and remove all three synchronous variables. D/N bitmap stamps intentionally stay13:05. No API/asset/transition changes. If the black-day/N-before-D defect remains, native script evaluation and changing epoch are not necessary to reproduce it. If absent, investigate the variable resolution path; this does not prove a root cause, no-network operation, memory residency, or live freshness. Keep Alpha1, fast Appeared Off1 and Five Minute1 controls. No location, health, weather or account sources.';
  if(/\$\{widgy\.|"Javascript"/.test(JSON.stringify(widget)))throw Error('remaining_dynamic_source');
  return widget;
}
