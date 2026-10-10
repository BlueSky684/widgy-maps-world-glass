import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {withOpenMeteoHome} from './open-meteo-home-widget.js';
import {condition} from '../lib/weather/model.js';
import {widgyData} from '../lib/weather/widgy-data.js';
const original=JSON.parse(fs.readFileSync(process.argv[2]||'work/private/health-before-open-meteo.json'));
const w=withOpenMeteoHome(original),restored=structuredClone(w);
const digest=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
function nodes(w){const out=[];function walk(n){out.push(n);if(Array.isArray(n['1']))n['1'].forEach(walk);}w['1'].forEach(walk);return out;}
const old=nodes(original),all=nodes(w),back=nodes(restored);
for(const n of back){
  const before=old.find(v=>v.d0===n.d0);
  if([6121,6124,6131,6132,6133,6134].includes(n.d0))n['66']=before['66'];
  if([80012,80034,80042,7008].includes(n.d0))n.o1=before.o1;
  if(n.s==='Weather · Live current, six hours and five days')n['2']=before['2'];
}
for(const v of restored['36'])if(['wx_status','wx_wind_speed'].includes(v['1']))v['3']['66']=original['36'].find(o=>o['0']===v['0'])['3']['66'];
assert.equal(digest(restored),digest(original),'Only the eight data sources, four icon conditions and panel version may change');
let builtins=0;function scan(o){if(!o||typeof o!=='object')return;if(/^Weather \(/.test(o['5']||'')||o['5']==='Sun And Moon')builtins++;Object.values(o).forEach(scan);}scan(w);assert.equal(builtins,0,'No native weather or solar source remains');
const statusID=w['36'].find(v=>v['1']==='wx_status')['0'];
const roots=all.filter(n=>[80029,80028,80049].includes(n.d0));
function visible(status){const ids=[];function visit(n){if(n.o1){assert.equal(n.o1['0'],statusID);const yes=status.includes(n.o1['2']);if(n.o1['1']===2?!yes:yes)return;}if(Array.isArray(n['1']))n['1'].forEach(visit);else ids.push(n.d0);}roots.forEach(visit);return ids;}
const expected={sun:[7002],moon:[7009],partly:[7302,7303,7053,7001],night_cloud:[7010,79001,79002,7011],cloud:[7003],light_rain:[76800,77102],heavy_rain:[76801,77202],snow:[7012,7013,7014,7015],storm:[79101,79102,79201,79202,7006],fog:[79401,79403,7007],wind:[7008]};
for(const code of [0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,97,99,null,999])for(const day of [0,1])for(const wind of [0,30,39.9,40,100]){
  const current=condition(code,day,wind),json=widgyData({current});
  assert.deepEqual(visible(json.icon_status),expected[current.icon]||[],`Code ${code}, day ${day}, wind ${wind}`);
}
const urls=[];for(const id of [6121,6124,6131,6132,6133,6134])urls.push(all.find(n=>n.d0===id)['66'][0]['18']);
for(const name of ['wx_status','wx_wind_speed'])urls.push(w['36'].find(v=>v['1']===name)['3']['66'][0]['18']);
assert.equal(new Set(urls).size,1);assert(urls[0].includes('&v=12&'));assert(urls[0].endsWith('&format=json'));
assert.equal(new Set(all.map(n=>n.d0)).size,all.length);
assert(!w['36'].some(v=>v['1']==='health_move_goal'));
assert(!('31' in all.find(n=>n.d0===85037)),'Removed ring JavaScript stays removed');
console.log('PASS: all weather sources unified; 320 condition cases agree; geometry, Health, navigation and private data unchanged.');
