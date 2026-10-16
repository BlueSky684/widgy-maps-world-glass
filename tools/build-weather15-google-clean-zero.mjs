// Personal plain-zero variant based exactly on the working Soft Glow 6 export.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';
import {plainZeroPaths} from '../lib/weather/plain-zero.js';

const [input,output]=process.argv.slice(2);
assert(input&&output,'Supply Google Soft Glow 6 and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)),privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'261bb9d22701b440f4c705aeef53e4083035a9a490268471805a138783a460cb');
const before=JSON.parse(beforeBytes),widget=structuredClone(before),layers=[...widgetLayers(widget)];
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
mkdirSync(privateDir,{recursive:true,mode:0o700});
const fontMap={'Phenomena-Regular':'WidgyPlainZero-Regular','Phenomena-Bold':'WidgyPlainZero-Bold'};
const changes=[];
for(const n of layers)for(const key of ['1','3'])if(typeof n[key]==='string'&&fontMap[n[key]]){
  assert(key==='1'?n.z==='1':n.z==='6');
  changes.push({id:n.d0,key,before:n[key],after:fontMap[n[key]]});n[key]=fontMap[n[key]];
}
assert.equal(changes.length,381);
// Weather data is a server-drawn image, so use the matching outline variant.
const weather=layers.find(n=>n.d0===84023),weatherBefore=weather['2'];
assert(weatherBefore.includes('/api/weather-panel?')&&!weatherBefore.includes('zero='));
weather['2']+='&zero=plain';
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
// The static Health DAILY GOAL label also contains four zeros. Patch only the
// changed glyph pixels into the approved chrome to preserve the soft nav halo.
const health=layers.find(n=>n.d0===85059),healthBefore=health['2'];
assert.equal(healthBefore,origin+'/assets/navigation-soft-glow/health.png');
const source=readFileSync(resolve(root,'assets/health-premium/chrome-h2-spaced-1320.svg'),'utf8');
const fonts=JSON.parse(readFileSync(resolve(root,'assets/weather-premium/glyphs.json')));
let next=source,replacements=0;
for(const [weight,path] of Object.entries(plainZeroPaths)){
  const old=`<path d="${fonts[weight].glyphs['0'].path}"`;
  replacements+=next.split(old).length-1;next=next.replaceAll(old,`<path d="${path}"`);
}
assert.equal(replacements,4);
const original=await sharp(resolve(root,'assets/navigation-soft-glow/health.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width,height}=original.info;
const render=svg=>sharp(Buffer.from(svg)).resize(width,height).ensureAlpha().raw().toBuffer();
const oldPixels=await render(source),newPixels=await render(next),pixels=Buffer.from(original.data);
let changed=0,minX=width,minY=height,maxX=-1,maxY=-1;
for(let p=0;p<pixels.length;p+=4){
  if(oldPixels.subarray(p,p+4).equals(newPixels.subarray(p,p+4)))continue;
  assert(original.data.subarray(p,p+4).equals(oldPixels.subarray(p,p+4)),'Health source must match at each changed pixel');
  assert.equal(newPixels[p+3],original.data[p+3]);newPixels.copy(pixels,p,p,p+4);changed++;
  const x=p/4%width,y=Math.floor(p/4/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
}
assert(changed>0);
const pngPath='assets/navigation-soft-glow/health-plain-zero.png';
const png=await sharp(pixels,{raw:original.info}).png({compressionLevel:9}).toBuffer();
assert((await sharp(png).ensureAlpha().raw().toBuffer()).equals(pixels));
writeFileSync(resolve(root,pngPath),png);health['2']=origin+'/'+pngPath;
const name='Widgy Weather 15 - Google Clean Zero';widget['3']=name;
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
for(const c of changes)reversedLayers.find(n=>n.d0===c.id)[c.key]=c.before;
reversedLayers.find(n=>n.d0===84023)['2']=weatherBefore;
reversedLayers.find(n=>n.d0===85059)['2']=healthBefore;
assert.deepEqual(reversed,before,'Only the name, font references, Weather style and Health zero artwork may change');
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-clean-zero:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Clean_Zero.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-clean-zero-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-clean-zero.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),fonts:fontMap,fontReferences:changes.length,
 nativeTextReferences:changes.filter(c=>c.key==='1').length,nativeChartReferences:changes.filter(c=>c.key==='3').length,
 artwork:{path:pngPath,width,height,bytes:png.length,sha256:sha(png),changedZeroCount:replacements,changedPixels:changed,changedBounds:[minX,minY,maxX,maxY]},
 allLayerFramesAndSizesIdentical:true,allColorsIdentical:true,googleMapAndAllVariablesIdentical:true,
 allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,bytes:raw.length,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-clean-zero-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
