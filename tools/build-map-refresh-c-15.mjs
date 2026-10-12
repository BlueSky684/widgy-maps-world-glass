// Isolate changing native image URLs using A's exact completed PNG.
// Full personal exports and the decryption key stay private.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';

const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
const imagePath='/assets/diagnostics/map-host-ab-15/snapshot.png';
const digest=b=>createHash('sha256').update(b).digest('hex');
const walk=ns=>ns.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const variable=(w,name)=>w['36'].find(v=>v['1']===name);
const urlSource=w=>variable(w,'map_request')['3']['66'][0];
const aBytes=fs.readFileSync('work/private/Map_Host_A.json');
const a=JSON.parse(aBytes);
const daily=JSON.parse(fs.readFileSync('work/private/Widgy_Health_Premium_1.json'));
const key=Buffer.from(JSON.parse(fs.readFileSync('work/private/map-host-ab-15-key.json')).key,'base64url');
const decrypt=e=>{
 const data=Buffer.from(e.data,'base64url'),dec=createDecipheriv('aes-256-gcm',key,Buffer.from(e.iv,'base64url'));
 dec.setAAD(Buffer.from(`map-host-ab-15:${e.name}:v1`));dec.setAuthTag(data.subarray(-16));
 return gunzipSync(Buffer.concat([dec.update(data.subarray(0,-16)),dec.final()]));
};
assert(decrypt(JSON.parse(fs.readFileSync('tools/map-host-ab-15-A.enc.json'))).equals(aBytes),'Private A must match published envelope');
assert.equal(a['3'],'A');assert.equal(daily['3'],'Widgy Weather 15');
assert.equal(urlSource(a)['5'],'Custom Text');assert.equal(urlSource(a)['25'],origin+imagePath);
assert.equal(digest(fs.readFileSync('.'+imagePath)),'ac1a690089d666cd65c2f5b49784dd0781c2ee1b8cacd5e36bf1fa1fcfdc93fb');
for(const name of ['map_latitude_max5','map_longitude_max5','calendar_refresh_minute'])
 assert(isDeepStrictEqual(variable(a,name),variable(daily,name)),`Native dependency changed: ${name}`);
const dailyURL=new URL(urlSource(daily)['25']);
const query=['lat','lon','t'].map((name,i)=>{
 const value=dailyURL.searchParams.get(name);
 assert.equal(value,['${widgy.map_latitude_max5}','${widgy.map_longitude_max5}','${widgy.calendar_refresh_minute}'][i]);
 return name+'='+value;
}).join('&');
const c=structuredClone(a);
c['3']='C';
c['4']='Weather 15 map refresh test C. Same fixed Ashdod example PNG as A; native location/minute values change the request URL only. Map pixels, daylight and marker stay fixed. Diagnostic copy, not a repair.';
urlSource(c)['25']=origin+imagePath+'?'+query;
const restored=structuredClone(c);restored['3']=a['3'];restored['4']=a['4'];urlSource(restored)['25']=urlSource(a)['25'];
assert(isDeepStrictEqual(restored,a),'Unexpected change beyond C metadata and map URL');
const image=walk(c['1']).find(n=>n.d0===6170);
assert.equal(image['1'],'Web URL');assert.equal(image['2'],'${widgy.map_request}');
assert(!urlSource(c)['25'].includes('location_key'),'Static image URL must not contain a service credential');
const bytes=Buffer.from(JSON.stringify(c));
const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
cipher.setAAD(Buffer.from('map-host-ab-15:C:v1'));
const data=Buffer.concat([cipher.update(gzipSync(bytes,{level:9})),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,name:'C',iv:iv.toString('base64url'),data:data.toString('base64url'),bytes:bytes.length,sha256:digest(bytes)};
assert(decrypt(envelope).equals(bytes),'Encrypted C roundtrip');
fs.writeFileSync('work/private/Map_Refresh_C.json',bytes,{mode:0o600});
fs.writeFileSync('tools/map-host-ab-15-C.enc.json',JSON.stringify(envelope)+'\n');
fs.writeFileSync('work/private/map-refresh-c-15-link.txt',origin+'/tools/map-refresh-c-15.html#key='+key.toString('base64url')+'\n',{mode:0o600});
console.log(JSON.stringify({name:'C',bytes:bytes.length,sha256:envelope.sha256,layers:walk(c['1']).length,baselineASHA256:digest(aBytes),changes:['name','description','map_request URL']}));
