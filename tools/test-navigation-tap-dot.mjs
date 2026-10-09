import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flatten} from './compact-widget-structure.js';
import {withNavigationTapDots,DOT_IDS} from './navigation-tap-dot.js';

for (const path of process.argv.slice(2)) {
 const source=JSON.parse(readFileSync(path)), before=structuredClone(source);
 const widget=withNavigationTapDots(source,'Tap dot test');
 assert.deepEqual(source,before);
 const ns=flatten(widget['1']), original=new Map(flatten(source['1']).map(n=>[n.d0,n]));
 assert.equal(new Set(ns.map(n=>n.d0)).size,ns.length);
 assert.equal(ns.length,original.size+2);
 assert.deepEqual(widget['1'].slice(0,2).map(n=>n.d0),DOT_IDS);
 assert(widget['1'].slice(0,2).every(n=>n.a===false && n.z==='4' && n['3']==='circle.fill'));
 let actions=0;
 for (const n of ns) {
  if (n.z!=='11' || !n['1a']?.startsWith('button_')) continue;
  const [show,hide]=n['1a'].slice(7).split('-').map(s=>s.split(',').map(Number));
  for(const id of [...show,...hide]) assert(ns.some(x=>x.d0===id),'Unknown navigation target');
  assert.equal(new Set(show).size,show.length); assert.equal(new Set(hide).size,hide.length);
  assert(show.every(id=>!hide.includes(id)));
  if (show.concat(hide).some(id=>DOT_IDS.includes(id))) {
   actions++;
   const home=show.includes(245),calendar=show.includes(247);
   assert.equal(show.includes(DOT_IDS[0]),home);
   assert.equal(show.includes(DOT_IDS[1]),calendar);
   assert.equal(hide.includes(DOT_IDS[0]),!home);
   assert.equal(hide.includes(DOT_IDS[1]),!calendar);
   const stripped=[show,hide].map(a=>a.filter(id=>!DOT_IDS.includes(id)).join(',')).join('-');
   assert.equal('button_'+stripped,original.get(n.d0)['1a']);
   n['1a']=original.get(n.d0)['1a'];
  }
 }
 assert.equal(actions,16);
 widget['1']=widget['1'].filter(n=>!DOT_IDS.includes(n.d0));
 widget['3']=source['3'];widget['4']=source['4'];
 // A full reverse comparison covers all providers, scripts, map URLs, assets,
 // geometry, conditions, fonts, variables and Calendar month navigation.
 assert.deepEqual(widget,source);
 console.log(JSON.stringify({source:source['3'],layers:ns.length,changedNavigationActions:actions,addedNativeSymbols:2,allOtherContentExact:true,immediateTouchFeedback:'unverified'}));
}
