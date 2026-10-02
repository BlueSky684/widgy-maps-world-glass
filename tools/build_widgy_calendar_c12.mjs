import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C11.json'),w=structuredClone(base);
function* walk(ns){for(const n of ns){yield n;if(n.z==='13')yield* walk(n['1']);}}
const nodes=[...walk(w['1'])],before=new Map([...walk(base['1'])].map(n=>[n.d0,n]));
const px=(n,k)=>n[k].a[0].a*(k==='b'||k==='d'?1135:1184)/1600;
const set=(n,k,p)=>{n[k].a[0].a=Math.round(p*1600/(k==='b'||k==='d'?1135:1184)*1e6)/1e6;};
// Read the city already resolved for the map, rather than geocoding twice or
// hardcoding one city's spelling. URI decoding happens after interpolation,
// so punctuation in place names cannot become executable Javascript.
const cityScript=`function main() {
  var request = "\${widgy.map_request}";
  var match = /[?&]city=([^&#]*)/.exec(request);
  if (!match) return '';
  try {
    var city = decodeURIComponent(match[1].replace(/\\+/g, ' ')).trim();
    return city ? city + ', ' : '';
  } catch (error) { return ''; }
}`;
const location=nodes.find(n=>n.s==='Calendar Location');
location['66']=[{'5':'Javascript','6':'Script','10':cityScript},{'5':'Location','6':'Country'}];
let dates=0,hebrew=0,bars=0;
for(const n of nodes){
  if(n.s==='Calendar · Today Live Date'){
    const h=px(n,'e'),y=px(n,'c'),newH=28/.558;
    // Preserve the visible glyph center inside the 62px circle.
    set(n,'c',y+(.802-.558/2)*(h-newH));set(n,'e',newH);dates++;
  }
  if(/^Event [1-4] · Hebrew Title$/.test(n.s??'')){
    // Center the 224px text box within the same 280px title column as Latin.
    // C11's on-device Hebrew glyphs sit ~10px below that row's first line.
    set(n,'b',803+(280-224)/2);set(n,'c',px(n,'c')-10);
    n['2'].a[0].a=1;hebrew++;
  }
  if(/^Event [1-4] · Accent$/.test(n.s??'')){
    const row=Number(n.s.match(/[1-4]/)[0]);
    set(n,'b',670);set(n,'c',403+149*(row-1));set(n,'e',79);bars++;
  }
}
assert.equal(dates,95);assert.equal(hebrew,108);assert.equal(bars,4);
// Exercise changing places through the actual map runtime and Calendar script.
const mapScript=w['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10'];
const mapFor=async city=>new Promise((resolve,reject)=>{
  const script=mapScript.replaceAll('${widgy.map_latitude_max5}','31.66879').replaceAll('${widgy.map_longitude_max5}','34.57425');
  try{vm.runInNewContext(script,{sendToWidgy:resolve,fetch:async()=>({ok:true,json:async()=>({latitude:31.66879,longitude:34.57425,lookupSource:'coordinates',city})})});}catch(e){reject(e);}
});
const labelFor=url=>vm.runInNewContext(cityScript.replace('${widgy.map_request}',url)+'\nmain();');
for(const city of ['Ashkelon','Ashdod','Tel Aviv','Paris','St. John\'s','A "quoted" city','עיר בדיקה']){
  const url=await mapFor(city);assert.equal(new URL(url).searchParams.get('city'),city);assert.equal(labelFor(url),city+', ');
}
for(const url of ['', '${widgy.map_request}','https://example.com/?lat=&lon=','https://example.com/?city=%ZZ'])assert.equal(labelFor(url),'');
// Whitelist the exact changed fields and prove every other value is identical.
const restored=structuredClone(w);
for(const n of walk(restored['1'])){
  const old=before.get(n.d0);
  const keys=n.s==='Calendar Location'?['66']:n.s==='Calendar · Today Live Date'?['c','e']:/^Event [1-4] · Hebrew Title$/.test(n.s??'')?['b','c','2']:/^Event [1-4] · Accent$/.test(n.s??'')?['b','c','e']:[];
  for(const k of keys)n[k]=structuredClone(old[k]);
}
assert.deepEqual(restored,base);
w['3']='Widgy Home Glass Calendar C12';
w['4']='C12 reads the dynamic city directly from the map_request city parameter, retaining native Country. No hardcoded city and no additional lookup. Selected date cap height reduced from 31 to 28px with its center preserved; Hebrew titles centered in the agenda title column and raised 10px; event accent bars restored to the approved 79px height. Native dots, calendar navigation, event data, and all other tabs preserved. Device rendering and the map_request text dependency require iPhone verification.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C12.json',import.meta.url),JSON.stringify(w));
let page=readFileSync(new URL('./widgy-home-calendar-c11.html',import.meta.url),'utf8').replaceAll('C11','C12').replaceAll('c11','c12');
page=page.replace(/<p>Calendar C12:.*?<\/p>/,'<p>Calendar C12: שם העיר מתעדכן מתוך נתוני המפה, הספרה בעיגול הוקטנה, הכותרות בעברית מורכזו ופסי הצבע קוצרו לפי העיצוב המאושר.</p>');
page=page.replace('בדוק את הנקודות מתחת לתאריכים ואת גודל הכותרות בעברית.','בדוק את שם העיר מול המפה, הספרה בעיגול, מיקום העברית ופסי הצבע.');
page=page.replace(/<p>הערך לפריסה.*?<\/p>/,'<p>נדרשת בדיקה באייפון לאחר הרענון. שם העיר תלוי בטעינת נתוני המפה; בזמן שהשם אינו זמין תופיע המדינה בלבד.</p>');
writeFileSync(new URL('./widgy-home-calendar-c12.html',import.meta.url),page);
const stats={layers:nodes.length,selectedDateFramesChanged:dates,selectedDateCapHeightPx:28,hebrewTitleFramesChanged:hebrew,hebrewCenteredInColumn:[803,1083],hebrewRaisedPx:10,eventBarsChanged:bars,eventBarHeightPx:79,dynamicCitySource:'map_request city parameter',additionalNetworkRequests:0,unrelatedDataAndActionsUnchanged:true,requiresIPhoneVerification:true};
writeFileSync(new URL('../assets/calendar-glass/Calendar_C12_Build_Stats.json',import.meta.url),JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify(stats));
