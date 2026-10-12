// Static TSX + mocked-API checks. These are NOT an iOS runtime verification.
// MUSIC_TYPESCRIPT_PATH points to a local TypeScript installation.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const ts = require(process.env.MUSIC_TYPESCRIPT_PATH || 'typescript');
const root = path.join(import.meta.dirname, 'scripting');
const compiled = new Map();
for (const file of fs.readdirSync(root).filter(p => /\.tsx?$/.test(p))) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React, jsxFactory: 'createElement'},
  });
  assert.equal(result.diagnostics?.length || 0, 0, `Syntax diagnostics in ${file}`);
  compiled.set(file.replace(/\.tsx?$/, ''), result.outputText);
}

const storage = new Map();
const calls = [];
const registrations = new Map();
let state = 'playing', pro = true, artworkFails = false, playbackFails = false;
let item = {persistentID:'test', title:'Midnight City', artist:'M83', playbackDuration:243};
let rendered;
const sdk = {
  Script: {directory:root, hasFullAccess:() => pro},
  Storage: {get:k=>storage.get(k)??null,set:(k,v)=>storage.set(k,v),remove:k=>storage.delete(k)},
  SystemMusicPlayer: {
    getNowPlayingItem:()=>item, getPlaybackState:()=>state, getCurrentPlaybackTime:()=>84,
    play:async()=>{calls.push('play');if(playbackFails)throw Error('test denied');state='playing'},
    pause:async()=>{calls.push('pause');state='paused'},
    skipToNextItem:async()=>{calls.push('next')},skipToPreviousItem:async()=>{calls.push('previous')},
  },
  MediaLibrary:{getArtwork:async()=>{if(artworkFails)throw Error('test missing cover');return null}},
  Widget:{displaySize:{width:188,height:188},reloadAll:()=>calls.push('reload'),present:v=>{rendered=v}},
  Path:{join:path.join},
  AppIntentProtocol:{AudioPlaybackIntent:1,AppIntent:0},
  AppIntentManager:{register:options=>{
    registrations.set(options.name, options);
    return params=>({name:options.name,protocol:options.protocol,params});
  }},
};
for (const name of ['Button','Capsule','Image','RoundedRectangle','SVG','Text','ZStack']) {
  sdk[name] = props => ({type:name,props});
}
const createElement = (type, props, ...children) => type({...props,children:children.flat().filter(v=>v!=null)});
const cache = new Map();
function load(name) {
  name = name.replace(/^\.\//, '');
  if (cache.has(name)) return cache.get(name);
  const exports = {};
  cache.set(name,exports);
  vm.runInNewContext(compiled.get(name), {
    exports, require:key=>key==='scripting'?sdk:load(key), console:{log(){},error(){}},
    createElement, Date, setTimeout,
  }, {filename:name});
  return exports;
}
const model = load('model');
load('app_intents');
const action = registrations.get('MusicGlassPlaybackM1');
assert.equal(action.protocol,1);
await action.perform('toggle');assert.deepEqual(calls.splice(0),['pause','reload']);
// Even if the old widget showed playing, a now-paused player must receive play.
await action.perform('toggle');assert.deepEqual(calls.splice(0),['play','reload']);
await action.perform('next');assert.deepEqual(calls.splice(0),['next','reload']);
await action.perform('previous');assert.deepEqual(calls.splice(0),['previous','reload']);
state='paused';playbackFails=true;
await action.perform('toggle');assert.deepEqual(calls.splice(0),['play','reload']);
assert.match(storage.get(model.ERROR_KEY).message,/test denied/);
playbackFails=false;await action.perform('toggle');assert.equal(storage.has(model.ERROR_KEY),false);
await registrations.get('MusicGlassRefreshM1').perform();
assert.equal(calls.at(-1),'reload');
artworkFails=true;
const music=await model.readMusic();assert.equal(music.title,'Midnight City');assert.equal(music.blocked,false);assert.equal(music.artwork,null);
pro=false;assert.equal((await model.readMusic()).blocked,true);pro=true;
item=null;assert.equal((await model.readMusic()).hasItem,false);
assert.equal(model.formatTime(NaN),'0:00');assert.equal(model.formatTime(243),'4:03');
const type = load('typography');
assert.equal(type.canOutline('שלום עולם','Regular'),false);
assert.equal(type.linesFor('A very long song title that cannot possibly fit in this small column',32,'Bold',174,3).length,3);
assert.match(type.linesFor('ABCDEFGHIJKLMNOPQRSTUVWXYZ',32,'Bold',174,1)[0],/\.\.\.$/);
item={persistentID:'test',title:'Midnight City',artist:'M83',playbackDuration:243};
artworkFails=false;state='playing';
load('widget');await new Promise(resolve=>setTimeout(resolve,5));
assert(rendered,'Widget did not present');
const children = rendered.props.children;
const buttons=children.filter(c=>c.type==='Button');
assert.equal(buttons.length,4);
assert.deepEqual(buttons.map(c=>c.props.intent.params),['previous','toggle','next',undefined]);
const dump=JSON.stringify(rendered);
assert(!/shortcuts:|openURL|scripting:\/\/run/.test(dump));

if (process.env.MUSIC_QA_DIR) {
  fs.mkdirSync(process.env.MUSIC_QA_DIR,{recursive:true});
  fs.writeFileSync(path.join(process.env.MUSIC_QA_DIR,'view-tree.json'),dump);
}
console.log('PASS: TSX syntax; actual-state toggle; skips; error/retry; missing artwork; PRO/empty state; text fallback; four native intent buttons. iOS runtime remains untested.');
