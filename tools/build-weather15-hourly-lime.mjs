// Build the chosen subtle-lime hourly highlight from the editable approved SVG.
// Supply the complete, current split-map Weather 15 export and a private output
// directory OUTSIDE the repository. Only sealed JSON is published.
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
assert(input && output,'Supply the current full widget export and private output directory');
const root=fileURLToPath(new URL('../',import.meta.url));
const privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'),'Keep private outputs outside the repository');
const source=readFileSync(new URL('../assets/weather-premium/chrome-r14.svg',import.meta.url),'utf8');
const gradient=/<linearGradient id="hourSelected"[^>]*>[\s\S]*?<\/linearGradient>/g;
assert.equal([...source.matchAll(gradient)].length,1);
// Slightly less lime than the chosen mockup. Maintain a visible glass fill at
// the lower edge, with no stroke, glow, size, corner-radius or layout changes.
const replacement='<linearGradient id="hourSelected" x2="0" y2="1"><stop stop-color="#c5f52a" stop-opacity=".14"/><stop offset=".55" stop-color="#bedf4e" stop-opacity=".10"/><stop offset="1" stop-color="#b6d16a" stop-opacity=".075"/></linearGradient>';
const updated=source.replace(gradient,replacement);
const original=await sharp(new URL('../assets/weather-premium/chrome-r14.png',import.meta.url).pathname).ensureAlpha().raw().toBuffer();
const originalSVG=await sharp(Buffer.from(source)).ensureAlpha().raw().toBuffer();
assert(original.equals(originalSVG),'Approved PNG must match its editable source');
const png=await sharp(Buffer.from(updated)).png({compressionLevel:9}).toBuffer();
const decoded=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(decoded.info.width,1135);assert.equal(decoded.info.height,1184);
let changed=0,minX=1135,minY=1184,maxX=-1,maxY=-1;
for(let p=0;p<original.length;p+=4) {
  assert.equal(decoded.data[p+3],original[p+3],'Opacity outside the existing background must not change');
  if(decoded.data.subarray(p,p+4).equals(original.subarray(p,p+4)))continue;
  const x=(p/4)%1135,y=Math.floor(p/4/1135);
  assert(x>=59&&x<203&&y>=578&&y<707,'Pixels changed outside the selected hour');
  changed++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
}
assert(changed>15000);
writeFileSync(new URL('../assets/weather-premium/chrome-r14-hourly-lime1.svg',import.meta.url),updated);
writeFileSync(new URL('../assets/weather-premium/chrome-r14-hourly-lime1.png',import.meta.url),png);

const before=JSON.parse(readFileSync(input,'utf8'));
assert.equal(before['3'],'Widgy Weather 15');
const widget=structuredClone(before);
const layers=[...widgetLayers(widget)];
assert(layers.some(n=>n.s==='Home Map Location Overlay'),'Use the current split-map widget');
const chrome=layers.find(n=>n.d0===84024);
const oldURL=chrome?.['2'];
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
assert.equal(oldURL,origin+'/assets/weather-premium/chrome-r14.png?v=frost4');
chrome['2']=origin+'/assets/weather-premium/chrome-r14-hourly-lime1.png';
const restored=structuredClone(widget);
[...widgetLayers(restored)].find(n=>n.d0===84024)['2']=oldURL;
assert.deepEqual(restored,before,'Only the Weather chrome URL may change');
const raw=Buffer.from(JSON.stringify(widget));
assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-hourly-lime:v1:20261014');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
mkdirSync(privateDir,{recursive:true,mode:0o700});
writeFileSync(resolve(privateDir,'Widgy_Weather_15.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-hourly-lime-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-hourly-lime.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={pngBytes:png.length,width:1135,height:1184,changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],allOtherPixelsIdentical:true,widgetChanges:['Weather chrome URL only'],layers:layers.length,variables:widget['36'].length,originalMapResolutionPreserved:true,encryptionRoundTrip:true,bytes:raw.length,sha256:envelope.sha256};
writeFileSync(resolve(privateDir,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
