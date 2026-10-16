// Unify the four selected-tab halos in the approved Google Refined 2 widget.
// Patch existing chrome pixels only; add no widget layers, scripts or requests.
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
assert(input&&output,'Supply Google Refined 2 and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)),privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'615f3b03304b1253f2d458e42443896bd24f84e57a0e68bbb438aa67d88b7ccb');
const before=JSON.parse(beforeBytes),widget=structuredClone(before),layers=[...widgetLayers(widget)];
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
mkdirSync(privateDir,{recursive:true,mode:0o700});
mkdirSync(resolve(root,'assets/navigation-soft-glow'),{recursive:true});

// Soft centre and a long tail that reaches zero smoothly. The same profile is
// used at the same design size, centred on each existing native icon frame.
const profile=[[0,.125],[.18,.118],[.36,.085],[.55,.044],[.74,.015],[.9,.003],[1,0]];
const color='#c5e858',rx=72,ry=62;
const defs='<radialGradient id="navSoftGlow">'+profile.map(([offset,opacity])=>`<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('')+'</radialGradient>';
const targets=[
  {name:'home',id:80309,icon:5012,svg:'assets/home-glass/Home_Glass_Chrome_R4.svg',png:'assets/home-glass/Home_Glass_Chrome_Solar_R10.png',old:'bloom'},
  {name:'calendar',id:80408,icon:80322,svg:'assets/calendar-glass/Calendar_Glass_Chrome_C2.svg',png:'assets/calendar-glass/Calendar_Glass_Chrome_C8.png',old:null},
  {name:'weather',id:84024,icon:84019,svg:'assets/weather-premium/chrome-r14-hourly-lime4.svg',png:'assets/weather-premium/chrome-r14-hourly-lime4.png',old:'active'},
  {name:'health',id:85059,icon:85047,svg:'assets/health-premium/chrome-h2-spaced-1320.svg',png:'assets/health-premium/chrome-h2-spaced-1320.png',old:'healthGlow'},
];
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const changes=[],artwork=[];
for(const t of targets){
  const node=layers.find(n=>n.d0===t.id),icon=layers.find(n=>n.d0===t.icon);
  assert.equal(node['2'],origin+'/'+t.png);
  const cx=Math.round((icon.b.a[0].a+icon.d.a[0].a/2)*1135/1600*1000)/1000;
  const cy=Math.round((icon.c.a[0].a+icon.e.a[0].a/2)*1184/1600*1000)/1000;
  const ellipse=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#navSoftGlow)"/>`;
  const source=readFileSync(resolve(root,t.svg),'utf8');
  let next=source.replace('</defs>',defs+'</defs>');
  if(t.old){
    const re=new RegExp('<ellipse[^>]+fill="url\\(#'+t.old+'\\)"[^>]*/>','g');
    assert.equal([...source.matchAll(re)].length,1);
    next=next.replace(re,ellipse);
  }else next=next.replace('</svg>',ellipse+'</svg>');
  const original=await sharp(resolve(root,t.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height}=original.info,sx=width/1135,sy=height/1184;
  const render=svg=>sharp(Buffer.from(svg)).resize(width,height).ensureAlpha().raw().toBuffer();
  const sourcePixels=await render(source),newPixels=await render(next),pixels=Buffer.from(original.data);
  assert.equal(sourcePixels.length,pixels.length);assert.equal(newPixels.length,pixels.length);
  // Home's original vectors predate the solar icon polish. Match the navigation
  // area exactly, then copy only that area, preserving every other source pixel.
  const area={left:Math.floor((cx-76)*sx),right:Math.ceil((cx+76)*sx),top:Math.floor(1040*sy),bottom:Math.ceil(1176*sy)};
  let changed=0,minX=width,minY=height,maxX=-1,maxY=-1;
  for(let y=area.top;y<area.bottom;y++)for(let x=area.left;x<area.right;x++){
    const p=(y*width+x)*4;
    assert(original.data.subarray(p,p+4).equals(sourcePixels.subarray(p,p+4)),`${t.name}: source must match the existing navigation pixels`);
    assert.equal(newPixels[p+3],original.data[p+3],`${t.name}: alpha must stay unchanged`);
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
  const newPath=`assets/navigation-soft-glow/${t.name}.png`;
  const png=await sharp(pixels,{raw:original.info}).png({compressionLevel:9}).toBuffer();
  assert((await sharp(png).ensureAlpha().raw().toBuffer()).equals(pixels));
  writeFileSync(resolve(root,newPath),png);
  // Private review crops contain only artwork, with no user data.
  for(const [label,buf] of [['before',original.data],['after',pixels]]){
    await sharp(buf,{raw:original.info}).resize(1135,1184).extract({left:0,top:1040,width:1135,height:144}).png().toFile(resolve(privateDir,`${t.name}-${label}.png`));
  }
  changes.push({id:t.id,before:node['2'],after:origin+'/'+newPath});node['2']=origin+'/'+newPath;
  artwork.push({name:t.name,width,height,pngBytes:png.length,sha256:sha(png),centre:{x:cx,y:cy},changedPixels:changed,changedBounds:[minX,minY,maxX,maxY],otherPixelsIdentical:true,alphaIdentical:true});
}
widget['3']='Widgy Weather 15 - Google Soft Glow';
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
for(const c of changes)reversedLayers.find(n=>n.d0===c.id)['2']=c.before;
assert.deepEqual(reversed,before,'Only the display name and four chrome URLs may change');
assert.deepEqual(widget['36'],before['36']);
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-soft-glow:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Soft_Glow.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-soft-glow-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-soft-glow.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),halo:{color,rx,ry,profile},artwork,widgetChanges:['Display name','Four chrome artwork URLs'],allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,noAddedLayersOrRequests:true,googleMapAndVariablesIdentical:true,encryptionRoundTripExact:true,bytes:raw.length,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-soft-glow-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
