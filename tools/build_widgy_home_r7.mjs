import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const r6=JSON.parse(read('./Widgy_Home_Glass_JS_City_R6.json'));
const widget=structuredClone(r6);
const nodes=widget['1'].find(n=>n.d0===245)['1'];
const clock=nodes.find(n=>n.d0===6110);
assert.equal(clock['1'],'System Light');
assert.equal(nodes.find(n=>n.d0===6104)['1'],'Phenomena-Regular');
assert.deepEqual(clock['66'],[{'5':'Date And Time','6':'Live Timer (24 hours, No Seconds)'}]);
clock['1']='Phenomena-Regular';
const restored=structuredClone(widget);
restored['1'].find(n=>n.d0===245)['1'].find(n=>n.d0===6110)['1']='System Light';
assert.deepEqual(restored,r6,'Only the clock font may change');
widget['3']='Widgy Home Glass JS City R7';
widget['4']='R7: live HH:mm clock uses the already verified Phenomena-Regular font, matching the header month. Clock position, size, source and all other R6 layers, atlas, fonts, live variables and dynamic 10,000-step ring retained. Calendar content remains demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R7.json',import.meta.url),JSON.stringify(widget));
const page=read('./widgy-home-js-city-r6.html')
 .replaceAll('JS City R6','JS City R7').replaceAll('JS_City_R6','JS_City_R7')
 .replace('ספרת התאריך עובה עוד באותו גופן שעובד ב־R5. קווי האטלס סביב היבשות חוזקו בעדינות כדי שייראו טוב יותר בגודל הווידג׳ט. התאריך נשאר ממורכז ומתעדכן בכל יום, וטבעת הצעדים נשארת דינמית עם יעד 10,000.','השעון משתמש כעת בגופן Phenomena Regular שכבר מופיע בשם החודש, כדי להשתלב בשפה העיצובית של הווידג׳ט. השעון החי נשאר בפורמט HH:mm.');
assert(page.includes('Widgy_Home_Glass_JS_City_R7.json'));
writeFileSync(new URL('./widgy-home-js-city-r7.html',import.meta.url),page);
console.log('R7 built and verified: only Hero Time font changed; live no-seconds clock, atlas and 10,000-step ring are unchanged.');
