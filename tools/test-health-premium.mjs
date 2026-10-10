import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import sharp from 'sharp';
import {withHealthPremium} from './health-premium-widget.js';
import {nativeReading,stepValue,HEALTH_SOURCES} from './health-data.js';
import {healthScene} from './health-design.js';
import {renderSVG} from '../lib/weather/render.js';
import {createWeatherHandler} from '../lib/weather/handler.js';
const input=process.argv[2]||'work/private/weather-10.json';
const source=JSON.parse(fs.readFileSync(input));
const before=structuredClone(source),w=withHealthPremium(source);
const flat=a=>a.flatMap(n=>[n,...(Array.isArray(n['1'])?flat(n['1']):[])]);
const run=(s,vars={})=>vm.runInNewContext(s.replace(/\$\{widgy\.([^}]+)\}/g,(_,k)=>vars[k]??'')+';main();',{}, {timeout:1000});
test('No input mutation; preserve every existing variable and data source',()=>{
 assert.deepEqual(source,before);assert.deepEqual(w['36'].slice(0,source['36'].length),source['36']);
 for(const g of source['1'].filter(n=>n.d0!==195)){
  const actual=structuredClone(w['1'].find(n=>n.d0===g.d0));
  function undo(n){if(n.s==='HEALTH Nav Label'){n.s='FITNESS Nav Label';n['66'][0]['25']='FITNESS';}if(n.s==='HEALTH Nav Icon'){n.s='FITNESS Nav Icon';n['3']='figure.run';}if(n.s==='HEALTH Tap')n.s='FITNESS Tap';if(n.s==='Weather · Live current, six hours and five days')n['2']=n['2'].replace('&v=11&','&v=10&');if(Array.isArray(n['1']))n['1'].forEach(undo);}
  undo(actual);assert.deepEqual(actual,g,'Unrelated content changed in '+g.s);
 }
});
test('Unique IDs and unchanged four-way navigation',()=>{
 const nodes=flat(w['1']);assert.equal(new Set(nodes.map(n=>n.d0)).size,nodes.length);
 for(const group of w['1'].filter(n=>[245,246,247,195].includes(n.d0)))assert.equal(group['1'].filter(n=>n.z==='11'&&/ Tap$/.test(n.s)).length,4);
 const h=w['1'].find(n=>n.d0===195);assert.equal(h.a,false);assert.equal(h['1'].filter(n=>n.z==='9').length,3);
 assert(h['1'].filter(n=>n.z==='9').every(n=>n['20']===100&&n['1']==='Health (Activity)'));
});
test('Verified picker names, local-only health variables, no demo readings',()=>{
 const newVars=w['36'].slice(source['36'].length);assert.equal(newVars.length,Object.keys(HEALTH_SOURCES).length);
 for(const v of newVars){const s=v['3']['66'][0];assert.deepEqual([s['5'],s['6']],HEALTH_SOURCES[v['1'].replace('health_','')]);}
 const h=w['1'].find(n=>n.d0===195);const healthBody=JSON.stringify(h);
 assert(!healthBody.includes('fetch('));assert(!/https:[^"\s]*health_(?:heart|sleep|oxygen)/.test(healthBody));
 for(const s of ['7,842','41.2','72 bpm','09:41','7h 24m'])assert(!healthBody.includes(s),s);
 assert.equal(h['1'].filter(n=>n['66']?.[0]?.['25']==='—').length,12,'Past readings must not reuse today');
});
test('Native formatting and missing values do not create zeros or fake units',()=>{
 for(const raw of ['',undefined,null,'—','N/A','${widgy.health_heart}','-1 bpm'])assert.equal(nativeReading(raw,{positive:true}),'—');
 for(const raw of ['0','0%','0 bpm','0 mL/kg/min'])assert.equal(nativeReading(raw,{positive:true}),'—');
 for(const raw of ['72 bpm','98%','0.98','7h 24m','3.2'])assert.equal(nativeReading(raw,{positive:true}),raw);
 assert.equal(nativeReading('0 kcal'),'0 kcal');assert.equal(stepValue('0'),'0');assert.equal(stepValue('12,500',true),'125%');assert.equal(stepValue(''),'—');
 const h=w['1'].find(n=>n.d0===195);for(const n of h['1']){
  const s=n['66']?.[0];if(n.s.startsWith('Health · ')&&s?.['5']==='Javascript'&&!/Health · (date|day\d)/.test(n.s)){
   const result=run(s['10']);assert(/—/.test(result),'Missing native field must be absent: '+n.s);
  }
 }
 const gauge=h['1'].find(n=>n.z==='18');for(const [raw,value]of [['',0],['0',0],['5,000',50],['20000',100]])assert.equal(run(gauge['31'],{steps_today:raw})[0].value,value);
});
test('Artwork contains no health readings; approved moon geometry and readable field boxes',async()=>{
 const scene=healthScene();assert(scene.svg.includes('r="17.97641556"'));assert(scene.svg.includes('scale(0.68945625)'));
 for(const value of ['72 bpm','41.2','7,842','420 kcal'])assert(!scene.svg.includes('>'+value+'<'));
 for(const f of scene.fields){assert(f.y<1049&&f.y-f.cap>150);assert(f.width>0);}
 const meta=await sharp('assets/health-premium/chrome-h1.png').metadata();assert.equal(meta.width,2270);assert.equal(meta.height,2368);
});
test('Weather v11 changes only the main standalone sun, preserving v10 everywhere else',()=>{
 const base={at:'2026-10-10T10:30:00Z',zone:'Asia/Jerusalem',current:{icon:'sun',temperature:29,label:'Mostly Sunny',feels:31,humidity:59,wind:17,uv:6,time:'2026-10-10T13:30'},hourly:[],daily:[]};
 const ten=renderSVG(base,{revision:10}),eleven=renderSVG(base,{revision:11});
 assert.notEqual(ten,eleven);
 assert.equal(ten.replace('translate(75 281) scale(1.8)','translate(104 290) scale(1.38)'),eleven);
 for(const icon of ['cloud','partly','moon','night_cloud','light_rain','heavy_rain','snow','storm','fog','wind']){
  const data={...base,current:{...base.current,icon}};
  assert.equal(renderSVG(data,{revision:10}),renderSVG(data,{revision:11}));
 }
});
test('Weather endpoint recognizes revision 11 without changing location requirements',async()=>{
 let seen;
 const handler=createWeatherHandler({render:async(_d,o)=>{seen=o;return Buffer.from('health-weather-r11-test');}});
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},send(v){this.body=v;return this;},json(){return this;}};
 await handler({method:'GET',url:'/api/weather-panel?v=11',headers:{}},res);
 assert.equal(res.code,200);assert.equal(seen.revision,11);assert.equal(seen.state,'location');
});
