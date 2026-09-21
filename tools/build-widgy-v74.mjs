import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

// Widgy scales a 1600-square layout to the supplied 1134 x 1182 widget.
// Rotation applies in display space. Do not independently snap each cap to
// pixels: that changes cap size, stroke direction, and tangency at the join.
const displayAspect = 1134 / 1182;
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const write = (name, text) => writeFileSync(new URL(name, import.meta.url), text);
const hash = text => createHash('sha256').update(text).digest('hex');
function stable(x) {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
  return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}';
}
const copy = read('widgy-v73-copy.html');
const source = read('widgy-v73.html');
const packed = [...copy.match(/const packed=\[([\s\S]*?)\]\.join\(''\);/)[1].matchAll(/'([A-Za-z0-9+/=]+)'/g)].map(m => m[1]).join('');
const raw = gunzipSync(Buffer.from(packed, 'base64')).toString('utf8');
if (hash(raw) !== source.match(/baseHash='([^']+)'/)[1]) throw Error('Unexpected v73 source');
const data = JSON.parse(raw);
const layers = data['1'][0]['1'];
const patch = JSON.parse(source.match(/const patch=(.*);/)[1]);
for (const layer of layers) {
  const frame = patch[layer.d0];
  if (frame) ['b','c','d','e'].forEach((k, i) => layer[k].a[0].a = frame[i]);
}
data['4'] = source.match(/const description='(.*)';/)[1];
if (hash(stable(data)) !== source.match(/finalHash='([^']+)'/)[1]) throw Error('Unexpected v73 result');
const before = structuredClone(data);
const byId = new Map(layers.map(layer => [layer.d0, layer]));
const bodyIds = [77102,77105,77108,77202,77205,77208,77211];
const value = (layer, key) => layer[key].a[0].a;
const frames = [];
for (const id of bodyIds) {
  const body = byId.get(id);
  if (body.z !== '2' || body.q !== 30) throw Error('Unexpected rain body');
  const [x,y,w,h] = ['b','c','d','e'].map(k => value(body,k));
  const radians = body.q * Math.PI / 180;
  // Equal physical diameters, centred on the two ends of the rotated body.
  const capHeight = w * displayAspect;
  const dx = h * Math.sin(radians) / (2 * displayAspect);
  const dy = h * Math.cos(radians) / 2;
  for (const [capId, sign] of [[id-2,1],[id-1,-1]]) {
    const cap = byId.get(capId);
    if (cap.z !== '4' || cap['3'] !== 'circle.fill' || cap.f !== body.g) throw Error('Unexpected cap');
    const frame = [x + sign*dx, y + h/2 - sign*dy - capHeight/2, w, capHeight];
    ['b','c','d','e'].forEach((k,i) => cap[k].a[0].a = frame[i]);
    frames.push({id:capId, frame});
  }
}
data['3'] = 'Native Weather Icons Master Board v74 - Smooth Uniform Rain Caps';
data['4'] = 'Based on v73. All fourteen native circle.fill rain caps use the same physical diameter as their unchanged body width. Cap centres are calculated from the rotated body endpoints with the 1134:1182 display aspect, without per-stroke pixel snapping. This removes geometric width and alignment differences at the joins. Body frames, rotation 30, colours, spacing and all other layers are unchanged. Native Widgy rendering must be checked on-device; different display aspect ratios require recalibration.';
const changed = layers.filter((l,i) => stable(l) !== stable(before['1'][0]['1'][i]));
if (changed.length !== 14 || changed.some(l => !frames.some(f => f.id === l.d0))) throw Error('Unexpected layer diff');
for (const id of bodyIds) {
  const body = byId.get(id), a = byId.get(id-2), b = byId.get(id-1);
  const center = (l,k,size) => value(l,k)+value(l,size)/2;
  if (Math.abs((center(a,'b','d')+center(b,'b','d'))/2-center(body,'b','d'))>1e-9) throw Error('X symmetry');
  if (Math.abs((center(a,'c','e')+center(b,'c','e'))/2-center(body,'c','e'))>1e-9) throw Error('Y symmetry');
  if (value(a,'d') !== value(body,'d') || Math.abs(value(a,'e')/displayAspect-value(body,'d'))>1e-9) throw Error('Diameter mismatch');
}
const payload = stable(data);
write('widgy-v74.json', payload);
const encoded = gzipSync(Buffer.from(payload), {mtime:0}).toString('base64');
let html = copy.replaceAll('v73','v74')
  .replace('תיקון קצות קווי הגשם','קצוות מעוגלים וחיבור חלק ואחיד')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/, `const packed=['${encoded}'].join('');`)
  .replace(/const expectedHash='[^']+';/, `const expectedHash='${hash(payload)}';`)
  .replace(/packed.length!==\d+/, `packed.length!==${encoded.length}`)
  .replace(/text.length!==\d+/, `text.length!==${payload.length}`)
  .replace(/<div id="manual" hidden>[\s\S]*?<\/div>/, '')
  .replace(",field=document.getElementById('field')", '')
  .replace(/function selectText\(\)\{[^\n]*\}\n/, '')
  .replace(/function legacyCopy\(\)\{[^\n]*\}\n/, `function legacyCopy(){
 const field=document.createElement('textarea');field.value=payload;field.readOnly=true;
 field.setAttribute('aria-label','העתקת JSON');
 field.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;font-size:16px';
 document.body.appendChild(field);let ok=false;
 try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,field.value.length);ok=document.execCommand('copy');}catch(e){}
 finally{field.remove();button.focus({preventScroll:true});}
 if(ok){success();return;}
 button.textContent='נסה להעתיק שוב';status.textContent='הדפדפן חסם את ההעתקה. פתח את הקישור ב־Safari ולחץ שוב.';
}
`)
  .replace("document.getElementById('select').addEventListener('click',selectText);", '');
write('widgy-v74.html', html);
console.log(JSON.stringify({changedLayers:changed.length, bodyLayersUnchanged:bodyIds.length, payloadLength:payload.length, sha256:hash(payload), capWidth:frames[0].frame[2], capHeight:frames[0].frame[3]},null,2));
