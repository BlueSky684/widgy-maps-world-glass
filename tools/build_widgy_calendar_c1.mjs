import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {CANVAS,PALETTE,calendarChromeSVG} from './calendar_glass_design.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const baseline=read('./Widgy_Home_Glass_JS_City_R12.json');
export const SOURCE_CONTRACT={
  category:'Agenda (Today)',
  total:'Calendar Events Today',remaining:'Remaining Calendar Events Today',reminders:'Reminder Events Today',
  fields:['Title','Start Time','End Time','Location'],
};
const OUT=new URL('../assets/calendar-glass/',import.meta.url);
mkdirSync(OUT,{recursive:true});
writeFileSync(new URL('Calendar_Glass_Chrome_C1.svg',OUT),calendarChromeSVG());
const widget=structuredClone(baseline), home=widget['1'].find(n=>n.d0===245), cal=widget['1'].find(n=>n.d0===247);
const at=id=>home['1'].find(n=>n.d0===id);
let next=widget.a2;
const id=()=>next++;
const round=n=>Math.round(n*1e6)/1e6;
const scalar=(a,kind=168)=>({a:[{a:round(a),b:kind,c:0,d:kind}],b:0});
function frame(n,[x,y,w,h]) {for(const [k,v] of Object.entries({b:x/CANVAS.width*1600,c:y/CANVAS.height*1600,d:w/CANVAS.width*1600,e:h/CANVAS.height*1600}))n[k]=scalar(v,n.z==='11'?222:n.z==='4'?170:168);return n;}
const literal=s=>({'5':'Custom Text','6':'Text','25':s});
const native=(group,field)=>({'5':group,'6':field});
const agenda=field=>native(SOURCE_CONTRACT.category,field);
const js=code=>({'5':'Javascript','6':'Script','10':code});
const colors={};
for(const [i,[name,hex]] of Object.entries(PALETTE).entries()) {const key=`hexcol_CA1E000000004000A000${String(i+1).padStart(12,'0')}`;widget['2'].push(`${key}-${hex.slice(1).toUpperCase()}FF`);colors[name]=key+'-100';}
function copy(n,name=n.s) {const r=structuredClone(n);r.d0=id();r.s=name;return r;}
function text(name,sources,x,baselineY,w,cap=28,font='Phenomena-Regular',color=colors.white,align=0){
 const ratio=font.startsWith('Phenomena')?.558:.6,h=cap/ratio;
 return frame({d0:id(),z:'1',s:name,'1':font,'2':scalar(align),'66':Array.isArray(sources)?sources:[literal(sources)],f:color},[x,baselineY-.802*h,w,h]);
}
function symbol(name,glyph,box,color=colors.muted){return frame({d0:id(),z:'4',s:name,'3':glyph,f:color},box);}
function shape(name,box,color){return frame({d0:id(),z:'2',s:name,g:color},box);}
function tap(name,box,url,preset='Open URL'){return frame({d0:id(),z:'11',s:name,'1':preset,'2':url},box);}
function variable(name,source,type=2){
 const uid=`CA1E0000-0000-4000-A000-${String(widget['36'].length+1).padStart(12,'0')}`;
 widget['36'].push({'0':uid,'1':name,'2':type,'3':{z:'1',s:`Variable: ${name}`,'66':[source],d:scalar(800),e:scalar(200)}});return uid;
}
const remaining=variable('calendar_remaining_today',agenda(SOURCE_CONTRACT.remaining));
const empty={'0':remaining,'1':0,'2':'0'};
const present=i=>({'0':remaining,'1':5,'2':String(i)});
const layers=[];
// Exact R12 native header and navigation, with independent IDs.
for(const n of home['1'].filter(n=>n.s?.endsWith(' Tap')))layers.push(copy(n));
for(const n of home['1'].filter(n=>/Nav (Icon|Label|Binding)$/.test(n.s??''))) {
 const c=copy(n);if(c.s.startsWith('HOME')){if(c.f)c.f=colors.muted;if(c.g)c.g=colors.muted;}
 if(c.s.startsWith('CALENDAR')){if(c.f)c.f=colors.lime;if(c.g)c.g=colors.lime;}layers.push(c);
}
for(const n of home['1'].filter(n=>/^Header (Day|Month|Weekday|Date Divider)/.test(n.s??'')))layers.push(copy(n));
const calWhite=copy(at(6101),'Calendar Title · White');calWhite['66']=[literal('CAL')];frame(calWhite,[44,25,121,126]);layers.push(calWhite);
const calLime=copy(at(6101),'Calendar Title · Lime');calLime['66']=[literal('ENDAR')];calLime.f=colors.lime;frame(calLime,[164.6,25,360,126]);layers.push(calLime);
// Local native location. No calendar data is put in URLs or remote requests.
layers.push(symbol('Calendar Location Icon','mappin',[54,177,26,26]));
layers.push(text('Calendar Location',[native('Location','City'),literal(', '),native('Location','Country')],98,202,460,29,'Phenomena-Regular',colors.muted));
layers.push(text('Calendar Full Date',[js(`function main(){var d=new Date();return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]+', '+d.getDate()+' '+['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()]+' '+d.getFullYear();}`)],590,202,490,29,'Phenomena-Regular',colors.muted,2));
layers.push(text('Calendar Month',[js(`function main(){return ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()];}`)],130,324,215.7,38,'Phenomena-Bold',colors.white,2));
layers.push(text('Calendar Year',[native('Date And Time','yyyy')],363.7,324,105,36,'HomeGlassTime-Light',colors.muted));
for(const [i,label] of ['SUN','MON','TUE','WED','THU','FRI','SAT'].entries())layers.push(text(`Calendar Weekday · ${label}`,label,48+i*554/7,392,554/7,23,'BarlowCondensed-Light',colors.muted,1));
layers.push(text('Agenda Heading','TODAY',695,325,180,37,'Phenomena-Bold'));
layers.push(shape('Agenda Heading Accent',[670,286,5,39],colors.lime));
layers.push(text('Agenda Events Count',[agenda(SOURCE_CONTRACT.total),literal(' events today')],900,305,181,24,'Phenomena-Regular',colors.muted,2));
layers.push(text('Agenda Reminders Count',[agenda(SOURCE_CONTRACT.reminders),literal(' reminders')],900,337,181,24,'Phenomena-Regular',colors.muted,2));
layers.push(tap('Open Reminders',[888,312,202,43],'x-apple-reminderkit://','Reminders'));
for(let i=1;i<=4;i++){
 const top=403+(i-1)*149,children=[];
 const field=s=>[agenda(`Calendar #${i} - ${s}`)];
 children.push(tap(`Open Calendar · Event ${i}`,[665,top-12,427,125],'calshow://','Calendar'));
 children.push(text(`Event ${i} · Start`,field('Start Time'),694,top+28,92,28,'HomeGlassTime-Light'));
 children.push(text(`Event ${i} · End`,field('End Time'),694,top+66,92,23,'HomeGlassTime-Light',colors.muted));
 children.push(text(`Event ${i} · Title`,field('Title'),803,top+29,280,30,'Phenomena-Bold'));
 children.push(text(`Event ${i} · Location`,field('Location'),830,top+68,254,23,'Phenomena-Regular',colors.muted));
 children.push(symbol(`Event ${i} · Location Icon`,'mappin',[804,top+48,20,23]));
 children.push(shape(`Event ${i} · Accent`,[670,top,5,79],[colors.blue,colors.purple,colors.amber,colors.green][i-1]));
 if(i<4)children.push(shape(`Event ${i} · Separator`,[668,top+115,417,.7],colors.rim));
 layers.push({d0:id(),z:'13',s:`Agenda · Row ${i}`,'1':children,o1:present(i)});
}
const emptyLabel=text('Agenda · Empty','No more events today',694,450,380,30,'Phenomena-Regular',colors.muted);emptyLabel.o1=empty;layers.push(emptyLabel);
// Template gate: native calendar parameters must come from the installed app,
// not guessed integer keys. No draft with a missing grid is published as final.
const templateFile=process.argv[2];
let calendarTemplate=null;
function walk(n){if(n&&typeof n==='object'){if(n.z==='10'&&!calendarTemplate)calendarTemplate=n;for(const v of Object.values(n))if(typeof v==='object')walk(v);}}
if(templateFile){walk(JSON.parse(readFileSync(templateFile,'utf8')));assert(calendarTemplate,'Export must contain a native Calendar layer (z=10)');}
if(calendarTemplate){const n=copy(calendarTemplate,'Calendar · Native Month');delete n.a;frame(n,[48,423,554,560]);n['1']='HomeGlassTime-Light';layers.push(n);}
else {layers.push(text('Integration Pending · Native Calendar','Native Calendar source pending',60,690,530,27,'Phenomena-Regular',colors.muted));}
const chrome=copy(at(80309),'Calendar R2 · Static Chrome');
const url='https://widgy-maps-world-glass-git-f50-widget-test-blue-sky12.vercel.app/assets/calendar-glass/Calendar_Glass_Chrome_C1.png';
chrome['2']=url;chrome['22']=`function main(){return '${url}';}`;layers.push(chrome);
cal['1']=layers;widget.a2=next;
widget['3']='Widgy Home Glass Calendar C1 Draft';
widget['4']='Integration draft: approved Calendar R2 presentation, original R12 header/navigation and native Agenda Today bindings. Native monthly calendar settings and agenda data require the source check from the installed Widgy version. Not a final import. Home R12, Weather and Fitness groups are unchanged.';
assert.deepEqual(widget['1'].filter(n=>n.d0!==247),baseline['1'].filter(n=>n.d0!==247));
assert.deepEqual(widget['36'].slice(0,baseline['36'].length),baseline['36']);
writeFileSync(new URL('./Widgy_Home_Glass_Calendar_C1_Draft.json',import.meta.url),JSON.stringify(widget));

// Small native probe, entirely separate from the installed Home widget.
const probe=structuredClone(baseline);probe['1']=[];probe['36']=[];probe['3']='Widgy Calendar Native Source Check';probe['4']='Native Calendar and Agenda source-format check. Enable Calendar event indicators, then export JSON for integration. No user event values are embedded in this file.';
const probeLayers=[];
probeLayers.push(text('Probe Title','CALENDAR SOURCE CHECK',50,85,1035,38,'Phenomena-Bold'));
probeLayers.push(text('Probe Subtitle','Native calendar + live Agenda fields',50,137,1035,25,'Phenomena-Regular',colors.muted));
probeLayers.push(frame({d0:id(),z:'10',s:'Native Calendar · Enable Event Indicators','1':'HomeGlassTime-Light',f:colors.white},[60,200,990,530]));
const fields=[SOURCE_CONTRACT.total,SOURCE_CONTRACT.remaining,SOURCE_CONTRACT.reminders,'Calendar #1 - Title','Calendar #1 - Start Time','Calendar #1 - End Time','Calendar #1 - Location'];
fields.forEach((field,i)=>{const y=780+i*52;probeLayers.push(text('Label '+field,field,50,y,610,22,'Phenomena-Regular',colors.muted));probeLayers.push(text('Native '+field,[agenda(field)],665,y,400,26,'Phenomena-Regular'));});
probeLayers.push(shape('Probe Background',[0,0,1135,1184],'uicol_black-100'));
probe['1']=probeLayers;probe['2']=widget['2'];probe.a2=next;
for(const value of [widget,probe]){
 const ids=[];function collect(n){if(!n||typeof n!=='object')return;if('d0' in n)ids.push(n.d0);for(const v of Object.values(n))if(typeof v==='object')collect(v);}collect(value['1']);
 assert.equal(new Set(ids).size,ids.length,'Every native layer ID must be unique');
 assert(value.a2>Math.max(...ids),'Next native ID must remain above all layers');
}
writeFileSync(new URL('./Widgy_Calendar_Native_Source_Check.json',import.meta.url),JSON.stringify(probe));
console.log(JSON.stringify({draftLayers:layers.length,homeExactlyPreserved:true,calendarTemplatePresent:!!calendarTemplate,releaseReady:false,probeLayers:probeLayers.length,nativeSources:SOURCE_CONTRACT}));
