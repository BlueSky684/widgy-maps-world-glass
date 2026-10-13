import fs from 'node:fs';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {outlinedText} from '../../lib/weather/render.js';

const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url));
const write=(p,v)=>fs.writeFileSync(new URL('../../'+p,import.meta.url),v);
const scalar=a=>({b:0,a:[{a:Math.round(a*1e6)/1e6,b:1126,c:0,d:1126}]});
const frame=(n,box)=>{for(const [i,k] of ['b','c','d','e'].entries())n[k]=scalar(box[i]*1600/530);return n;};
const widget=JSON.parse(read('tools/Widgy_Device_Glass_9.json'));
const white=widget['2'][0].split('-')[0]+'-100';
const muted=widget['2'][1].split('-')[0]+'-100';
const lime=widget['2'][2].split('-')[0]+'-100';
// Reuse the approved A/SPLIT chrome, which already uses the D9 gradients.
let svg=read('assets/music-glass/chrome-m1.svg').toString();
svg=svg.replace('</svg>',`
<g fill="none" stroke="#afbecb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M461 64a8 8 0 0 1 13-6l3 3M477 56v5h-5M477 67a8 8 0 0 1-13 6l-3-3M461 75v-5h5"/></g>
<!-- Empty album fallback; native artwork covers it when available. -->
<path d="M146 258v-50l35-7v49m-35-32 35-7" fill="none" stroke="#536b7b" stroke-width="5" stroke-linejoin="round"/>
<ellipse cx="137" cy="260" rx="10" ry="7" fill="#536b7b"/><ellipse cx="172" cy="252" rx="10" ry="7" fill="#536b7b"/>
${outlinedText('--:--',46,400,18,'#AEB7C6')}
${outlinedText('--:--',482,400,18,'#AEB7C6','Regular','end')}
</svg>`);
const png=await sharp(Buffer.from(svg)).png({palette:true,colours:256,dither:0,compressionLevel:9}).toBuffer();
write('assets/music-glass/chrome-w1.svg',svg);
write('assets/music-glass/chrome-w1.png',png);
const text=(id,name,source,box,bold,color)=>frame({z:'1',d0:id,s:name,1:'Phenomena-'+(bold?'Bold':'Regular'),2:scalar(0),f:color,66:[{5:' Music',6:source}]},box);
// Music provider strings are from author-published native Widgy exports;
// the same source descriptors are wrapped in today's field-66 schema.
const album=frame({z:'5',d0:17002,s:'Album · Native Now Playing artwork',1:' Music - Album Art (Now Playing)',2:'albumArt',3:true,i:scalar(9)},[38,117,236,236]);
const refresh=frame({z:'11',d0:17001,s:'Refresh · Reload Widget'},[440,36,58,58]);
const icon=(id,name,symbol,box,color)=>frame({z:'4',d0:id,s:name,1:4,3:symbol,f:color},box);
widget['1']=[refresh,album,
 text(17003,'Song · Native Now Playing','Song (Now Playing)',[314,158,174,105],true,white),
 text(17004,'Artist · Native Now Playing','Artist (Now Playing)',[314,278,174,42],false,muted),
 icon(17005,'Previous · Control to connect','backward.end.fill',[115,446,26,26],white),
 icon(17006,'Play · Control to connect','play.fill',[251,441,33,36],lime),
 icon(17007,'Next · Control to connect','forward.end.fill',[389,446,26,26],white),
 frame({z:'5',d0:17008,s:'Music · Glass and progress placeholder',1:'Web URL',2:'data:image/png;base64,'+png.toString('base64'),3:true},[0,0,530,530])];
widget['3']='Widgy Music Glass W1';
widget['4']='Music Glass W1 — approved A/SPLIT layout for Widgy. Same small square size and D9 glass palette; enlarged native Apple Music album artwork, song and artist. Playback symbols are ready for later action wiring and are not connected in W1. Progress and time are unconnected (--:--), not sample playback data. Refresh tap uses the same native default action as Device Glass. First phone-import build: data permissions, provider compatibility, text fitting and artwork clipping require on-device checking.';
widget.a2=17009;delete widget['36'];
assert.equal(widget['1'].length,8);
assert.equal(new Set(widget['1'].map(n=>n.d0)).size,8);
assert.equal(widget['6'],2);
assert(!JSON.stringify(widget).includes('shortcuts://'));
write('tools/Widgy_Music_Glass_W1.json',JSON.stringify(widget));
// QA only. Sample metadata is never embedded in the deliverable.
const icons='<g fill="#f4f7fa"><path d="M115 446h4v26h-4zM141 446v26l-22-13zM411 446h4v26h-4zM389 446v26l22-13z"/></g><path d="M253 441v36l29-18z" fill="#c5ff0a"/>';
const proof=svg.replace('</svg>',icons+outlinedText('Midnight',314,198,32,'#F4F7FA','Bold')+outlinedText('City',314,242,32,'#F4F7FA','Bold')+outlinedText('M83',314,310,23,'#AEB7C6')+'</svg>');
fs.mkdirSync(new URL('../../work/music-glass/',import.meta.url),{recursive:true});
await sharp(Buffer.from(proof)).png().toFile(new URL('../../work/music-glass/widgy-w1-layout.png',import.meta.url).pathname);
console.log(JSON.stringify({name:widget['3'],layers:8,bytes:Buffer.byteLength(JSON.stringify(widget)),backgroundBytes:png.length,phoneValidated:false}));
