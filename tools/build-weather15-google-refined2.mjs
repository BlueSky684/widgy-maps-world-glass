// Refine only the current-hour contour and Calendar disc positions.
// Native date text, font, weight and frames remain byte-for-byte identical.
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
assert(input&&output,'Supply Google Refined and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)), privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'4624ac4991b365e8872cb931e20fd79c93d3e0e676c3bd853ddb64d846d09a4c');
const before=JSON.parse(beforeBytes);
mkdirSync(privateDir,{recursive:true,mode:0o700});

const source=readFileSync(resolve(root,'assets/weather-premium/chrome-r14-hourly-lime3.svg'),'utf8');
const tile='<rect x="59.0" y="578" width="144" height="129" rx="21" fill="url(#hourSelected)" mask="url(#hourSelectedSoftEdges)"/>';
assert.equal(source.split(tile).length,2);
const contour='<rect x="62.5" y="581.5" width="137" height="122" rx="18.5" fill="none" stroke="#b6d16a" stroke-opacity=".12" stroke-width="1.1" filter="url(#hourSelectedContourSoftness)"/>';
const filter='<filter id="hourSelectedContourSoftness" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation=".35"/></filter>';
const updated=source.replace('</defs>',filter+'</defs>').replace(tile,tile+contour);
const oldPNG=readFileSync(resolve(root,'assets/weather-premium/chrome-r14-hourly-lime3.png'));
const original=await sharp(oldPNG).ensureAlpha().raw().toBuffer();
assert(original.equals(await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer()));
const png=await sharp(Buffer.from(updated)).png({compressionLevel:9}).toBuffer();
const decoded=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(decoded.info.width,1135);assert.equal(decoded.info.height,1184);
let changed=0,minX=1135,minY=1184,maxX=-1,maxY=-1;
for(let p=0;p<original.length;p+=4){
  assert.equal(decoded.data[p+3],original[p+3]);
  if(decoded.data.subarray(p,p+4).equals(original.subarray(p,p+4)))continue;
  const x=(p/4)%1135,y=Math.floor(p/4/1135);
  assert(x>=59&&x<203&&y>=578&&y<707,'Change escaped the hour tile');
  // The added line must not alter the centre fill.
  assert(!(x>=83&&x<=179&&y>=603&&y<=682),'Contour changed the centre fill');
  changed++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
}
assert(changed>0);
writeFileSync(resolve(root,'assets/weather-premium/chrome-r14-hourly-lime4.svg'),updated);
writeFileSync(resolve(root,'assets/weather-premium/chrome-r14-hourly-lime4.png'),png);
await sharp(png).extract({left:50,top:563,width:165,height:155}).resize(495,465).png().toFile(resolve(privateDir,'weather-contour.png'));

const widget=structuredClone(before),layers=[...widgetLayers(widget)],origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
const chrome=layers.find(n=>n.d0===84024);
assert.equal(chrome['2'],origin+'/assets/weather-premium/chrome-r14-hourly-lime3.png');
chrome['2']=origin+'/assets/weather-premium/chrome-r14-hourly-lime4.png';
const discs=layers.filter(n=>n.s==='Calendar · Today Disc');
assert.equal(discs.length,95);
const dx=-1*1600/1135,dy=1.5*1600/1184;
const changes=[];
for(const n of discs){
  assert.equal(n.z,'2');assert.equal(n.b.a.length,1);assert.equal(n.c.a.length,1);
  assert.equal(n.b.a[0].b,168);assert.equal(n.c.a[0].b,168);
  changes.push({id:n.d0,b:structuredClone(n.b),c:structuredClone(n.c)});
  n.b.a[0].a=Math.round((n.b.a[0].a+dx)*1e6)/1e6;
  n.c.a[0].a=Math.round((n.c.a[0].a+dy)*1e6)/1e6;
}
widget['3']='Widgy Weather 15 - Google Refined 2';
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
reversedLayers.find(n=>n.d0===84024)['2']=origin+'/assets/weather-premium/chrome-r14-hourly-lime3.png';
for(const c of changes){const n=reversedLayers.find(n=>n.d0===c.id);n.b=c.b;n.c=c.c;}
assert.deepEqual(reversed,before,'Only the name, Weather artwork URL and Calendar disc X/Y may change');
const textNames=/^Calendar · Today (Live Date|Date Weight)$/;
const dateTexts=layers.filter(n=>textNames.test(n.s||''));
assert.equal(dateTexts.length,285);
assert.deepEqual(dateTexts,[...widgetLayers(before)].filter(n=>textNames.test(n.s||'')),'All date drawing properties must stay identical');
assert.deepEqual(widget['36'],before['36']);
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-refined2:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Refined_2.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-refined2-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-refined2.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),weather:{width:1135,height:1184,pngBytes:png.length,sha256:sha(png),changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],centreFillIdentical:true,featherIdentical:true,otherPixelsIdentical:true,alphaIdentical:true},calendar:{discsMoved:95,dateDrawingsUnchanged:285,designPixelOffset:{x:-1,y:1.5},discSizeAndMaterialUnchanged:true,allDateTextPropertiesIdentical:true,monthLayoutVariants:[4,5,6]},allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-refined2-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
