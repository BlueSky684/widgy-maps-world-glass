import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flatten} from './compact-widget-structure.js';

const [baseline,previous,fixed]=process.argv.slice(2).map(p=>JSON.parse(readFileSync(p)));
assert.equal(baseline['3'],'Widgy Shared Home Calendar Cleanup 1');
assert.equal(previous['3'],'Widgy Home Calendar Lighter Runtime 1');
assert.equal(fixed['3'],'Widgy Home Calendar Lighter Runtime 2');
const oldNodes=new Map(flatten(baseline['1']).map(n=>[n.d0,n]));
const previousNodes=new Map(flatten(previous['1']).map(n=>[n.d0,n]));
const restored=structuredClone(fixed),nodes=flatten(restored['1']);
assert.equal(nodes.length,1194);
let arrows=0;
for(const node of nodes){
 if(!/^Calendar · (Previous|Next) Month$/.test(node.s))continue;
 assert.equal(node['1a'],oldNodes.get(node.d0)['1a'],'Exact original native action');
 assert.notEqual(node['1a'],previousNodes.get(node.d0)['1a'],'Faulty minimized action removed');
 const [show,hide]=node['1a'].slice(7).split('-').map(s=>s.split(',').map(Number));
 assert(show.includes(247)&&hide.includes(245),'Explicit Calendar/Home state');
 assert.equal(show.length+hide.length,33);
 node['1a']=previousNodes.get(node.d0)['1a'];arrows++;
}
assert.equal(arrows,48);
for(const key of ['3','4'])restored[key]=previous[key];
assert.deepEqual(restored,previous,'No changes beyond 48 arrows and widget title/description');
console.log(JSON.stringify({pass:true,exactOriginalActions:arrows,otherWidgetContentUnchanged:true,nativePhoneExecution:false}));
