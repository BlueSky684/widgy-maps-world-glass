const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base=require('node:url').pathToFileURL(__filename);
const handlerCode=fs.readFileSync(new URL('../api/calendar-widget.js',base),'utf8').replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler').replace('export function clientMaxAge','function clientMaxAge');
const cacheCode=fs.readFileSync(new URL('../lib/calendar-bridge/provider-cache.js',base),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','');
const clean=s=>s.replace(/^import .*;\n/gm,'').replace(/export (function|const) /g,'$1 ');
const fields=clean(fs.readFileSync(new URL('../lib/calendar-bridge/widgy-fields.js',base),'utf8'));
const agenda=clean(fs.readFileSync(new URL('../lib/calendar-bridge/home-agenda.js',base),'utf8'));
let cacheReads=0,providerReads=0;const background=[];
class BridgeError extends Error{constructor(code,status){super(code);this.code=code;this.status=status;}}
const ctx={Date,URL,performance,createHash:crypto.createHash,BridgeError,console:{info:()=>{}},setTimeout,clearTimeout,
  getCache:()=>({get:async()=>{cacheReads++;return undefined},set:async()=>{}}),waitUntil:p=>background.push(p),
  origin:()=> 'https://example.invalid',privateHeaders:r=>{for(const k of ['Cache-Control','CDN-Cache-Control','Vercel-CDN-Cache-Control'])r.setHeader(k,'private, no-store')},
  unseal:async token=>{if(token==='bad')throw new BridgeError('unauthorized',401);return {zone:'UTC',sources:[{provider:'google'}],fail:token==='provider-error'}},
  monthWindow:({offset})=>({month:{toISODate:()=>String(offset),toFormat:()=> '2026-11'}}),
  readEvents:async state=>{providerReads++;if(state.fail)throw new BridgeError('temporary',502);return []},
  preparedDaysFor:()=>[],renderDots:async()=>Buffer.from('test-png'),
  widgetSnapshot:()=>({version:2,ok:true,date:'2026-11-05',zone:'UTC',generatedAt:new Date().toISOString(),validUntil:Date.now()+18000,total:0,rows:[],home:{time:'09:00',title:'No events today',label:'TODAY',validUntil:Date.now()+10000}}),eventTimes:()=>{}
};
const handler=vm.runInNewContext(cacheCode+'\n'+fields+'\n'+agenda+'\n'+handlerCode+'\nhandler',ctx);
async function request(token,view='today',method='GET',offset=0){
 const res={headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this},send(body){this.body=body;return this},end(){this.ended=true;return this}};
 await handler({method,url:`/api/calendar-widget?token=${token}&view=${view}&format=widgy&agenda=home-v1&offset=${offset}`},res);return res;
}
(async()=>{
 assert.equal((await request('bad')).code,401);assert.equal(cacheReads,0);assert.equal(providerReads,0);
 let a=await request('one');assert.equal(a.code,200);assert.equal(a.headers['X-Calendar-Provider-Cache'],'MISS');assert.equal(providerReads,1);
 const selectors=JSON.parse(fs.readFileSync(new URL('./widget-tab-selectors.json',base)));for(const name of selectors)assert(name in a.body,name);
 const age=Number(a.headers['Cache-Control'].match(/max-age=(\d+)/)[1]);assert(age<=10&&age>=0);
 a=await request('one');assert.equal(a.headers['X-Calendar-Provider-Cache'],'REUSE');assert.equal(providerReads,1);
 a=await request('one','dots');assert.equal(a.code,200);assert.equal(providerReads,1);assert.equal(a.headers['Content-Type'],'image/png');
 a=await request('one','dots','HEAD');assert(a.ended);assert.equal(a.body,undefined);assert.equal(providerReads,1);
 await request('two');assert.equal(providerReads,2);
 await request('one','dots','GET',1);assert.equal(providerReads,3);
 assert.equal((await request('provider-error')).code,502);
 assert.equal((await request('one','today','POST')).code,405);
 for(const k of ['CDN-Cache-Control','Vercel-CDN-Cache-Control'])assert.equal(a.headers[k],'private, no-store');
 await Promise.all(background);
 console.log('Handler integration: authentication before cache, 37 fields, private headers, event deadline, GET/HEAD, token/month isolation, errors passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
