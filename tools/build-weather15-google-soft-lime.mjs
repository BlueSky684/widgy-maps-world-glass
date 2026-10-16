// Adjust the selected-hour artwork in the complete, verified Google Home copy.
// Private widget data and fragment keys are never written into the repository.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';

const [input,output] = process.argv.slice(2);
assert(input && output,'Supply Google Full Home and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)),privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'),'Private output must be outside the repository');
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'78faaa647bc8aa6e68692a48e6034a61021538d39f6cfd3570a4a1063d9ceb67');
const before=JSON.parse(beforeBytes);
const source=readFileSync(new URL('../assets/weather-premium/chrome-r14-hourly-lime1.svg',import.meta.url),'utf8');
const gradient=/<linearGradient id="hourSelected"[^>]*>[\s\S]*?<\/linearGradient>/g;
const selected='<rect x="59.0" y="578" width="144" height="129" rx="21" fill="url(#hourSelected)"/>';
assert.equal([...source.matchAll(gradient)].length,1);
assert.equal(source.split(selected).length,2);
const replacement='<linearGradient id="hourSelected" x2="0" y2="1"><stop stop-color="#c5f52a" stop-opacity=".085"/><stop offset=".55" stop-color="#bedf4e" stop-opacity=".052"/><stop offset="1" stop-color="#b6d16a" stop-opacity=".025"/></linearGradient>';
// Feather only the translucent fill, with a mask inset from the existing tile.
// The rounded tile bounds still clip the result; its neighbours stay identical.
const feather='<filter id="hourSelectedFeather" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="3"/></filter><mask id="hourSelectedSoftEdges" maskUnits="userSpaceOnUse" x="59" y="578" width="144" height="129"><rect x="65" y="584" width="132" height="117" rx="15" fill="white" filter="url(#hourSelectedFeather)"/></mask>';
const updated=source.replace(gradient,replacement+feather).replace(selected,selected.replace('/>',' mask="url(#hourSelectedSoftEdges)"/>'));
const oldPNG=readFileSync(new URL('../assets/weather-premium/chrome-r14-hourly-lime1.png',import.meta.url));
const original=await sharp(oldPNG).ensureAlpha().raw().toBuffer();
assert(original.equals(await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer()),'Existing SVG must match the active PNG');
const png=await sharp(Buffer.from(updated)).png({compressionLevel:9}).toBuffer();
const decoded=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(decoded.info.width,1135);assert.equal(decoded.info.height,1184);
let changed=0,minX=1135,minY=1184,maxX=-1,maxY=-1;
for(let p=0;p<original.length;p+=4) {
  assert.equal(decoded.data[p+3],original[p+3],'The image alpha must remain identical');
  if(decoded.data.subarray(p,p+4).equals(original.subarray(p,p+4)))continue;
  const x=(p/4)%1135,y=Math.floor(p/4/1135);
  assert(x>=59&&x<203&&y>=578&&y<707,'Change escaped the selected-hour background');
  changed++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
}
assert(changed>15000);
writeFileSync(new URL('../assets/weather-premium/chrome-r14-hourly-lime2.svg',import.meta.url),updated);
writeFileSync(new URL('../assets/weather-premium/chrome-r14-hourly-lime2.png',import.meta.url),png);
const widget=structuredClone(before),layers=[...widgetLayers(widget)];
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
const chrome=layers.find(n=>n.d0===84024);
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
assert.equal(chrome['2'],origin+'/assets/weather-premium/chrome-r14-hourly-lime1.png');
chrome['2']=origin+'/assets/weather-premium/chrome-r14-hourly-lime2.png';
widget['3']='Widgy Weather 15 - Google Soft Lime';
const reversed=structuredClone(widget);
reversed['3']=before['3'];
[...widgetLayers(reversed)].find(n=>n.d0===84024)['2']=origin+'/assets/weather-premium/chrome-r14-hourly-lime1.png';
assert.deepEqual(reversed,before,'Only the title and Weather background URL may change');
const raw=Buffer.from(JSON.stringify(widget));
assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-soft-lime:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
mkdirSync(privateDir,{recursive:true,mode:0o700});
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Soft_Lime.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-soft-lime-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-soft-lime.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),width:1135,height:1184,pngBytes:png.length,changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],allOtherPixelsIdentical:true,alphaIdentical:true,widgetChanges:['Display name','Weather background URL'],allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-soft-lime-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
