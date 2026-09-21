import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const source=JSON.parse(read('widgy-native-visibility-source.json'));
const before=JSON.parse(read('widgy-v106.json'));
const data=structuredClone(before);
const layers=data['1'][0]['1'];
const groups=layers.filter(l=>l.d0>=80000&&l.d0<=80010);
assert.equal(groups.length,11);
assert.equal(source.variable['2'],0); // String, confirmed by the native export.
assert.deepEqual(source.variable['3']['66'],[{'5':'Weather (Now)','6':'Status (Full)'}]);
assert.equal(source.condition['0'],source.variable['0']);
assert.equal(source.condition['1'],0); // Equals, confirmed by the native export.
assert.equal(source.condition['2'],'Partly Cloudy Night');

const variable=structuredClone(source.variable);
variable['1']='wx_status';
variable['3'].s='Variable: wx_status';
data['36']=[variable];
for(const group of groups){
  group.a=false;
  if(group.d0===source.groupId){
    delete group.a;
    group.o1=structuredClone(source.condition);
  }
}

// The binding is on the whole icon group; all approved children, masks,
// optical sizes, colors and contours remain byte-for-byte equivalent as JSON.
for(const group of groups){
  const original=before['1'][0]['1'].find(l=>l.d0===group.d0);
  assert.deepEqual(group['1'],original['1']);
}
const restored=structuredClone(data);
if('36' in before)restored['36']=before['36'];else delete restored['36'];
for(const group of restored['1'][0]['1']){
  const original=before['1'][0]['1'].find(l=>l.d0===group.d0);
  if(group.d0>=80000&&group.d0<=80010){
    delete group.o1;
    if('a' in original)group.a=original.a;else delete group.a;
  }
}
assert.deepEqual(restored,before);
assert.equal(groups.filter(g=>g.a!==false).length,1);
assert.equal(groups.filter(g=>g.o1).length,1);
assert.equal(groups.find(g=>g.d0===80000)['1'][0]['3'],'sun.max.fill');
assert(!JSON.stringify(data).includes('wx_clear_day'));

data['3']='Widgy Home v107 - Weather Visibility Test';
data['4']='Native visibility test using the verified user-exported Equals condition. wx_status is a String sourced only from Weather (Now) > Status (Full). WX Partly Cloudy Night is visible only when that value is Partly Cloudy Night. The other ten approved native icons are retained but hidden and not yet bound. This is not a complete automatic weather selector: in other weather states the icon area will be empty. All icon artwork and other Home layers are preserved from v106. Runtime show/hide verification on the device is still required.';
const payload=JSON.stringify(data);
const packed=gzipSync(Buffer.from(payload)).toString('base64');
const hash=createHash('sha256').update(payload).digest('hex');
assert.equal(gunzipSync(Buffer.from(packed,'base64')).toString(),payload);
write('widgy-v107.json',payload);
let html=read('widgy-v106.html').replaceAll('v106','v107')
  .replace('הכנת חיבור מזג האוויר','בדיקת נראות לפי מזג האוויר')
  .replace('קובץ הכנה: המעבר האוטומטי בין האייקונים טרם חובר.','גרסת בדיקה: אייקון הלילה המעונן חלקית מחובר ל־wx_status. יתר המצבים טרם חוברו; במצב אחר אזור האייקון יהיה ריק.')
  .replace(/const packed=\[[\s\S]*?\]\.join\(''\);/,`const packed=['${packed}'].join('');`)
  .replace(/const expectedHash='[^']+';/,`const expectedHash='${hash}';`)
  .replace(/packed.length!==\d+/,`packed.length!==${packed.length}`)
  .replace(/text.length!==\d+/,`text.length!==${payload.length}`);
write('widgy-v107.html',html);
const report={
  status:'limited-native-visibility-test',
  source:'v106 approved native artwork and user-exported visibility condition',
  variable:{name:variable['1'],id:variable['0'],type:'String',data:'Weather (Now) / Status (Full)'},
  boundGroups:[{id:source.groupId,name:'WX · Partly Cloudy Night',operator:'Equals',value:source.condition['2']}],
  pendingGroups:groups.filter(g=>!g.o1).map(g=>({id:g.d0,name:g.s})),
  verification:{artworkAndOtherLayersUnchanged:true,stockSunRestored:true,exactPayloadIntegrity:true,deviceFalseConditionTest:false,completeWeatherCoverage:false},
  research:{officialTranslations:'https://github.com/duke4e/widgyTranslations/blob/main/en.xliff',finding:'Basic status names are documented, but the complete Status (Full) output mapping has not been verified. No speculative names or comparator enums are encoded.'},
  payloadLength:payload.length,sha256:hash
};
write('widgy-v107-integration.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,boundGroups:1,pendingGroups:10,payloadLength:payload.length,sha256:hash}));
