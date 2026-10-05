import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {personalizedWidget} from './calendar-connect-widget.js';
import {consolidateWidget} from './widget-consolidation.js';
import {compactCalendarDots} from './calendar-compact-dots.js';
import {thinNativeStepsRing} from './native-steps-ring.js';
import {withMapMinimalPair} from './map-minimal-pair.js';
import {withNavigationOnly} from './navigation-only.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const normal=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const full=thinNativeStepsRing(compactCalendarDots(consolidateWidget(normal)));
const before=structuredClone(full),control=withMapMinimalPair(full),result=withNavigationOnly(full);
assert.deepEqual(full,before);
const expected=structuredClone(control);
expected['1'][0]['1']=expected['1'][0]['1'].filter(n=>n.d0!==6170);
expected['36']=[];expected['3']=result['3'];expected['4']=result['4'];
assert.deepEqual(result,expected,'Only image, map definitions and metadata differ');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const nodes=walk(result['1']),ids=new Set(nodes.map(n=>n.d0));
assert.equal(nodes.length,20);assert.equal(ids.size,20);
assert.equal(result['36'].length,0);
assert.equal(nodes.filter(n=>n.z==='5').length,0);
assert.equal(nodes.filter(n=>n.z==='11').length,4);
assert(!JSON.stringify(result).includes('${widgy.'));
assert(!JSON.stringify(result).includes('/api/'));
assert(!JSON.stringify(result).includes('token='));
for(const v of control['36'])assert(!JSON.stringify(result).toLowerCase().includes(v['0'].toLowerCase()));
const sourceKinds=[];
function sources(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value['66']))sourceKinds.push(...value['66'].map(s=>s['5']+'/'+s['6']));
  Object.values(value).forEach(sources);
}
sources(result);
assert.deepEqual(sourceKinds,Array(5).fill('Custom Text/Text'));
// Exported visibility semantics only. This does not simulate Widgy's runtime.
const visibility=new Map(result['1'].map(n=>[n.d0,n.a!==false]));
assert.deepEqual([...visibility.values()],[true,false]);
for(let i=0;i<3;i++)for(const [tapId,visibleId] of [[5022,247],[80315,247],[80314,245],[5021,245]]){
  const action=nodes.find(n=>n.d0===tapId)['1a'];
  const [show,hide]=action.slice(7).split('-');
  for(const [part,enabled] of [[show,true],[hide,false]])for(const value of part.split(',')){
    const id=Number(value);assert(ids.has(id));assert(visibility.has(id));visibility.set(id,enabled);
  }
  assert.equal(visibility.get(visibleId),true);
  assert.equal([...visibility.values()].filter(Boolean).length,1);
}

// Exercise real import controller with PUBLIC template fetch only, no account
// session, location, geocoder or private-calendar request. No network is used.
const html=readFileSync(new URL('./widgy-navigation-only.html',import.meta.url),'utf8');
const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],
  {events:{},classList:{toggle(){}},addEventListener(name,fn){this.events[name]=fn;},removeAttribute(name){delete this[name];}}]));
const events={},requests=[];let downloaded,copied,fail=false,revoked=0;
class BrowserURL extends URL{
  static createObjectURL(blob){downloaded=blob;return 'blob:synthetic';}
  static revokeObjectURL(){revoked++;}
}
const ctx={document:{getElementById:id=>{assert(elements[id],id);return elements[id];}},Blob,URL:BrowserURL,
  personalizedWidget,consolidateWidget,compactCalendarDots,thinNativeStepsRing,withNavigationOnly,
  navigator:{clipboard:{async writeText(value){copied=value;}}},
  window:{location:{href:'https://example.test/tools/widgy-navigation-only.html'},addEventListener(name,fn){events[name]=fn;}},
  async fetch(url,options){requests.push([url,options]);return {ok:!fail,async json(){return structuredClone(template);}};}};
vm.runInNewContext(readFileSync(new URL('./widgy-navigation-only.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''),ctx);
await new Promise(setImmediate);
assert.equal(elements.copy.disabled,false);assert.deepEqual(JSON.parse(await downloaded.text()),result);
await elements.copy.events.click();assert.deepEqual(JSON.parse(copied),result);
fail=true;await elements.retry.events.click();assert.equal(elements.copy.disabled,true);
assert.equal(elements.download.hidden,true);assert.equal(elements.download.href,undefined);
copied='';await elements.copy.events.click();assert.equal(copied,'');
fail=false;events.pageshow({persisted:true});await new Promise(setImmediate);assert.equal(elements.copy.disabled,false);
ctx.navigator.clipboard.writeText=async()=>{throw Error('blocked');};
await elements.copy.events.click();assert.equal(elements.download.hidden,false);
assert.equal(requests.length,3);assert.equal(revoked,1);
for(const [url,options] of requests){
  assert.equal(url,'./Widgy_Home_Glass_Calendar_C16.json');assert.equal(options.cache,'no-store');
  assert(!options.method || options.method==='GET');
}
assert(html.includes('widgy-navigation-only.js?v=navigation-only-1'));
assert(html.includes('Widgy_Navigation_Only_1.json'));
assert(html.includes('./widgy-home-sync-map-lean.html?v=home-sync-map-lean-1'));
console.log('PASS: only the map image and five definitions removed; 20 layers, zero variables/images/scripts/location/calendar sources; every remaining field exact; three navigation cycles and public-only copy/download/failure/retry paths pass. Native transition behavior remains device-unmeasured.');
