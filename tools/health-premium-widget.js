import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HEALTH_SOURCES,source,customText,javascript,readingScript,stepsScript,SOURCE_LIMITATIONS} from './health-data.js';
export const PREVIEW='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const scalar=(a,k=168)=>({a:[{a:Math.round(a*1e6)/1e6,b:k,c:0,d:k}],b:0});
const dateScript=`function main(){var d=new Date();return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]+', '+d.getDate()+' '+['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]+' '+d.getFullYear();}`;

export function withHealthPremium(original) {
  assert.equal(original['3'],'Widgy Weather Premium 10','Expected verified v10 baseline');
  const w=structuredClone(original),home=w['1'].find(n=>n.d0===245),calendar=w['1'].find(n=>n.d0===247),weather=w['1'].find(n=>n.d0===246),shared=w['1'].find(n=>n.d0===83010),health=w['1'].find(n=>n.d0===195);
  assert(home&&calendar&&weather&&shared&&health);
  let id=Math.max(w.a2,85000);
  const layout=JSON.parse(readFileSync(new URL('../assets/health-premium/layout.json',import.meta.url)));
  const frame=(n,x,y,width,height,kind=168)=>Object.assign(n,{b:scalar(x*1600/1135,kind),c:scalar(y*1600/1184,kind),d:scalar(width*1600/1135,kind),e:scalar(height*1600/1184,kind)});
  function clone(n){n=structuredClone(n);n.d0=++id;return n;}
  const colors={};
  for(const [i,color]of [...new Set(layout.fields.map(f=>f.color).concat(layout.rings.map(r=>r.color)))].entries()){
    const name='hexcol_0EA1700000004000A000'+String(i+1).padStart(12,'0');
    w['2'].push(name+'-'+color.slice(1).toUpperCase()+'FF');colors[color]=name+'-100';
  }
  const lime=home['1'].find(n=>n.s==='HOME Nav Label').f;
  const muted=shared['1'].find(n=>n.s==='FITNESS Nav Label').f;
  const variableBase=w['36'].find(v=>v['1']==='steps_today')['3'];
  for(const [i,[key,[category,field]]]of Object.entries(HEALTH_SOURCES).entries()){
    const body=structuredClone(variableBase);body['66']=[source(category,field)];body.s='Variable: health_'+key;
    w['36'].push({'0':'0EA17000-0000-4000-A000-'+String(i+1).padStart(12,'0'),'1':'health_'+key,'2':0,'3':body});
  }
  const entriesFor=key=>{
    if(key==='date')return[javascript(dateScript)];
    if(key==='steps'||key==='steps6')return[javascript(stepsScript())];
    if(key==='goal')return[javascript(stepsScript(true))];
    if(/^day[0-6]$/.test(key)){const offset=Number(key.slice(3))-6;return[javascript(`function main(){var d=new Date();d.setDate(d.getDate()+(${offset}));return ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];}`)];}
    if(/^steps[0-5]$|^energy[0-5]$/.test(key))return[customText('—')];
    if(key==='energy6')return[javascript(readingScript('calories'))];
    assert(HEALTH_SOURCES[key],key);
    return[javascript(readingScript(key,key==='hrv'?'HRV avg ':key==='resting'?'Resting ':''))];
  };
  const texts=layout.fields.map(f=>{
    const height=f.cap*1.65;
    const x=f.x-(f.anchor==='middle'?f.width/2:f.anchor==='end'?f.width:0);
    const n={z:'1',d0:++id,s:'Health · '+f.key,'1':'Phenomena-'+f.weight,'66':entriesFor(f.key),f:colors[f.color]};
    // Native alignment: observed 0=leading / 1=center / 2=trailing.
    n['2']=scalar(f.anchor==='middle'?1:f.anchor==='end'?2:0);
    return frame(n,x,f.y-f.cap*1.325,f.width,height);
  });
  const ringTemplate=home['1'].find(n=>n.z==='9'&&n['1']==='Pedometer'&&n['2']==='Steps');
  assert(ringTemplate);
  const rings=layout.rings.map(r=>{
    const n=clone(ringTemplate);n.s='Health · '+r.key+' ring';n['1']='Health (Activity)';n['2']=r.key[0].toUpperCase()+r.key.slice(1)+' Progress';n['20']=100;n['10']=colors[r.color];
    for(const k of ['8','9'])n[k].a[0].a=100*r.width/(2*r.r+r.width);
    return frame(n,r.x-(r.r+8)*r.sx,r.y-r.r-8,(2*r.r+16)*r.sx,2*r.r+16);
  });
  const gaugeTemplate=home['1'].find(n=>n.s==='Day Progress · Native Linear Gauge');assert(gaugeTemplate);
  const gauges=layout.bars.map(b=>{
    const n=clone(gaugeTemplate);n.s='Health · Today steps bar';n.f=lime;
    n['31']=`var main=function(){var s=String('${'${widgy.steps_today}'}').trim().replace(/[,\\s]/g,'');var n=/^\\d+$/.test(s)?Number(s):0;return [{name:'Steps',value:Math.min(100,Math.max(0,n/10000*100))}];};`;
    return frame(n,b.x,b.y-50,b.width,100,462);
  });
  // Keep the established navigation geometry, symbols and button target IDs.
  // Only the fourth tab's label/icon changes to Health throughout the widget.
  const nav=[...calendar['1'].filter(n=>/^HOME Nav (Icon|Label)$/.test(n.s)),...home['1'].filter(n=>/^CALENDAR Nav (Icon|Label)$/.test(n.s)),...shared['1'].filter(n=>/^(WEATHER|FITNESS) Nav (Icon|Label)$/.test(n.s))].map(clone);
  assert.equal(nav.length,8);
  nav.forEach(n=>{n.f=n.s.startsWith('FITNESS')?lime:muted;});
  const taps=weather['1'].filter(n=>n.z==='11').map(clone);assert.equal(taps.length,4);
  const header=shared['1'].filter(n=>n.s.startsWith('Header')).map(clone);
  const image=frame({z:'5',d0:++id,s:'Health · Approved glass and icons','1':'Web URL','2':PREVIEW+'/assets/health-premium/chrome-h1.png','3':true},0,0,1135,1184,160);
  health.s='HEALTH';health['1']=[...taps,...header,...nav,...texts,...rings,...gauges,image];
  function rename(n){
    if(n.s==='FITNESS Nav Label'){n.s='HEALTH Nav Label';n['66']=[customText('HEALTH')];}
    if(n.s==='FITNESS Nav Icon'){n.s='HEALTH Nav Icon';n['3']='heart.fill';}
    if(n.s==='FITNESS Tap')n.s='HEALTH Tap';
    if(Array.isArray(n['1']))n['1'].forEach(rename);
  }
  w['1'].forEach(rename);
  const panel=weather['1'].find(n=>n.s==='Weather · Live current, six hours and five days');assert(panel['2'].includes('&v=10&'));panel['2']=panel['2'].replace('&v=10&','&v=11&');
  w['3']='Widgy Health Premium 1';
  w['4']='Health native integration candidate 1. Approved Health artwork and final moon, native Health/Activity/Pedometer readings, original navigation geometry with Health tab. No Health data is sent to our server. Main Weather standalone sun is 10% smaller only at revision 11. All prior variables, Home sources, Calendar, GPS/map and refresh mechanism retained. No demo readings in the export. '+SOURCE_LIMITATIONS.join(' ');
  w.a2=id;
  return w;
}
