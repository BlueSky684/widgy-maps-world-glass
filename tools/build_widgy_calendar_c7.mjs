import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {buildCityMapScript} from './widgy-city-map-script.mjs';

const base=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C6.json',import.meta.url),'utf8'));
const w=structuredClone(base), stats={exclusiveProgressShapes:0,prunedGroups:0,sharedAgendaBindings:0,directImages:0};
const allNodes=function*(n){if(!n||typeof n!=='object')return;yield n;for(const v of Object.values(n))if(typeof v==='object')yield* allNodes(v);};
const buttonIds=new Set();
for(const n of allNodes(w['1']))if(n['1a'])for(const id of n['1a'].replace('button_','').split(/[-,]/))buttonIds.add(Number(id));
for(const n of allNodes(w['1'])){
  if(/^(?:Day Progress Fill|Steps Goal Ring) · \d+%$/.test(n.s??'')){
    assert.equal(n.o1['1'],5);n.o1['1']=0;stats.exclusiveProgressShapes++;
  }
  if(n.z==='5'&&n['1']==='Javascript'&&/Static Chrome|Chrome and Frames/.test(n.s??'')){
    assert(n['2'].startsWith('https://'));n['1']='Web URL';delete n['22'];stats.directImages++;
  }
}
assert.equal(stats.exclusiveProgressShapes,200);assert.equal(stats.directImages,2);
function prune(n){
  if(n.z==='13')n['1']=n['1'].map(prune);
  if(n.z==='13'&&n['1'].length===1&&!buttonIds.has(n.d0)&&
      Object.keys(n).every(k=>['d0','z','s','1','o1'].includes(k))){
    const child=n['1'][0];
    if(!(n.o1&&child.o1)){
      if(n.o1)child.o1=structuredClone(n.o1);
      stats.prunedGroups++;return child;
    }
  }
  return n;
}
w['1']=w['1'].map(prune);
const calendar=w['1'].find(n=>n.d0===247);
for(const n of allNodes(calendar))if(n.z==='1'&&Array.isArray(n['66'])){
  n['66']=n['66'].map(src=>{
    const m=/^Calendar #([1-4]) - (Title|Start Time|End Time|Location)$/.exec(src['6']??'');
    if(src['5']!=='Agenda (Today)'||!m)return src;
    const suffix={'Title':'title','Start Time':'start','End Time':'end','Location':'location'}[m[2]];
    const name=`calendar_event_${m[1]}_${suffix}`;
    assert(w['36'].some(v=>v['1']===name));stats.sharedAgendaBindings++;
    return {'5':'Custom Text','6':'Text','25':'${widgy.'+name+'}'};
  });
}
const oldMap=w['36'].find(v=>v['1']==='map_request');
const endpoint='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/api/night-map?mode=live&width=3306&presentation=glass&atlas=r6';
oldMap['3']['66']=[{'5':'Javascript','6':'Async + No main()','10':buildCityMapScript(endpoint,{enabled:true,reuseSeconds:60,cityReuseSeconds:60})}];
// These variables have no consumer in C6; native sunrise/sunset display sources
// remain in the Home layer tree. Validate absence before dropping each one.
for(const name of ['sunrise_today','sunset_today','City']){
  const v=w['36'].find(v=>v['1']===name);assert(v);
  const rest=JSON.stringify({...w,'36':w['36'].filter(x=>x!==v)});
  assert(!rest.includes(v['0'])&&!rest.includes('${widgy.'+name+'}'));
  w['36']=w['36'].filter(x=>x!==v);
}
w['3']='Widgy Home Glass Calendar C7';
w['4']='Calendar C7 performance review: render only the current progress shape, remove redundant wrapper groups, reuse existing native agenda variables, direct static image URLs and best-effort in-context city reuse. Exact GPS, 10,000-step goal, C5 month navigation and C6 private map caching retained. Native event-dot placement is pending a verified settings export; no unknown Calendar keys guessed.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C7.json',import.meta.url),JSON.stringify(w));
const layers=x=>[...allNodes(x['1'])].filter(n=>n.z).length;
stats.layersBefore=layers(base);stats.layersAfter=layers(w);stats.variablesBefore=base['36'].length;stats.variablesAfter=w['36'].length;
writeFileSync(new URL('../assets/calendar-glass/Calendar_C7_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
let html=readFileSync(new URL('./widgy-home-calendar-c6.html',import.meta.url),'utf8').replaceAll('C6','C7');
html=html.replace('Calendar C7: גרסה להשוואת מהירות התגובה, עם שימוש חוזר קצר במפה באותה דקה ובאותו מיקום.','Calendar C7: הפחתת ציור חוזר ושכבות מיותרות, ושיתוף נתוני האירועים בין הרכיבים.');
html=html.replace('ל־C5','ל־C6');
html=html.replace('<button id="copy"','<p>מיקום נקודות האירועים טרם שונה; הוא ממתין לאימות הגדרות Calendar מהמכשיר.</p>\n  <button id="copy"');
writeFileSync(new URL('./widgy-home-calendar-c7.html',import.meta.url),html);
console.log(JSON.stringify(stats));
