// Small visual revision of the full Google widget. Private content stays outside git.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';
import {healthScene} from './health-design.js';

const [input,output]=process.argv.slice(2);
assert(input&&output,'Supply Google Soft Lime and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)), privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'5918f9f97f1a8b2c1df11f3ad272b3ceadf3311fec37a7ae4fd2c92a35d8bbe1');
const before=JSON.parse(beforeBytes);
mkdirSync(privateDir,{recursive:true,mode:0o700});

async function artwork(sourceSVG,beforePath,updatedSVG,outPath,allowed) {
  const original=await sharp(readFileSync(resolve(root,beforePath))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert(original.data.equals(await sharp(Buffer.from(sourceSVG)).ensureAlpha().raw().toBuffer()),'Source vectors must match the active artwork');
  const png=await sharp(Buffer.from(updatedSVG)).png({compressionLevel:9}).toBuffer();
  const next=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual(next.info,original.info);
  let changed=0,minX=next.info.width,minY=next.info.height,maxX=-1,maxY=-1;
  for(let p=0;p<next.data.length;p+=4){
    assert.equal(next.data[p+3],original.data[p+3],'Image alpha must stay identical');
    if(next.data.subarray(p,p+4).equals(original.data.subarray(p,p+4)))continue;
    const x=p/4%next.info.width,y=Math.floor(p/4/next.info.width);
    assert(allowed(x,y),'Pixel change escaped the intended region');
    changed++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  assert(changed>0);
  writeFileSync(resolve(root,outPath),png);
  return {width:next.info.width,height:next.info.height,bytes:png.length,sha256:sha(png),changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],otherPixelsIdentical:true,alphaIdentical:true};
}
const weatherSVG=readFileSync(resolve(root,'assets/weather-premium/chrome-r14-hourly-lime2.svg'),'utf8');
const gradient=/<linearGradient id="hourSelected"[^>]*>[\s\S]*?<\/linearGradient>/g;
assert.equal([...weatherSVG.matchAll(gradient)].length,1);
const updatedWeather=weatherSVG.replace(gradient,'<linearGradient id="hourSelected" x2="0" y2="1"><stop stop-color="#c5f52a" stop-opacity=".1003"/><stop offset=".55" stop-color="#bedf4e" stop-opacity=".06136"/><stop offset="1" stop-color="#b6d16a" stop-opacity=".0295"/></linearGradient>');
writeFileSync(resolve(root,'assets/weather-premium/chrome-r14-hourly-lime3.svg'),updatedWeather);
const weather=await artwork(weatherSVG,'assets/weather-premium/chrome-r14-hourly-lime2.png',updatedWeather,'assets/weather-premium/chrome-r14-hourly-lime3.png',(x,y)=>x>=59&&x<203&&y>=578&&y<707);

const beforeScene=healthScene(null,{highlightToday:false});
const nextScene=healthScene(null,{highlightToday:false,spaciousSnapshot:true});
const atSize=svg=>svg.replace('width="2270" height="2368"','width="1320" height="1377"');
const healthSVG=atSize(nextScene.svg);
writeFileSync(resolve(root,'assets/health-premium/chrome-h2-spaced-1320.svg'),healthSVG);
const health=await artwork(atSize(beforeScene.svg),'assets/health-premium/chrome-h1-clean-1320.png',healthSVG,'assets/health-premium/chrome-h2-spaced-1320.png',(x,y)=>x>=60&&x<=1260&&y>=565&&y<=710);
assert.deepEqual(nextScene.rings,beforeScene.rings);assert.deepEqual(nextScene.bars,beforeScene.bars);
const moved=['heart','oxygen','sleep','cardio'];
for(const f of nextScene.fields){const old=beforeScene.fields.find(x=>x.key===f.key);assert.deepEqual({...f,y:old.y},old);assert.equal(f.y-old.y,moved.includes(f.key)?4:0);}

const widget=structuredClone(before),layers=[...widgetLayers(widget)],origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
const changes=[];
function change(id,key,value){const n=layers.find(x=>x.d0===id);assert(n);changes.push({id,key,before:structuredClone(n[key])});n[key]=value;}
assert.equal(layers.find(n=>n.d0===84024)['2'],origin+'/assets/weather-premium/chrome-r14-hourly-lime2.png');
assert.equal(layers.find(n=>n.d0===85059)['2'],origin+'/assets/health-premium/chrome-h1-clean-1320.png');
change(84024,'2',origin+'/assets/weather-premium/chrome-r14-hourly-lime3.png');
change(85059,'2',origin+'/assets/health-premium/chrome-h2-spaced-1320.png');
for(const key of moved){
  const n=layers.find(x=>x.s==='Health · '+key),f=nextScene.fields.find(x=>x.key===key),old=beforeScene.fields.find(x=>x.key===key);
  assert.equal(n.c.a.length,1);
  assert.equal(n.c.a[0].a,Math.round((old.y-old.cap*1.325)*1600/1184*1e6)/1e6);
  const c=structuredClone(n.c);c.a[0].a=Math.round((f.y-f.cap*1.325)*1600/1184*1e6)/1e6;change(n.d0,'c',c);
}
widget['3']='Widgy Weather 15 - Google Refined';
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
for(const c of changes)reversedLayers.find(n=>n.d0===c.id)[c.key]=c.before;
assert.deepEqual(reversed,before,'Only approved visual fields may change');
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-refined:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Refined.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-refined-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-refined.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),weather:{...weather,fillIncreasePercent:18,featherUnchanged:true},health:{...health,circleRadius:[23,20],titleBaseline:[514,510],subtitleBaseline:[584,587],mainValueOffset:4},widgetChanges:['Display name','Weather artwork URL','Health artwork URL','Four Health main-value vertical positions'],allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-refined-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
// Review with populated readings too, so missing data does not hide collisions.
for(const spaciousSnapshot of [false,true]){
  const scene=healthScene({}, {highlightToday:false,spaciousSnapshot});
  await sharp(Buffer.from(scene.svg)).resize(1135,1184).extract({left:25,top:454,width:1086,height:268}).png().toFile(resolve(privateDir,spaciousSnapshot?'health-after.png':'health-before.png'));
}
console.log(JSON.stringify(report));
