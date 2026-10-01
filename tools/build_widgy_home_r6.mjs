import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const r5=JSON.parse(read('./Widgy_Home_Glass_JS_City_R5.json'));
const widget=structuredClone(r5);
const home=widget['1'].find(n=>n.d0===245);
const day=home['1'].find(n=>n.d0===6105);
const weights=home['1'].filter(n=>n.s==='Header Day · Weight');
assert.equal(day['1'],'Phenomena-Bold');
assert.equal(weights.length,2);

// IMG_9661 confirms the R5 font and live layout on the phone. The numeral's
// vertical stroke is still only ~10px wide. Move its two existing native
// weight copies symmetrically from +/-0.75px to +/-2.75px: ~4px more width,
// while preserving the same native font, center, height and daily date source.
for(const [i,offset]of [-2.75,2.75].entries()){
 const n=weights[i];
 n.b.a[0].a=Math.round((day.b.a[0].a+offset/1135*1600)*1e6)/1e6;
 assert.deepEqual(n['66'],day['66']);
 assert.deepEqual(n.c,day.c);
 assert.deepEqual(n.e,day.e);
}

// Verify the complete widget remains exactly R5 apart from these two offsets
// and release metadata. This includes all live values and the 10,000-step ring.
const restored=structuredClone(widget);
const restoredWeights=restored['1'].find(n=>n.d0===245)['1'].filter(n=>n.s==='Header Day · Weight');
const originals=r5['1'].find(n=>n.d0===245)['1'].filter(n=>n.s==='Header Day · Weight');
restoredWeights.forEach((n,i)=>n.b=structuredClone(originals[i].b));
assert.deepEqual(restored,r5);

const mapScript=widget['36'].find(v=>v['1']==='map_request')['3']['66'][0];
const mapURL='?mode=live&width=3306&presentation=glass';
assert.equal(mapScript['10'].split(mapURL).length,2);
mapScript['10']=mapScript['10'].replace(mapURL,mapURL+'&atlas=r6');

widget['3']='Widgy Home Glass JS City R6';
widget['4']='R6: stronger native Phenomena Bold date numeral, with symmetric offsets +/-2.75px. Atlas line strength +20% and width +15% through the opt-in atlas=r6 map style. Same coast geometry, terrain, lights and full-resolution lossless PNG. R5 fonts, live date, alignment, dynamic 10,000-step ring, weather and actions retained. Calendar content remains demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R6.json',import.meta.url),JSON.stringify(widget));

const oldIntro='חזרה לגופנים שעבדו, DAY PROGRESS בשורה אחת ובחישוב מחצות עד חצות, מרכוז התאריך ושעות הזריחה והשקיעה, ומרווח נוסף ליד הטמפרטורה. הטבעת הדקה והיעד היומי נשמרו.';
const page=read('./widgy-home-js-city-r5.html')
 .replaceAll('JS City R5','JS City R6').replaceAll('JS_City_R5','JS_City_R6')
 .replace(oldIntro,'ספרת התאריך עובה עוד באותו גופן שעובד ב־R5. קווי האטלס סביב היבשות חוזקו בעדינות כדי שייראו טוב יותר בגודל הווידג׳ט. התאריך נשאר ממורכז ומתעדכן בכל יום, וטבעת הצעדים נשארת דינמית עם יעד 10,000.')
 .replace('משתמש בגופנים המקוריים של R3.','משתמש בגופנים שעובדים ב־R5.');
assert(!page.includes('JS City R5'));
assert(page.includes('Widgy_Home_Glass_JS_City_R6.json'));
writeFileSync(new URL('./widgy-home-js-city-r6.html',import.meta.url),page);
console.log('Built R6: stronger centered native date and opt-in atlas lines; R5 fonts and 10,000-step ring retained.');
