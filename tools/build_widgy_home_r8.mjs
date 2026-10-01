import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const r6=JSON.parse(read('./Widgy_Home_Glass_JS_City_R6.json'));
const widget=structuredClone(r6);
const nodes=widget['1'].find(n=>n.d0===245)['1'];
const clock=nodes.find(n=>n.d0===6110);
assert.equal(clock['1'],'System Light');
assert.equal(nodes.find(n=>n.d0===6121)['1'],'BarlowCondensed-Light');
assert.deepEqual(clock['66'],[{'5':'Date And Time','6':'Live Timer (24 hours, No Seconds)'}]);
clock['1']='BarlowCondensed-Light';
const restored=structuredClone(widget);
restored['1'].find(n=>n.d0===245)['1'].find(n=>n.d0===6110)['1']='System Light';
assert.deepEqual(restored,r6,'Only the clock font may change');
widget['3']='Widgy Home Glass JS City R8';
widget['4']='R8: live HH:mm clock uses the user-approved option 3, BarlowCondensed-Light, already used by sunrise/sunset and event times. Default zero has no slash or dot. Clock position, size, source and all other R6 layers, atlas, fonts, live variables and dynamic 10,000-step ring retained. Calendar content remains demo data.';
writeFileSync(new URL('./Widgy_Home_Glass_JS_City_R8.json',import.meta.url),JSON.stringify(widget));
const page=read('./widgy-home-js-city-r6.html')
 .replaceAll('JS City R6','JS City R8').replaceAll('JS_City_R6','JS_City_R8')
 .replace('ספרת התאריך עובה עוד באותו גופן שעובד ב־R5. קווי האטלס סביב היבשות חוזקו בעדינות כדי שייראו טוב יותר בגודל הווידג׳ט. התאריך נשאר ממורכז ומתעדכן בכל יום, וטבעת הצעדים נשארת דינמית עם יעד 10,000.','השעון עודכן לאפשרות 3 שבחרנו: Barlow Condensed Light, הגופן הצר והעדין שכבר מופיע בשעות הזריחה והשקיעה. השעון החי נשאר בפורמט HH:mm.');
assert(page.includes('Widgy_Home_Glass_JS_City_R8.json'));
writeFileSync(new URL('./widgy-home-js-city-r8.html',import.meta.url),page);
console.log('R8 built and verified: only Hero Time font changed; live no-seconds clock, atlas and 10,000-step ring are unchanged.');
