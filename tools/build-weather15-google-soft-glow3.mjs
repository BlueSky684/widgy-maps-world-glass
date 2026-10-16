// Restore a little breathing room between Home's weather icon and live text.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {widgetLayers} from './weather15-location-split.js';
import {formatJSONLines} from './json-copy-lines.js';

const [input,output]=process.argv.slice(2);
assert(input&&output,'Supply Google Soft Glow 2 and a private output directory');
const root=fileURLToPath(new URL('../',import.meta.url)),privateDir=resolve(output);
assert(relative(root,privateDir).startsWith('../'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const beforeBytes=readFileSync(input);
assert.equal(sha(beforeBytes),'e6cdf6272f23d50cb2220353f466b9c76e80e970a4499728e46ae08909bfb11f');
const before=JSON.parse(beforeBytes),widget=structuredClone(before),layers=[...widgetLayers(widget)];
assert.equal(layers.length,1204);assert.equal(widget['36'].length,74);
mkdirSync(privateDir,{recursive:true,mode:0o700});
const changes=[],dx=6*1600/1135;
for(const id of [6131,6132]){
  const n=layers.find(n=>n.d0===id);
  assert.equal(n.z,'1');assert.equal(n.b.a.length,1);assert.equal(n.b.a[0].a,283.348018);
  const old=structuredClone(n.b);
  n.b.a[0].a=Math.round((n.b.a[0].a+dx)*1e6)/1e6;
  changes.push({id,name:n.s,before:old,after:structuredClone(n.b)});
}
widget['3']='Widgy Weather 15 - Google Soft Glow 3';
const reversed=structuredClone(widget),reversedLayers=[...widgetLayers(reversed)];reversed['3']=before['3'];
for(const c of changes)reversedLayers.find(n=>n.d0===c.id).b=c.before;
assert.deepEqual(reversed,before,'Only the display name and two Home text X positions may change');
const raw=Buffer.from(JSON.stringify(widget));assert.deepEqual(JSON.parse(formatJSONLines(raw.toString())),widget);
const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('widgy-weather15-google-soft-glow3:v1:20261016');
const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);
const ciphertext=Buffer.concat([cipher.update(gzipSync(raw)),cipher.final(),cipher.getAuthTag()]);
const envelope={v:1,iv:iv.toString('base64url'),data:ciphertext.toString('base64url'),bytes:raw.length,sha256:sha(raw)};
const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad);decipher.setAuthTag(ciphertext.subarray(-16));
assert(gunzipSync(Buffer.concat([decipher.update(ciphertext.subarray(0,-16)),decipher.final()])).equals(raw));
const origin='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
writeFileSync(resolve(privateDir,'Widgy_Weather_15_Google_Soft_Glow_3.json'),raw,{mode:0o600});
writeFileSync(resolve(privateDir,'copy-key.txt'),key.toString('base64url'),{mode:0o600});
writeFileSync(resolve(privateDir,'copy-url.txt'),origin+'/tools/widgy-weather15-google-soft-glow3-copy.html#key='+key.toString('base64url'),{mode:0o600});
writeFileSync(new URL('./widgy-weather15-google-soft-glow3.enc.json',import.meta.url),JSON.stringify(envelope)+'\n');
const report={sourceSHA256:sha(beforeBytes),textOffsetDesignPixels:{x:6,y:0},changedLayerIDs:[6131,6132],leftEdgeDesignPixels:{before:201,after:207},rightGapToDividerDesignPixels:{temperature:{before:34,after:28},condition:{before:24,after:18}},iconAndCardGeometryIdentical:true,allOtherWidgetFieldsIdentical:true,layers:1204,variables:74,encryptionRoundTripExact:true,bytes:raw.length,sha256:sha(raw),nativeVisualReviewPending:true};
writeFileSync(new URL('./weather15-google-soft-glow3-verification-20261016.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
