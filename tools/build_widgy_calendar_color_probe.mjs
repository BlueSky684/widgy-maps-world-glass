import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

// Isolated editor probe: obtain native color serialization from the installed
// Widgy version. Do not guess dynamic color identifiers or calendar options.
const base=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url),'utf8'));
const cal=base['1'].find(n=>n.d0===247);
const pane=cal['1'].find(n=>n.s==='Calendar · Month Offset 0');
const native=structuredClone(pane['1'].find(n=>n.s==='Calendar · 5 Week Layout')['1'].find(n=>n.z==='10'));
const scalar=a=>({a:[{a:Math.round(a*1e6)/1e6,b:168,c:0,d:168}],b:0});
const frame=(n,[x,y,w,h])=>Object.assign(n,{b:scalar(x/1135*1600),c:scalar(y/1184*1600),d:scalar(w/1135*1600),e:scalar(h/1184*1600)});
const color=i=>`hexcol_CA1E000000004000A000${String(i).padStart(12,'0')}-100`;
let id=1;
const label=(s,value,box,source=false)=>frame({d0:id++,z:'1',s,'1':'System Regular',f:color(1),'66':[source?{'5':'Agenda (Today)','6':value}:{'5':'Custom Text','6':'Text','25':value}]},box);
const w={};
for(const k of ['0','6','9','10','20','21','28'])if(k in base)w[k]=structuredClone(base[k]);
w['3']='Widgy Calendar Color Check';
w['4']='Separate editor probe based on C16. Color 1 and Color 2 start as fixed colors. In the editor select the corresponding native Agenda Today event colors, then export JSON to capture exact native identifiers. Calendar Dots retains the verified current-month Agenda data source for inspection of symbol options. The event titles are live device bindings; no personal values, network sources, variables or tap actions are embedded. C16 is not modified.';
w['5']=base['5'];
w['2']=base['2'].filter(s=>[1,2,4,7,8].some(i=>s.startsWith(color(i).slice(0,-4)+'-')));
w['36']=[];
w['1']=[
 frame({d0:id++,z:'2',s:'Color 1',g:color(7)},[70,250,18,58]),
 frame({d0:id++,z:'2',s:'Color 2',g:color(8)},[70,365,18,58]),
 label('Check Title','CALENDAR COLOR CHECK',[70,55,995,65]),
 label('Check Hint','Select Color 1 > Color > Dynamic',[70,140,995,40]),
 label('Event 1 Label','Today event 1',[110,208,900,34]),
 label('Event 1 Title','Calendar #1 - Title',[110,252,900,52],true),
 label('Event 2 Label','Today event 2',[110,323,900,34]),
 label('Event 2 Title','Calendar #2 - Title',[110,367,900,52],true),
 label('Calendar Label','Calendar: event symbol settings',[70,465,995,40]),
];
native.d0=id++;native.s='Calendar · Dots';native['15']=color(2);
native['44'].a[0].a=0;
// Fixed current-month grid is only an editor sample, not a new dashboard.
frame(native,[95,525,945,570]);w['1'].push(native);
w['1'].push(frame({d0:id++,z:'2',s:'Background',g:color(4)},[0,0,1135,1184]));
w.a2=id;
assert.equal(w['1'].length,11);
assert.equal(new Set(w['1'].map(n=>n.d0)).size,w['1'].length);
assert.equal(native['53'],'Agenda');assert.equal(native['54'],'Calendar Events');
assert.equal(native['44'].a[0].a,0);
const payload=JSON.stringify(w);
assert(!/https?:|\$\{widgy\.|"o1"|"1a"|"Javascript"/.test(payload));
assert.equal(w['2'].length,5);
const filename='Widgy_Calendar_Color_Check.json';
writeFileSync(new URL(filename,import.meta.url),payload+'\n');

// Reuse the existing tested clipboard flow and its iOS fallback.
const importer=readFileSync(new URL('./widgy-home-calendar-c16.html',import.meta.url),'utf8');
const head=importer.slice(0,importer.indexOf('<body>')).replace('Widgy Home · Calendar C16','Widgy · Calendar Colors');
let script='<script>'+importer.split('<script>')[1];
script=script.replaceAll('Widgy_Home_Glass_Calendar_C16.json',filename).replaceAll('Widgy Home Glass Calendar C16',w['3']);
script=script.replace('העתקת הווידג׳ט','העתקת קובץ הבדיקה');
const body=`<body><main>
<h1>צבעי האירועים ב־Calendar</h1>
<p>קובץ קטן לבדיקה בעורך Widgy. הוא מציג שני פסי צבע ולוח חודש.</p>
<p>לאחר הייבוא, פתח את השכבה <b dir="ltr">Color 1</b>, עבור להגדרת הצבע ופתח <b dir="ltr">Dynamic</b>. שלח צילום של אפשרויות צבעי היומן שמופיעות שם.</p>
<p>אפשר לפתוח את הקובץ בעורך בלי לשייך אותו לסלוט במסך הבית.</p>
<button id="copy" disabled>טוען את קובץ הבדיקה…</button>
<div id="status" role="status" aria-live="polite"></div>
<p><a id="download" href="./${filename}" download="${filename}">הורדת קובץ הבדיקה</a></p>
<small>פתח ב־Safari, העתק וייבא מהלוח ב־Widgy.</small>
</main>\n`;
writeFileSync(new URL('./widgy-calendar-color-check.html',import.meta.url),head+body+script);
console.log(JSON.stringify({name:w['3'],layers:w['1'].length,bytes:Buffer.byteLength(payload),currentMonthOffset:0,networkSources:0,productionWidgetChanged:false}));
