import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {plainZeroPaths} from '../lib/weather/plain-zero.js';
const root=new URL('../',import.meta.url),out=new URL('../../../health-week-integration/verification/',import.meta.url);
const fonts=JSON.parse(readFileSync(new URL('assets/weather-premium/glyphs.json',root)));
let old=readFileSync(new URL('assets/health-premium/chrome-h2-spaced-1320.svg',root),'utf8');
for(const [weight,path] of Object.entries(plainZeroPaths))old=old.replaceAll(`<path d="${fonts[weight].glyphs['0'].path}"`,`<path d="${path}"`);
function goal(s){const f=fonts.Regular,k=15/f.cap;let x=278,r=`<g fill="#8596a2" aria-label="${s}"><title>${s}</title>`;for(let i=0;i<s.length;i++){x+=(i?f.kern[s[i-1]+s[i]]||0:0)*k;r+=`<path d="${s[i]==='0'?plainZeroPaths.Regular:f.glyphs[s[i]].path}" transform="translate(${x} 401) scale(${k} ${-k})"/>`;x+=f.glyphs[s[i]].advance*k;}return r+'</g>';}
assert(old.includes(goal('DAILY GOAL 10,000')));old=old.replace(goal('DAILY GOAL 10,000'),goal('DAILY GOAL 11,000'));
const next=old.replace(/<g fill="[^"]+" aria-label="LAST 7 DAYS">.*?<\/g>/,'');assert.notEqual(next,old);
const original=await sharp(new URL('assets/navigation-cache/health-goal-11000-3f5c8d013406.png',root).pathname).ensureAlpha().raw().toBuffer({resolveWithObject:true});const {width,height}=original.info;
const render=s=>sharp(Buffer.from(s)).resize(width,height).ensureAlpha().raw().toBuffer();const [a,b]=await Promise.all([render(old),render(next)]);let changed=0;const data=Buffer.from(original.data);
for(let p=0;p<data.length;p+=4){if(a.subarray(p,p+4).equals(b.subarray(p,p+4)))continue;assert(original.data.subarray(p,p+4).equals(a.subarray(p,p+4)));b.copy(data,p,p,p+4);changed++;}
const png=await sharp(data,{raw:original.info}).png({compressionLevel:9}).toBuffer(),sha=createHash('sha256').update(png).digest('hex'),assetPath=`assets/navigation-cache/home-glass-health-${sha.slice(0,12)}.png`;
writeFileSync(new URL(assetPath,root),png);writeFileSync(new URL('artwork.json',out),JSON.stringify({assetPath,sha256:sha,changedPixels:changed,change:'Remove static LAST 7 DAYS for dynamic SUN–SAT and sync timestamp',otherPixelsPreserved:true},null,2));
const manifest=new URL('tools/public-site-files.json',root),files=JSON.parse(readFileSync(manifest));console.log('manifest type',typeof files,Array.isArray(files),Object.keys(files).slice(0,5));console.log(assetPath,changed);
