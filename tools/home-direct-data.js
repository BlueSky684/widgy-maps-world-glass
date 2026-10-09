import assert from 'node:assert/strict';
import {flatten,inlineSingleTextSources,variableReferences} from './compact-widget-structure.js';

export const HOME_DIRECT_FIELDS=['steps_label','calendar_home_count','calendar_home_event_word','calendar_home_title','calendar_home_meta'];
export const HOME_SINGLE_WEATHER_GROUPS=[80000,80014,80024,80037];
const GREETINGS=[[6102,'MORNING'],[80103,'AFTERNOON'],[80104,'EVENING'],[80105,'NIGHT']];
const copy=x=>structuredClone(x);
const numericFrame=(n,k)=>{
  assert(n[k]?.b===0 && n[k].a?.length===1 && n[k].a[0].c===0);
  assert.equal(typeof n[k].a[0].a,'number');return n[k].a[0].a;
};

// Only the Home presentation path changes. Native providers and source objects
// are preserved; there is no new API, JavaScript classifier or cache policy.
export function withHomeDirectData(input){
  assert.equal(input['3'],'Widgy Home Calendar Lighter Runtime 2');
  assert.equal(flatten(input['1']).length,1194);assert.equal(input['36'].length,67);
  const w=copy(input),home=w['1'].find(n=>n.d0===245 && n.s==='HOME');assert(home);
  const originalHomeIDs=new Set(flatten(home['1']).map(n=>n.d0));
  const inlined=inlineSingleTextSources(w,v=>HOME_DIRECT_FIELDS.includes(v['1']));
  assert.deepEqual(inlined.map(c=>c.name),HOME_DIRECT_FIELDS);
  assert(inlined.every(c=>originalHomeIDs.has(c.layer)));

  // All four greetings have the same frame/style and a single shared source.
  // Move that exact clock-only script to one original text layer, eliminating
  // a global variable and the four mutually exclusive visibility decisions.
  const greeting=w['36'].find(v=>v['1']==='day_greeting');assert(greeting);
  assert.equal(greeting['2'],0);
  assert.deepEqual(Object.keys(greeting['3']).sort(),['66','d','e','s','z']);
  assert.equal(greeting['3']['66'].length,1);
  assert.equal(greeting['3']['66'][0]['5'],'Javascript');
  assert.equal(greeting['3']['66'][0]['6'],'Script');
  const ids=new Set(GREETINGS.map(([id])=>id));
  const whole=copy(w);whole['36']=whole['36'].filter(v=>v!==greeting && v['1']!=='day_greeting');
  whole['1'].find(n=>n.d0===245)['1']=home['1'].filter(n=>!ids.has(n.d0));
  assert.equal(variableReferences(whole,[greeting]).size,0,'Greeting has no other consumers');
  const nodes=GREETINGS.map(([id,label])=>{
    const n=home['1'].find(n=>n.d0===id);assert(n);
    assert.deepEqual(n.o1,{'0':greeting['0'],'1':0,'2':label});
    assert.deepEqual(n['66'],[{'5':'Custom Text','6':'Text','25':label}]);
    return n;
  });
  const appearance=n=>Object.fromEntries(Object.entries(n).filter(([k])=>!['d0','s','66','o1'].includes(k)));
  for(const n of nodes)assert.deepEqual(appearance(n),appearance(nodes[0]));
  const first=home['1'].indexOf(nodes[0]);assert(nodes.every((n,i)=>home['1'][first+i]===n));
  const combined=copy(nodes[0]);combined.s='Greeting Lime · Direct clock data';
  combined['66']=copy(greeting['3']['66']);delete combined.o1;
  home['1'].splice(first,4,combined);w['36']=w['36'].filter(v=>v['1']!=='day_greeting');

  // These four single-symbol groups have only automatic bounding geometry
  // and a visibility predicate. Move that identical predicate onto the symbol.
  // Preserve every ancestor predicate, drawing order and absolute leaf frame.
  const targets=new Set(flatten(w['1']).flatMap(n=>n['1a']?.startsWith('button_')?n['1a'].slice(7).split(/[-,]/).map(Number):[]));
  const unwrapped=[];
  function simplify(ns){
    for(let i=0;i<ns.length;i++){
      const g=ns[i];if(g.z!=='13')continue;
      if(!HOME_SINGLE_WEATHER_GROUPS.includes(g.d0)){simplify(g['1']);continue;}
      assert.deepEqual(Object.keys(g).sort(),['1','b','c','d','d0','e','o1','s','z']);
      assert(!targets.has(g.d0));assert.equal(g['1'].length,1);
      const n=g['1'][0];assert.equal(n.z,'4');assert(!n.o1);
      for(const k of ['b','c','d','e'])assert(Math.abs(numericFrame(g,k)-numericFrame(n,k))<1e-9,'Only exact leaf bounds may be removed');
      n.o1=copy(g.o1);ns[i]=n;unwrapped.push({group:g.d0,leaf:n.d0});
    }
  }
  simplify(home['1']);assert.deepEqual(unwrapped.map(c=>c.group),HOME_SINGLE_WEATHER_GROUPS);
  w['3']='Widgy Home Direct Data 1';
  w['4']='Full Runtime 2 widget with shorter Home data paths: five single-use source objects moved directly to their original text layers; one direct greeting replaces four conditional copies; four single-symbol weather wrappers removed with exact predicates retained. Same native steps, health, weather, sunrise/sunset, live time and day gauge. Same map/GPS/city and complete Calendar including repaired month arrows. No tap dots. Native transition speed remains unmeasured. Keep Runtime 2 as backup.';
  return {widget:w,report:{baseline:input['3'],before:{nodes:1194,variables:67,homeDescendants:124,weatherGroups:41},after:{nodes:flatten(w['1']).length,variables:w['36'].length,homeDescendants:flatten(home['1']).length,weatherGroups:flatten(home['1']).filter(n=>n.z==='13').length},inlined,greeting:{kept:6102,removed:[80103,80104,80105],globalVariableRemoved:'day_greeting'},unwrapped,nativeLatencyMeasured:false}};
}
