import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('sharp');
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=read('./Widgy_Home_Glass_Calendar_C12.json'),w=structuredClone(base),c11=read('./Widgy_Home_Glass_Calendar_C11.json');
const site='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app';
function* walk(ns){for(const n of ns){yield n;if(n.z==='13')yield*walk(n['1']);}}
const cal=w['1'].find(n=>n.d0===247),nodes=[...walk(cal['1'])];let next=w.a2;
const scalar=a=>({a:[{a:Math.round(a*1e6)/1e6,b:168,c:0,d:168}],b:0});
const px=(n,k)=>n[k].a[0].a*(k==='b'||k==='d'?1135:1184)/1600;
const set=(n,k,p)=>{n[k]=scalar(p*1600/(k==='b'||k==='d'?1135:1184));};
const condition=(v,op,value)=>({'0':v,'1':op,'2':value});
const group=(s,children,o1)=>({d0:next++,z:'13',s,'1':children,o1});
const text=value=>({'5':'Custom Text','6':'Text','25':value});
function variable(name,source){
 const uid=`CA1E0000-0000-4000-C013-${String(w['36'].length+1).padStart(12,'0')}`;
 w['36'].push({'0':uid,'1':name,'2':0,'3':{z:'1',s:'Variable: '+name,'66':[source],d:scalar(800),e:scalar(200)}});return uid;
}
// C12 tried to use an asynchronous variable inside synchronous Javascript.
// The device returned no city. Resolve directly in the proven async runtime,
// then display via native Custom Text (the same binding used by the map URL).
const mapScript=w['36'].find(v=>v['1']==='map_request')['3']['66'][0]['10'];
const cityScript=mapScript.replace('sendToWidgy(url);',`var match = /[?&]city=([^&#]*)/.exec(url);
    var city = '';
    try { city = match ? decodeURIComponent(match[1]).replace(/[\\u0000-\\u001f\\u007f]/g, '').slice(0,80) : ''; } catch (error) {}
    sendToWidgy(city ? city + ', ' : '');`);
assert.notEqual(cityScript,mapScript);
const cityId=variable('calendar_city_prefix',{'5':'Javascript','6':'Async + No main()','10':cityScript});
const nativeCityId=variable('calendar_native_city',{'5':'Location','6':'City'});
const oldLocation=nodes.find(n=>n.s==='Calendar Location');
const nativeLocation=structuredClone([...walk(c11['1'])].find(n=>n.s==='Calendar Location'));
nativeLocation.d0=next++;nativeLocation.s='Calendar Location · Native Fallback';
nativeLocation.o1=condition(nativeCityId,1,'Ashqelon');
const spelling=structuredClone(nativeLocation);spelling.d0=next++;spelling.s='Calendar Location · Ashkelon Spelling';
spelling.o1=condition(nativeCityId,0,'Ashqelon');spelling['66']=[text('Ashkelon, '),{'5':'Location','6':'Country'}];
oldLocation['66']=[text('${widgy.calendar_city_prefix}'),{'5':'Location','6':'Country'}];
oldLocation.o1=condition(cityId,1,'');
cal['1'].push(group('Calendar Location · Pending Lookup',[nativeLocation,spelling],condition(cityId,0,'')));

// Rasterize the actual R2 glyph paths at 4x, preserving transparency. One
// shared URL changes with the date; no calendar/private data is sent remotely.
const glyphs=read('../assets/calendar-glass/Calendar_Today_Glyphs.json');
const dir=new URL('../assets/calendar-glass/today-c13/',import.meta.url);mkdirSync(dir,{recursive:true});
for(let d=1;d<=31;d++)await sharp(Buffer.from(glyphs[d])).png({compressionLevel:9}).toFile(new URL(`${d}.png`,dir).pathname);
variable('calendar_today_glyph',{'5':'Javascript','6':'Script','10':`function main(){return '${site}/assets/calendar-glass/today-c13/'+new Date().getDate()+'.png';}`});
let dates=0,circles=0,layouts=0;
for(const n of nodes){
 if(n.s==='Calendar · Today Live Date'){
  // Original grid center inferred from C12's cap-center-preserving formula.
  const gridCy=px(n,'c')+(.802-.558/2)*px(n,'e');
  const id=n.d0,x=px(n,'b');for(const k of Object.keys(n))delete n[k];
  Object.assign(n,{d0:id,z:'5',s:'Calendar · Today Approved Glyph','1':'Web URL','2':'${widgy.calendar_today_glyph}','3':true});
  set(n,'b',x);set(n,'c',gridCy-4-31);set(n,'d',62);set(n,'e',62);dates++;
 }else if(n.s==='Calendar · Today Disc'){set(n,'c',px(n,'c')-4);circles++;}
 if(n.z==='10')n['10']='uicol_clear-100';
 if(/^Calendar · [456] Week Layout$/.test(n.s??'')){
  // Widgy paints the first layer on top. The native Calendar covered some
  // of the fine rules below it, unlike the four visible R2 week separators.
  const rules=n['1'].filter(x=>/^Calendar · Week Separator /.test(x.s??''));
  n['1']=[...rules,...n['1'].filter(x=>!rules.includes(x))];layouts++;
 }
}
assert.equal(dates,95);assert.equal(circles,95);assert.equal(layouts,75);

// Native text conditions keep meeting titles/locations out of Javascript.
// A service icon is informational; taps still open Calendar, never fabricate
// a meeting URL. Missing locations keep the detail/icon area empty.
const iconRules=[
 ['zoom.us','video.fill'],['Zoom','video.fill'],['zoom','video.fill'],['ZOOM','video.fill'],
 ['teams.microsoft','video.fill'],['Teams','video.fill'],['teams','video.fill'],['TEAMS','video.fill'],
 ['Skype','video.fill'],['skype','video.fill'],['SKYPE','video.fill'],
 ['meet.google','video.fill'],['Google Meet','video.fill'],
 ['Conference','person.2.fill'],['Room','person.2.fill'],['room','person.2.fill'],['חדר','person.2.fill'],
 ['tel:','phone.fill'],['Phone','phone.fill'],['phone','phone.fill'],['טלפון','phone.fill'],
 ['Notes','doc.text.fill'],['Updates','doc.text.fill']
];
let iconCases=0;
for(let i=1;i<=4;i++){
 const row=cal['1'].find(n=>n.s===`Agenda · Row ${i}`),icon=row['1'].find(n=>n.s===`Event ${i} · Location Icon`);
 const locationId=w['36'].find(v=>v['1']===`calendar_event_${i}_location`)['0'];
 let branch=[structuredClone(icon)];delete branch[0].o1;
 for(const [pattern,symbol] of [...iconRules].reverse()){
  const match=structuredClone(icon);match.d0=next++;match.s=`Event ${i} · Detail Icon · ${pattern}`;match['3']=symbol;match.o1=condition(locationId,2,pattern);
  branch=[match,group(`Event ${i} · Detail without ${pattern}`,branch,condition(locationId,3,pattern))];iconCases++;
 }
 const root=group(`Event ${i} · Dynamic Detail Icon`,branch,condition(locationId,1,''));
 row['1']=row['1'].map(n=>n===icon?root:n);
}
w.a2=next;
// Directly exercise async city source, success and fallback, with supplied GPS.
async function cityFor(city,ok=true){return new Promise((resolve,reject)=>{
 const source=cityScript.replaceAll('${widgy.map_latitude_max5}','31.66879').replaceAll('${widgy.map_longitude_max5}','34.57425');
 try{vm.runInNewContext(source,{sendToWidgy:resolve,fetch:async()=>({ok,json:async()=>({latitude:31.66879,longitude:34.57425,lookupSource:'coordinates',city})})});}catch(e){reject(e);}
});}
for(const city of ['Ashkelon','Ashdod','Paris','St. John\'s','A "quoted" city'])assert.equal(await cityFor(city),city+', ');
assert.equal(await cityFor('Ashkelon',false),'');
assert.equal(nativeLocation.o1['2'],'Ashqelon');assert.equal(spelling.o1['2'],'Ashqelon');
assert.deepEqual(w['1'].filter(n=>n.d0!==247),base['1'].filter(n=>n.d0!==247));
assert.deepEqual(w['36'].slice(0,base['36'].length),base['36']);
const all=[...walk(w['1'])],ids=all.map(n=>n.d0);assert.equal(ids.length,new Set(ids).size);assert(next>Math.max(...ids));
for(const n of all)if(n['1a'])for(const id of n['1a'].replace('button_','').split(/[-,]/).map(Number))assert(ids.includes(id));
w['3']='Widgy Home Glass Calendar C13';
w['4']='C13: direct async GPS city lookup using the map resolver, native dynamic city fallback, and Ashqelon spelling normalization only when that is the current native city. Selected day uses approved R2 font outlines as transparent 4x PNGs, date-dynamic, with the badge raised 4px. Week rules moved above native Calendar. Location-driven meeting/detail icons added. Event accent colors remain fixed by row; month dots remain native single-color indicators; no direct join links or reminder rows. All non-Calendar layers and original variables preserved. iPhone review still required.';
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C13.json',import.meta.url),JSON.stringify(w));
const audit={version:'C13',deviceEvidence:'IMG_9703.jpeg',reference:'Calendar Technical Preview R2',layers:all.length,city:{source:'Same GPS/English resolver as map; direct Async + No main()',fallback:'Native City/Country; Ashqelon normalized only when current City matches',additionalLookupPerRefresh:'At most one extra city lookup, best-effort 60s runtime reuse',requiresDeviceReview:true},selectedDate:{source:'Exact approved Phenomena Bold outlines, 31px cap height, 4x lossless transparent PNG',dateDynamic:true,days:31,badgeOffsetFromGridCenterPx:-4,requiresDeviceReview:true},icons:{rules:iconRules,source:'Event Location only; native conditions',missingLocation:'Hidden',directMeetingJoin:false},remainingGaps:[{item:'Event colors',status:'Fixed blue/purple/amber/green by row, not calendar-account colors; needs native dynamic-color export'},{item:'Month dots',status:'One native cyan presence indicator, not multiple colored event dots'},{item:'Ordinary date typography',status:'Native Calendar auto-sizing appears about 27-28px on phone vs approved 31px; exact font-scale setting needs device export'},{item:'Overflow dates',status:'Native faded gray differs from approved slate gray'},{item:'Agenda secondary line',status:'Lowered to allow two-line titles; short-title rows differ from R2'},{item:'Agenda separators',status:'129px below row top vs 115px in R2 to allow two-line title/details'},{item:'Reminders',status:'Live count and app shortcut only; no reminder rows or completion control'},{item:'Agenda navigation',status:'Up to four current-day entries; browsing month does not select a day or change TODAY list'},{item:'Event taps',status:'Open Calendar, not specific event or meeting join URL'},{item:'All-day detection',status:'Display rule for observed 0:00–23:59, not a native all-day boolean'},{item:'Four/six-week layouts',status:'Spacing modeled; phone verification remains pending'}],preserved:{home:true,weather:true,fitness:true,navigation:true,dotOffset:true,hebrewC12:true},nativeCapabilitiesEvidence:'Widgy developer App Store release notes confirm Calendar/Reminder dynamic colors and Agenda Smart Symbols; exact serialized field names not present in supplied exports.'};
writeFileSync(new URL('../assets/calendar-glass/Calendar_C13_Audit.json',import.meta.url),JSON.stringify(audit,null,2)+'\n');
let page=readFileSync(new URL('./widgy-home-calendar-c12.html',import.meta.url),'utf8').replace(/<p><b>עדכון מהבדיקה באייפון:<\/b>.*?<\/p>\n?/,'').replaceAll('C12','C13').replaceAll('c12','c13');
page=page.replace(/<p>Calendar C13:.*?<\/p>/,'<p>Calendar C13: תיקון שם העיר עם גיבוי דינמי, ספרת היום מתוך קווי הגופן המאושר, קווי השבוע מעל הלוח וסמלי פגישה לפי שדה המיקום.</p>');
page=page.replace(/<p>נדרשת בדיקה באייפון.*?<\/p>/,'<p>נדרשת בדיקה באייפון לאחר הרענון. סמלי וידאו מופיעים כששדה המיקום מכיל Zoom, Teams, Skype או Google Meet. הצבעים עדיין קבועים לפי השורה, והנקודות בלוח עדיין בצבע אחיד. לחיצה פותחת את היומן.</p>');
writeFileSync(new URL('./widgy-home-calendar-c13.html',import.meta.url),page);
const c12url=new URL('./widgy-home-calendar-c12.html',import.meta.url);
let oldPage=readFileSync(c12url,'utf8');
const notice='<p><b>עדכון מהבדיקה באייפון:</b> שם העיר לא הוצג ב־C12. <a href="./widgy-home-calendar-c13.html">עבור לגרסת C13 המתוקנת</a>.</p>';
if(!oldPage.includes(notice))writeFileSync(c12url,oldPage.replace('  <button id="copy"',notice+'\n  <button id="copy"'));
console.log(JSON.stringify({layers:all.length,dates,circles,layouts,iconCases,homeAndExistingVariablesPreserved:true,requiresIPhoneReview:true}));
