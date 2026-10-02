import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C9.json',import.meta.url),'utf8'));
const w=structuredClone(base),cal=w['1'].find(n=>n.d0===247);
const pane=cal['1'].find(n=>n.s==='Calendar · Month Offset 0');
const native=structuredClone(pane['1'].find(n=>n.s==='Calendar · 5 Week Layout')['1'].find(n=>n.z==='10'));
const scalar=v=>({a:[{a:Math.round(v*1e6)/1e6,b:168,c:0,d:168}],b:0});
const frame=(n,[x,y,width,height])=>Object.assign(n,{b:scalar(x/1135*1600),c:scalar(y/1184*1600),d:scalar(width/1135*1600),e:scalar(height/1184*1600)});
const color=i=>`hexcol_CA1E000000004000A000${String(i).padStart(12,'0')}-100`;
native.s='Calendar · Dot Position';native.b=scalar(290/1135*1600);native['15']=color(2);
let id=w.a2;
const label=(s,text,box,font)=>frame({d0:id++,z:'1',s,'1':font,f:color(1),'66':[{'5':'Custom Text','6':'Text','25':text}]},box);
w['1']=[
 native,
 label('Check Title','CALENDAR DOT POSITION',[60,60,1020,90],'Phenomena-Bold'),
 label('Check Subtitle','Open Calendar settings and locate event symbol controls',[60,160,1020,45],'Phenomena-Regular'),
 frame({d0:id++,z:'2',s:'Check Background',g:color(4)},[0,0,1135,1184]),
];
w['36']=[];w.a2=id;w['3']='Widgy Calendar Dot Position Check';
w['4']='Four-layer editor probe. The native calendar copies current-month C9 data/font settings and five-week frame size. Open Calendar Dot Position, then its Calendar options and locate event/day symbol controls. Send a screenshot first; after changing only the vertical offset, export JSON for precise field identification. No map, networking, embedded personal values, buttons or global variables.';
assert.equal(w['1'].length,4);assert.equal(w['1'].filter(n=>n.z==='10').length,1);
assert(!JSON.stringify(w['1']).includes('${widgy.'));
writeFileSync(new URL('./Widgy_Calendar_Dot_Position_Check.json',import.meta.url),JSON.stringify(w));
const reference=readFileSync(new URL('./widgy-home-calendar-c9.html',import.meta.url),'utf8');
const head=reference.slice(0,reference.indexOf('<body>')).replaceAll('Widgy Home · Calendar C9','Widgy · Calendar Dot Position');
let script='<script>'+reference.split('<script>')[1];
script=script.replaceAll('Widgy_Home_Glass_Calendar_C9.json','Widgy_Calendar_Dot_Position_Check.json').replaceAll('Widgy Home Glass Calendar C9','Widgy Calendar Dot Position Check');
const body=`<body><main><h1>מיקום נקודות האירועים</h1>
<p>קובץ בדיקה נפרד עם ארבע שכבות בלבד. פתח אותו בעורך כדי למצוא את הגדרת הגובה של הנקודות.</p>
<p>לאחר הייבוא, פתח את השכבה <b dir="ltr">Calendar · Dot Position</b>, עבור ללשונית <b dir="ltr">Calendar</b> וגלול להגדרות סמלי האירועים. שלח צילום של האפשרויות שמופיעות שם.</p>
<p>אין צורך לשייך את קובץ הבדיקה לסלוט במסך הבית.</p>
<button id="copy" disabled>טוען את הווידג׳ט…</button><div id="status" role="status" aria-live="polite"></div>
<p><a id="download" href="./Widgy_Calendar_Dot_Position_Check.json" download="Widgy_Calendar_Dot_Position_Check.json">הורדת קובץ הבדיקה</a></p>
<p><a href="./widgy-home-calendar-c10.html">C10 — תיקוני גודל ועובי הטקסט</a></p>
</main>\n`;
writeFileSync(new URL('./widgy-calendar-dot-position-check.html',import.meta.url),head+body+script);
console.log(JSON.stringify({probeLayers:4,nativeCalendars:1,globalVariables:0}));
