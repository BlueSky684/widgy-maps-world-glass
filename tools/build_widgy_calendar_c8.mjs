import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C7.json'),w=structuredClone(base);
const walk=function*(xs){for(const n of xs){yield n;if(n.z==='13')yield* walk(n['1']);}};
const stats={removedDeadLayers:[],sharedNavigationLayersRemoved:0,unreachableBadgeLayersRemoved:0,chrome:[]};
const home=w['1'].find(n=>n.d0===245),cal=w['1'].find(n=>n.d0===247);
const referenced=new Set();
for(const n of walk(w['1']))if(n['1a'])for(const id of n['1a'].replace('button_','').split(/[-,]/))referenced.add(+id);

// R3/R4 changed long cumulative arc contours into short convex segments.
// All segments up to the current percentage are necessary; equality is wrong.
for(const n of home['1'])if(/^Steps Goal Ring · \d+%$/.test(n.s??''))n.o1['1']=5;
home['1']=home['1'].filter(n=>{
 if(n.a!==false||n.z==='13'||referenced.has(n.d0))return true;
 stats.removedDeadLayers.push({id:n.d0,name:n.s});return false;
});
assert.equal(stats.removedDeadLayers.length,19);

// Every pane had its own identical reset hit target and two arrow symbols.
// Share these controls while explicitly selecting the two boundary symbols.
const panes=cal['1'].filter(n=>/^Calendar · Month Offset /.test(n.s??''));
const paneOffset=p=>+p.s.split(' ').at(-1);
const center=panes.find(p=>paneOffset(p)===0);
const reset=center['1'].find(n=>n.s==='Calendar · Return to Current Month');
const arrows=[];
for(const [offset,direction,boundary] of [[0,'left',false],[0,'right',false],[-12,'left',true],[12,'right',true]]){
 const pane=panes.find(p=>paneOffset(p)===offset);
 const n=pane['1'].find(n=>n.s===`Calendar · ${direction} Arrow${boundary?' · Boundary':''}`);
 assert(n);if(boundary)n.a=false;arrows.push(n);
}
for(const pane of panes){
 const before=pane['1'].length;
 pane['1']=pane['1'].filter(n=>!/^Calendar · (?:Return to Current Month|(?:left|right) Arrow)/.test(n.s??''));
 stats.sharedNavigationLayersRemoved+=before-pane['1'].length;
}
stats.sharedNavigationLayersRemoved-=arrows.length+1;
cal['1'].unshift(reset,...arrows);
for(const n of walk(w['1']))if(n['1a']){
 const [show,hide]=n['1a'].slice('button_'.length).split('-').map(s=>s.split(',').filter(Boolean).map(Number));
 const target=panes.find(p=>show.includes(p.d0));
 if(!target)continue; // Other tabs use normal defaults, including the current month.
 const offset=paneOffset(target),active=[offset===-12?arrows[2]:arrows[0],offset===12?arrows[3]:arrows[1]];
 n['1a']=`button_${[...new Set([...show,...active.map(x=>x.d0)])].join(',')}-${[...new Set([...hide,...arrows.filter(x=>!active.includes(x)).map(x=>x.d0)])].join(',')}`;
}
assert.equal(stats.sharedNavigationLayersRemoved,70);

// A six-row month can only start Friday/Saturday and end at cell 35/36.
// Its Today index can never be 0..4 or 37..41. Other layouts stay unchanged.
const six=center['1'].find(n=>n.s==='Calendar · 6 Week Layout');
six['1']=six['1'].filter(n=>{
 if(!/^Calendar · Today Cell /.test(n.s??''))return true;
 const cell=+n.s.split(' ').at(-1);if(cell>=5&&cell<=36)return true;
 stats.unreachableBadgeLayersRemoved+=1+n['1'].length;return false;
});
assert.equal(stats.unreachableBadgeLayersRemoved,30);

// These stale customization URLs are not used: all weather artwork is native
// Shape/SF Symbol, and the only Image layers are the map and two chrome panels.
assert.equal([...walk(w['1'])].filter(n=>n.z==='5').length,3);
stats.removedUnusedWeatherURLs=[];
for(const letter of 'fghijklmnopqrstu'){
 const key=letter+'3';assert(w[key].includes('/assets/home-weather/'));
 stats.removedUnusedWeatherURLs.push(key);delete w[key];
}
// Trim only font catalog entries with no live Text/Calendar consumer. This
// does not uninstall or modify the user's installed fonts or their names.
const fonts=new Set();
for(const n of walk(w['1'])){
 if(n.z==='1')fonts.add(n['1']??'System Regular');
 if(n.z==='10')for(const k of ['1','14'])if(n[k])fonts.add(n[k]);
}
stats.removedFontCatalogEntries=w['38'].filter(n=>!fonts.has(n.p)).map(n=>n.p);
w['38']=w['38'].filter(n=>fonts.has(n.p));
w['39']=Object.fromEntries(Object.entries(w['39']).filter(([name])=>fonts.has(name)));

// Production raster assets from the SAME approved SVGs. 1320px exceeds the
// 1134px large-widget reference. The live 3306px map and its masters are intact.
for(const [id,svgPath,oldPath,newPath] of [
 [80309,'../assets/home-glass/Home_Glass_Chrome_R4.svg','../assets/home-glass/Home_Glass_Chrome_R4.png','../assets/home-glass/Home_Glass_Chrome_C8.png'],
 [80408,'../assets/calendar-glass/Calendar_Glass_Chrome_C2.svg','../assets/calendar-glass/Calendar_Glass_Chrome_C2.png','../assets/calendar-glass/Calendar_Glass_Chrome_C8.png'],
]){
 const svg=readFileSync(new URL(svgPath,import.meta.url)),old=await sharp(new URL(oldPath,import.meta.url).pathname).metadata();
 const width=1320,height=Math.round(width*1184/1135),path=new URL(newPath,import.meta.url);
 await sharp(svg).resize(width,height).withIccProfile('srgb').png({compressionLevel:9}).toFile(path.pathname);
 const n=[...walk(w['1'])].find(n=>n.d0===id);assert(n);
 n['2']='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/'+newPath.slice(3);
 stats.chrome.push({path:newPath.slice(3),before:[old.width,old.height],after:[width,height],rgbaBytesBefore:old.width*old.height*4,rgbaBytesAfter:width*height*4});
}
w['3']='Widgy Home Glass Calendar C8';
w['4']='C8 repairs the C7 steps-ring regression by restoring cumulative convex segments. Removes 19 unreachable legacy layers, shares 70 duplicate Calendar controls, removes 30 unreachable Today badge layers, unused font metadata and 16 obsolete weather image URLs. Approved chrome re-rasterized at 1320px for lower decoded memory; live map remains 3306px. Full +/-12-month navigation and installed fonts retained. Phone timing and event-dot settings still require device evidence.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C8.json',import.meta.url),JSON.stringify(w));
stats.layersBefore=[...walk(base['1'])].length;stats.layersAfter=[...walk(w['1'])].length;
writeFileSync(new URL('../assets/calendar-glass/Calendar_C8_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
let page=readFileSync(new URL('./widgy-home-calendar-c7.html',import.meta.url),'utf8').replaceAll('C7','C8');
page=page.replace('Calendar C8: הפחתת ציור חוזר ושכבות מיותרות, ושיתוף נתוני האירועים בין הרכיבים.','Calendar C8: תיקון טבעת הצעדים, מסגרות קלות יותר והסרת 119 שכבות ישנות או כפולות.');
page=page.replace('והשווה את ההמתנה ל־C6.','ובדוק את זמן התגובה ואת טבעת הצעדים.');
page=page.replace('<p><a href="../assets/fonts/', '<p><a href="./widgy-calendar-c8-diagnostic.html">בדיקה נפרדת לבידוד ההמתנה למפה</a></p>\n<p><a href="../assets/fonts/');
writeFileSync(new URL('./widgy-home-calendar-c8.html',import.meta.url),page);
const diagnostic=page.replace('<script>','<script type="module">\nimport {withoutMap} from "./widgy-calendar-diagnostics.mjs";')
 .replace('<h1>Widgy Home · Calendar C8</h1>','<h1>בדיקת C8 ללא המפה</h1>')
 .replace('<p>Calendar C8: תיקון טבעת הצעדים, מסגרות קלות יותר והסרת 119 שכבות ישנות או כפולות.</p>', '<p>עותק אבחון נפרד: אזור המפה ב־Home יהיה ריק. רק המפה וטעינת שם העיר כבויות; היומן, החודשים ושאר הנתונים זהים ל־C8.</p>')
 .replace('לאחר הטעינה הראשונה, בדוק כמה מעברים בין חודשים ובדוק את זמן התגובה ואת טבעת הצעדים.', 'אחרי הטעינה הראשונה, עבור בין שלושה חודשים והשווה ל־C8 הרגיל באותו חיבור רשת. כתוב כמה שניות נמשך מעבר בכל עותק. ההבדל יעזור לבודד את מקור ההמתנה.')
 .replace('<p><a id="download" href="./Widgy_Home_Glass_Calendar_C8.json" download="Widgy_Home_Glass_Calendar_C8.json">', '<p><a id="download" hidden download="Widgy_Calendar_C8_Map_Off_Test.json">')
 .replace('const widget=await response.json();', 'const original=await response.json();\n    const widget=withoutMap(original);')
 .replace("widget['3']!=='Widgy Home Glass Calendar C8'", "widget['3']!=='Widgy Calendar C8 Map-Off Test'")
 .replace('<p><a href="./widgy-calendar-c8-diagnostic.html">בדיקה נפרדת לבידוד ההמתנה למפה</a></p>', '<p><a href="./widgy-home-calendar-c8.html">חזרה לגרסת C8 הרגילה</a></p>')
 .replace('תמונת המפה עשויה להישאר זהה עד דקה; השעון והצעדים ממשיכים להתעדכן בנפרד.', 'זהו עותק אבחון בלבד. לאחר הבדיקה חזור לגרסת C8 הרגילה.');
writeFileSync(new URL('./widgy-calendar-c8-diagnostic.html',import.meta.url),diagnostic);
console.log(JSON.stringify(stats));
