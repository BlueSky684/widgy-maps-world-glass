import {withMaskBlendProbe} from './mask-blend-probe.js?v=mask-blend-probe-1';

// Native serialization captured from the owner's harmless Mask Blend Probe1:
// image Multiply=1, group Plus Lighter=17. The adjacent numeric properties are
// preserved exactly from that native export; no other effect field is inferred.
const multiply={a:[{a:1,b:547,c:0,d:547}],b:0};
const plusLighter={a:[{a:17,b:548,c:0,d:548}],b:0};

export function withMaskCompositionProbe(original,origin){
  const widget=withMaskBlendProbe(original,origin);
  const outer=widget['1'][0],sample=outer?.['1']?.[0];
  if(outer?.s!=='Probe Group' || sample?.s!=='Probe Image' || sample.z!=='5' ||
      widget['36'].length!==0 || outer.t || sample.t)throw Error('unexpected_template');
  const image=(id,name,file)=>{
    const out=structuredClone(sample);
    out.d0=id;out.s=name;out['2']=origin+'/assets/diagnostics/mask-composition-probe/'+file;
    return out;
  };
  const base=image(80309,'Static Navy Base','base-navy.png');
  const light=image(80408,'Static Gold Light','light-gold.png');
  const mask=image(6170,'Network Mask · Multiply','mask-white-to-black.png');
  mask.t=structuredClone(multiply);
  const lighting=structuredClone(outer);
  lighting.d0=247;lighting.s='Masked Light Group · Plus Lighter';
  lighting.t=structuredClone(plusLighter);
  // Widgy layer arrays are front-to-back. Multiply mask is above the gold
  // sample inside the isolated Plus Lighter group; the group is above base.
  lighting['1']=[mask,light];
  outer.s='Mask Composition Probe';outer['1']=[lighting,base];
  widget['3']='Widgy Mask Composition Probe 1';
  widget['4']='Controlled native composition after the owner exported Mask Blend Probe1 with Image Multiply=1 and Group Plus Lighter=17. One static navy base, one static opaque gold layer and one opaque white-to-black gradient mask. The mask alone uses Multiply inside an isolated Plus Lighter group above the base. Zero variables, location, accounts, API calls, weather/health sources, navigation or dynamic data. Expected capability signal: gold at the white side, navy at the black side, smooth transition. Other results mean this blend construction is not a usable alpha-mask equivalent. This is not the approved map, a speed/freshness result or proof of final pixel parity.';
  if(widget['1'].length!==1 || outer['1'].length!==2 || lighting['1'].length!==2 ||
      JSON.stringify(mask.t)!==JSON.stringify(multiply) || JSON.stringify(lighting.t)!==JSON.stringify(plusLighter) ||
      /\$\{widgy\.|token=|\/api\//.test(JSON.stringify(widget)))throw Error('unexpected_template');
  return widget;
}
