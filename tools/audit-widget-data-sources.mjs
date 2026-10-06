// Inspect the generated normal export using inert URLs. Never read a private export.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {personalizedWidget} from './calendar-connect-widget.js';

const template = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const widget = personalizedWidget(template,
  'https://example.test/api/calendar-dots?token=synthetic',
  'https://example.test/api/calendar-widget?token=synthetic');
const variables = widget['36'], byName = new Map(variables.map(v=>[v['1'],v]));
const flatten = nodes => nodes.flatMap(n=>[n,...(n.z==='13'?flatten(n['1']):[])]);
const references = value => {
  const text = JSON.stringify(value);
  return variables.filter(v=>text.includes('${widgy.'+v['1']+'}') ||
    text.toLowerCase().includes(v['0'].toLowerCase())).map(v=>v['1']);
};
function closure(names, seen=new Set()) {
  for (const name of names) if (!seen.has(name)) {
    seen.add(name); closure(references(byName.get(name)['3']),seen);
  }
  return [...seen].sort();
}
function bindings(value, out=[]) {
  if (!value || typeof value!=='object') return out;
  if (Array.isArray(value['66'])) for (const source of value['66']) {
    if (typeof source['5']==='string' && typeof source['6']==='string')
      out.push({provider:source['5'], field:source['6']});
  }
  for (const child of Object.values(value)) if (child && typeof child==='object') bindings(child,out);
  return out;
}
function groupBindings(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key=JSON.stringify(row);
    if (!grouped.has(key)) grouped.set(key,{...row,bindings:0});
    grouped.get(key).bindings++;
  }
  return [...grouped.values()].sort((a,b)=>(a.provider+a.field).localeCompare(b.provider+b.field));
}
const tabs=widget['1'].map(tab=>{
  const used=closure(references(tab)), nodes=flatten([tab]);
  return {tab:tab.s, nodes:nodes.length-1,
    placeholder:nodes.some(n=>n.s==='Placeholder'), variables:used,
    sources:groupBindings([...bindings(tab),...used.flatMap(name=>bindings(byName.get(name)['3']))])};
});
assert.deepEqual(tabs.map(t=>t.tab),['HOME','CALENDAR','WEATHER','FITNESS']);
assert(tabs[0].sources.some(s=>s.provider==='Pedometer' && s.field==='Steps'));
assert(tabs[0].sources.some(s=>s.provider==='Health (Daily)' && s.field==='Active Energy Burned'));
assert(tabs[0].sources.some(s=>s.provider==='Weather (Now)'));
assert(tabs[2].placeholder && tabs[3].placeholder);
const jsonSources=variables.flatMap(v=>v['3']['66']||[]).filter(s=>s['5']==='JSON Endpoint');
const rawImages=tabs.map(tab=>({tab:tab.tab, count:flatten([widget['1'].find(t=>t.s===tab.tab)]).filter(n=>n.z==='5').length}));
console.log(JSON.stringify({schema:1,kind:'synthetic-normal-export-source-inventory',
  baseline:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tabs,rawImages,
  calendarJSON:{bindings:jsonSources.length,uniqueURLs:new Set(jsonSources.map(s=>s['18'])).size},
  limits:[
    'Binding and image counts are definitions, not measured HTTP requests, active drawings or render time.',
    'Variable closure conservatively follows both interpolation and native variable identifiers.',
    'Weather and fitness tab shells do not represent their future source counts.',
    'Native Weather, Pedometer and Health providers are not served by our map/calendar API.',
    'No owner credentials, location, health data or calendar events are read.'
  ]},null,2));
