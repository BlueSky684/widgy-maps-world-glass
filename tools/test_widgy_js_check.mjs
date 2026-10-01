import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const widget = JSON.parse(readFileSync(new URL('./Widgy_JavaScript_Check_2.json',import.meta.url)));
const base = JSON.parse(readFileSync(new URL('./Widgy_Home_Glass.json',import.meta.url)));
const layers = widget['1'];
const images = layers.filter(n=>n.z==='5');
const variables = widget['36'];
const sourceCode = n=>n['66']?.find(s=>s['5']==='Javascript')?.['10'];
const scripts = [...layers.map(sourceCode), ...variables.map(v=>sourceCode(v['3'])), ...images.map(n=>n['22'])].filter(Boolean);

// This harness checks our scripts after simulated substitution. It cannot
// emulate Widgy's data scheduler, substitution rules or iOS widget renderer.
function run(code,bindings={},runtime={}) {
  const substituted = code.replace(/\$\{widgy\.([^}]+)\}/g,(_,name)=>String(bindings[name]??''));
  return vm.runInNewContext(substituted+'\nmain();',runtime,{timeout:500});
}
assert.equal(new Set(layers.map(n=>n.d0)).size,layers.length);
assert.equal(new Set(variables.map(v=>v['0'])).size,variables.length);
assert.deepEqual(variables.find(v=>v['1']==='City'),base['36'].find(v=>v['1']==='City'));
assert.equal(images.length,3);
for (const code of scripts) {
  assert.doesNotThrow(()=>run(code));
  assert.doesNotThrow(()=>run(code,{City:'Synthetic City',Latitude:'0',geo_city_js2:'Synthetic City',geo_country_js2:'Synthetic Country',geo_packet_js2:'C<Synthetic City>|K<Synthetic Country>|L<0>'}));
}
const cases = [
  ...images.filter(n=>n['22']).map(n=>({name:n.s,code:n['22']})),
  {name:'B',code:sourceCode(variables.find(v=>v['1']==='geo_url_js2')['3'])},
];
for (const {name,code} of cases) {
  for (const city of ['', 'Synthetic City', "L'Example & Test",'例の都市','${widgy.unresolved}','null','undefined']) {
    const result = run(code,{geo_city_js2:city,geo_packet_js2:`C<${city}>|K<Synthetic Country>|L<0>`});
    const url = new URL(result);
    assert.equal(url.origin,'https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app');
    assert.equal(url.pathname,'/api/binding-probe');
    assert.deepEqual([...url.searchParams.keys()],['case','label','t']);
    assert.equal(url.searchParams.get('label'),['','${widgy.unresolved}','null','undefined'].includes(city)?'Empty':'SyntheticTest',name);
    assert(!url.search.includes('City') && !url.search.includes('Country'));
  }
}
const runtimeCode = sourceCode(layers.find(n=>n.s==='9 Runtime City'));
assert.equal(run(runtimeCode),'NO LIVE OBJECT');
assert.equal(run(runtimeCode,{}, {widgy:{City:'Synthetic City',geo_city_js2:'Alias'}}),'City=[Synthetic City] alias=[Alias]');
const throwing = Object.defineProperty({},'City',{get(){throw new TypeError('test');}});
assert.equal(run(runtimeCode,{}, {widgy:throwing}),'READ ERROR: TypeError');
const namesCode = sourceCode(layers.find(n=>n.s==='11 Runtime names'));
assert.equal(run(namesCode,{}, {widgy:{},geocoding:{},unrelatedSecret:'not displayed'}),'geocoding, widgy');
assert(images.filter(n=>n['22']).every(n=>n['2']===''));
console.log(`PASS: ${scripts.length} scripts compile and run with missing/synthetic inputs; all image requests contain only synthetic flags; runtime probes handle absent/throwing bindings. iOS behavior remains unverified.`);
