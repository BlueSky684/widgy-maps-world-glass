// Apply the approved equal-margin layout principle to the Home activity card.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';

const [input,output]=process.argv.slice(2);
assert(input&&output,'Supply Google Soft Glow 5 and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)),privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'8bb221a04d52f8fec91e0a88b1829d0cdec1f0f638692f3a0c5fc51396051baf');
const before=JSON.parse(beforeBytes),widget=structuredClone(before),layers=[...widgetLayers(widget)];
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
mkdirSync(privateDir,{recursive:true,mode:0o700});
// Half-open visible bounds from IMG_0019.png, using the same design reference
// convention as Soft Glow 5. Native rasterization can vary by about one pixel.
const measured={card:[577,1112],steps:[603,886],details:[974,1071],divider:942};
const margin=((measured.card[1]-measured.card[0])-(measured.steps[1]-measured.steps[0])-(measured.details[1]-measured.details[0]))/4;
const stepsShift=measured.card[0]+margin-measured.steps[0];
const divider=measured.steps[1]+stepsShift+margin;
const detailsShift=divider+margin-measured.details[0];
const offsets={steps:stepsShift,details:detailsShift,divider:divider-measured.divider};
const changes=[];
for(const id of [6193,80209,6140,6141,6142,6143,6144]){
  const n=layers.find(n=>n.d0===id);
  assert(n&&n.b.a.length===1&&typeof n.b.a[0].a==='number');
  const old=structuredClone(n.b),dx=([6143,6144].includes(id)?detailsShift:stepsShift)*1600/1135;
  n.b.a[0].a=Math.round((n.b.a[0].a+dx)*1e6)/1e6;
  changes.push({id,name:n.s,before:old,after:structuredClone(n.b)});
}
const chrome=layers.find(n=>n.d0===80309),chromeBefore=chrome['2'];
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
assert.equal(chromeBefore,origin+'/assets/navigation-soft-glow/home-balanced.png');
const source=readFileSync(resolve(root,'assets/home-glass/Home_Glass_Chrome_R4.svg'),'utf8');
let next=source;
for(const [a,b] of [['M942 855V989',`M${divider} 855V989`],['<circle cx="674" cy="920"',`<circle cx="${674+stepsShift}" cy="920"`]]){
  assert.equal(next.split(a).length,2);next=next.replace(a,b);
}
const original=await sharp(resolve(root,'assets/navigation-soft-glow/home-balanced.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height}=original.info,sx=width/1135,sy=height/1184;
const render=svg=>sharp(Buffer.from(svg)).resize(width,height).ensureAlpha().raw().toBuffer();
const sourcePixels=await render(source),newPixels=await render(next),pixels=Buffer.from(original.data);
const areas=[[596,842,770,1000],[928,848,948,996]].map(([l,t,r,b])=>({left:Math.floor(l*sx),top:Math.floor(t*sy),right:Math.ceil(r*sx),bottom:Math.ceil(b*sy)}));
let changed=0,minX=width,minY=height,maxX=-1,maxY=-1;
for(const area of areas)for(let y=area.top;y<area.bottom;y++)for(let x=area.left;x<area.right;x++){
  const p=(y*width+x)*4;
  assert(original.data.subarray(p,p+4).equals(sourcePixels.subarray(p,p+4)),'Vector source must match the current activity card exactly');
  assert.equal(newPixels[p+3],original.data[p+3]);
  if(newPixels.subarray(p,p+4).equals(original.data.subarray(p,p+4)))continue;
  newPixels.copy(pixels,p,p,p+4);changed++;
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
}
assert(changed>0);
for(let p=0;p<pixels.length;p+=4){
  assert.equal(pixels[p+3],original.data[p+3]);
  if(pixels.subarray(p,p+4).equals(original.data.subarray(p,p+4)))continue;
  const x=p/4%width,y=Math.floor(p/4/width);
  assert(areas.some(a=>x>=a.left&&x<a.right&&y>=a.top&&y<a.bottom));
}
const pngPath='assets/navigation-soft-glow/home-balanced-activity.png';
const png=await sharp(pixels,{raw:original.info}).png({compressionLevel:9}).toBuffer();
assert((await sharp(png).ensureAlpha().raw().toBuffer()).equals(pixels));
writeFileSync(resolve(root,pngPath),png);chrome['2']=origin+'/'+pngPath;
const artwork={path:pngPath,width,height,bytes:png.length,sha256:sha(png),changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],otherPixelsIdentical:true,alphaIdentical:true};
const expected={steps:measured.steps.map(x=>x+stepsShift),details:measured.details.map(x=>x+detailsShift),divider};
const gaps=[expected.steps[0]-measured.card[0],divider-expected.steps[1],expected.details[0]-divider,measured.card[1]-expected.details[1]];
for(const gap of gaps)assert.equal(gap,margin);
widget['3']='Widgy Weather 15 - Google Soft Glow 6';
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
for(const c of changes)reversedLayers.find(n=>n.d0===c.id).b=c.before;
reversedLayers.find(n=>n.d0===80309)['2']=chromeBefore;
assert.deepEqual(reversed,before,'Only name, activity X positions and Home chrome URL may change');
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-soft-glow6:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Soft_Glow_6.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-soft-glow6-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-soft-glow6.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),offsetsDesignPixels:offsets,layout:{source:'IMG_0019.png, visible-ink half-open bounds',measured,expected,equalMargins:margin,gaps,note:'Reference content: 6,150 steps, 4012 m and 305 Cal. Visible gaps vary with values and native rasterization.'},changedLayerIDs:changes.map(c=>c.id),artwork,ringBackgroundAndNativeProgressTranslatedEqually:true,ringToTextSpacingPreserved:true,allSizesFontsAndVerticalPositionsIdentical:true,weatherCardIdentical:true,googleMapAndAllVariablesIdentical:true,allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,bytes:raw.length,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-soft-glow6-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
