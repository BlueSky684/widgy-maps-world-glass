// Lay out both Home weather groups and the divider with equal optical margins.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {widgetLayers} from './weather15-location-split.js';
import sharp from 'sharp';
import {formatJSONLines} from './json-copy-lines.js';

const [input,output]=process.argv.slice(2);
assert(input&&output,'Supply Google Soft Glow 4 and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)),privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'69adbe626fd025c36733b32153eb2f9e216f65825a13a271f190632d914eedb6');
const before=JSON.parse(beforeBytes),widget=structuredClone(before),layers=[...widgetLayers(widget)];
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
mkdirSync(privateDir,{recursive:true,mode:0o700});
const changes=[];
const offsets={weather:6,highLow:13,divider:10};
const home=layers.find(n=>n.d0===245);
// Widgy stores child frames in absolute widget coordinates. Translate every
// frame in each native weather subtree by the same amount, including groups,
// masks and alternate conditions, preserving their relative geometry.
const targets=[];
for(const id of [80029,80028,80049]){
  const root=home['1'].find(n=>n.d0===id);
  assert.equal(root?.z,'13');
  targets.push(...widgetLayers(root));
}
for(const id of [6131,6132])targets.push(home['1'].find(n=>n.d0===id));
assert.equal(new Set(targets.map(n=>n.d0)).size,targets.length);
for(const id of [6133,6134])targets.push(home['1'].find(n=>n.d0===id));
for(const n of targets){
  const dx=([6133,6134].includes(n.d0)?offsets.highLow:offsets.weather)*1600/1135;
  assert.equal(n.b.a.length,1);
  assert.equal(typeof n.b.a[0].a,'number');
  const old=structuredClone(n.b);
  n.b.a[0].a=Math.round((n.b.a[0].a+dx)*1e6)/1e6;
  changes.push({id:n.d0,name:n.s,before:old,after:structuredClone(n.b)});
}
// The divider and high/low arrows belong to the code-generated chrome.
// Re-render the original vector primitives at the existing PNG dimensions,
// verify the source matches this exact region, and patch only this region.
const chrome=layers.find(n=>n.d0===80309);
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const chromeBefore=chrome['2'];
assert.equal(chromeBefore,origin+'/assets/navigation-soft-glow/home.png');
const source=readFileSync(resolve(root,'assets/home-glass/Home_Glass_Chrome_R4.svg'),'utf8');
let next=source;
for(const [a,b] of [['M358 855V989','M368 855V989'],['translate(410 889)','translate(423 889)'],['translate(410 954)','translate(423 954)']]){
  assert.equal(next.split(a).length,2);next=next.replace(a,b);
}
const original=await sharp(resolve(root,'assets/navigation-soft-glow/home.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height}=original.info,sx=width/1135,sy=height/1184;
const render=svg=>sharp(Buffer.from(svg)).resize(width,height).ensureAlpha().raw().toBuffer();
const sourcePixels=await render(source),newPixels=await render(next),pixels=Buffer.from(original.data);
const area={left:Math.floor(340*sx),right:Math.ceil(456*sx),top:Math.floor(848*sy),bottom:Math.ceil(996*sy)};
let changed=0,minX=width,minY=height,maxX=-1,maxY=-1;
for(let y=area.top;y<area.bottom;y++)for(let x=area.left;x<area.right;x++){
  const p=(y*width+x)*4;
  assert(original.data.subarray(p,p+4).equals(sourcePixels.subarray(p,p+4)),'Original vector region must match current artwork');
  assert.equal(newPixels[p+3],original.data[p+3]);
  if(newPixels.subarray(p,p+4).equals(original.data.subarray(p,p+4)))continue;
  newPixels.copy(pixels,p,p,p+4);changed++;
  minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
}
assert(changed>0);
for(let p=0;p<pixels.length;p+=4){
  assert.equal(pixels[p+3],original.data[p+3]);
  if(pixels.subarray(p,p+4).equals(original.data.subarray(p,p+4)))continue;
  const x=p/4%width,y=Math.floor(p/4/width);
  assert(x>=area.left&&x<area.right&&y>=area.top&&y<area.bottom);
}
const pngPath='assets/navigation-soft-glow/home-balanced.png';
const png=await sharp(pixels,{raw:original.info}).png({compressionLevel:9}).toBuffer();
assert((await sharp(png).ensureAlpha().raw().toBuffer()).equals(pixels));
writeFileSync(resolve(root,pngPath),png);
chrome['2']=origin+'/'+pngPath;
const artwork={path:pngPath,width,height,bytes:png.length,sha256:sha(png),changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],otherPixelsIdentical:true,alphaIdentical:true};
// Half-open visible-ink bounds measured from IMG_0018.png. Widths are kept;
// solve one common margin for the four spaces surrounding the two groups.
const measured={card:[23,558],weather:[50,329],highLow:[388,512],divider:358};
const margin=((measured.card[1]-measured.card[0])-(measured.weather[1]-measured.weather[0])-(measured.highLow[1]-measured.highLow[0]))/4;
const expected={weather:measured.weather.map(x=>x+offsets.weather),highLow:measured.highLow.map(x=>x+offsets.highLow),divider:measured.divider+offsets.divider};
const gaps=[expected.weather[0]-measured.card[0],expected.divider-expected.weather[1],expected.highLow[0]-expected.divider,measured.card[1]-expected.highLow[1]];
for(const gap of gaps)assert.equal(gap,margin);
widget['3']='Widgy Weather 15 - Google Soft Glow 5';
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
for(const c of changes)reversedLayers.find(n=>n.d0===c.id).b=c.before;
reversedLayers.find(n=>n.d0===80309)['2']=chromeBefore;
assert.deepEqual(reversed,before,'Only the display name, Home weather/high-low X positions and chrome URL may change');
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-soft-glow5:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));

writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Soft_Glow_5.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-soft-glow5-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-soft-glow5.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),offsetsDesignPixels:offsets,divider:{before:358,after:368},changedLayerIDs:changes.map(c=>c.id),layout:{source:'IMG_0018.png, visible-ink half-open bounds',measured,expected,equalMargins:margin,gaps,note:'The screenshot measurement is the optical reference. Native rasterization and changing text still require phone review.'},artwork,iconToTextSpacingPreserved:true,highLowIconToTextSpacingPreserved:true,allIconVariantsTranslatedEqually:true,iconSizesTextFramesAndVerticalPositionsIdentical:true,googleMapAndAllVariablesIdentical:true,allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,bytes:raw.length,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-soft-glow5-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
