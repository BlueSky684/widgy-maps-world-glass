import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {renderHomeMap} from '../lib/home-map-day-night.js';

const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const hash=b=>createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync('work/private/Widgy_Health_Premium_1.json');
assert.equal(hash(raw),'4af8c286f333f3dcded3891f81ac267bb1711fc080a0923bbc637880cef970e7','Reconcile latest daily copy before building');
const original=JSON.parse(raw),widget=structuredClone(original);
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const map=w=>walk(w['1']).find(n=>n.d0===6170);
assert.equal(map(widget)['1'],'Web URL');assert.equal(map(widget)['2'],'${widgy.map_request}');
const secretsFile='work/private/map-stability-15-secrets.json';
if(!fs.existsSync(secretsFile))fs.writeFileSync(secretsFile,JSON.stringify({key:randomBytes(32).toString('base64url'),read:randomBytes(32).toString('base64url'),control:randomBytes(32).toString('base64url')}),{mode:0o600});
const secrets=JSON.parse(fs.readFileSync(secretsFile));
const fixtures={};fs.mkdirSync('assets/diagnostics/map-stability-15',{recursive:true});
for(const [id,at] of [['a','2026-10-12T04:00:00.000Z'],['b','2026-10-12T16:00:00.000Z']]){
 const path=`assets/diagnostics/map-stability-15/${id}.png`;
 const bytes=await renderHomeMap({date:new Date(at),location:null,width:3306,presentation:'glass',atlas:'r6'});
 const m=await sharp(bytes).metadata();assert.equal(m.width,3306);assert.equal(m.height,1558);assert(bytes.length<4400000);
 fs.writeFileSync(path,bytes);fixtures[id]={at,path,bytes:bytes.length,sha256:hash(bytes)};
}
const config={v:1,origin,readHash:hash(secrets.read),controlHash:hash(secrets.control),fixtures};
fs.writeFileSync('lib/map-stability-config.json',JSON.stringify(config,null,2)+'\n');
const endpoint=origin+'/api/map-stability';
const source=endpoint+'?kind=source&key='+secrets.read;
const initial=endpoint+'?kind=image&key='+secrets.read+'&asset=a&rev=initial&behavior=ok&until=0';
Object.assign(map(widget),{'1':'JSON Endpoint','2':initial,'8':source,'9':'GET','11':{__widgy_auth_prefix:'Bearer',__widgy_auth_header_name:'Authorization'},'13':['image']});
delete map(widget)['3'];
// Keep the definition count identical but remove this unused network dependency.
const request=w=>w['36'].find(v=>v['1']==='map_request')['3']['66'][0];
assert.equal(request(widget)['5'],'Custom Text');request(widget)['25']=source;
widget['3']='Widgy Weather 15 — Stability';
widget['4']='Full Weather 15 stability test. Native Image JSON Endpoint, controlled prepared lossless maps, no live map GPS or live solar time. Other tabs/data and layout unchanged. Faults apply only to this copy and expire after five minutes. Original 15 is preserved.';
const restored=structuredClone(widget);
for(const k of ['1','2','3','8','9','11','13']){delete map(restored)[k];if(Object.hasOwn(map(original),k))map(restored)[k]=map(original)[k];}
request(restored)['25']=request(original)['25'];restored['3']=original['3'];restored['4']=original['4'];
assert.deepEqual(restored,original,'Unexpected change outside map provider, unused map URL and identity');
const widgetBytes=Buffer.from(JSON.stringify(widget));
fs.writeFileSync('work/private/Widgy_Weather_15_Stability.json',widgetBytes,{mode:0o600});
const payload=Buffer.from(JSON.stringify({widget,control:secrets.control,read:secrets.read}));
const key=Buffer.from(secrets.key,'base64url'),iv=randomBytes(12),aad=Buffer.from('map-stability-15:v1');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const encrypted=Buffer.concat([cipher.update(gzipSync(payload,{level:9})),cipher.final(),cipher.getAuthTag()]);
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(encrypted.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(encrypted.subarray(0,-16)),decipher.final()])).equals(payload));
fs.writeFileSync('tools/map-stability-15.enc.json',JSON.stringify({v:1,iv:iv.toString('base64url'),data:encrypted.toString('base64url'),bytes:payload.length,sha256:hash(payload)})+'\n');
fs.writeFileSync('work/private/map-stability-15-link.txt',origin+'/tools/map-stability-15.html#key='+secrets.key+'\n',{mode:0o600});
console.log(JSON.stringify({name:widget['3'],layers:walk(widget['1']).length,variables:widget['36'].length,widgetBytes:widgetBytes.length,widgetSHA:hash(widgetBytes),fixtures,exactRestoration:true}));
