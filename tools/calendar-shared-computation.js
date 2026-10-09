import assert from 'node:assert/strict';
import {flatten} from './compact-widget-structure.js';

const months="['January','February','March','April','May','June','July','August','September','October','November','December']";
const originalLayout='function main(){var now=new Date(),out="|";for(var offset=-12;offset<=12;offset++){var d=new Date(now.getFullYear(),now.getMonth()+offset,1),days=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();out+=offset+":"+Math.ceil((d.getDay()+days)/7)+"|";}return out;}';
const start=offset=>`var now=new Date(),d=new Date(now.getFullYear(),now.getMonth()+(${offset}),1);`;
export const monthCode=offset=>`function main(){${start(offset)}return ${months}[d.getMonth()];}`;
export const yearCode=offset=>`function main(){${start(offset)}return String(d.getFullYear());}`;
const source=code=>({'5':'Javascript','6':'Script','10':code});

// No frame-expression, native date-offset or state-variable schema is assumed.
// These are the same String-variable references and native Contains conditions
// already used by the approved widget. Network providers remain byte-identical.
export function withSharedCalendarComputation(original){
 assert.equal(original['3'],'Widgy Shared Home Calendar Cleanup 1');
 const w=structuredClone(original),nodes=flatten(w['1']),calendar=w['1'].find(n=>n.d0===247);
 const panes=calendar['1'].filter(n=>/^Calendar · Month Offset -?\d+$/.test(n.s));
 assert.equal(panes.length,25);
 const layout=w['36'].find(v=>v['1']==='calendar_month_layouts');
 assert.deepEqual(layout['3']['66'],[source(originalLayout)]);
 // Keep every existing layout token, appending independent year-selection
 // tokens. The same local Date instance drives layout and year selection.
 layout['3']['66'][0]['10']=originalLayout.replace(';}return out;', ';out+="year:"+offset+":"+(d.getFullYear()-now.getFullYear())+"|";}return out;');
 let next=Math.max(w.a2,...nodes.map(n=>n.d0))+1;
 const addedVariables=[];
 function variable(name,code){
  const v=structuredClone(layout);
  v['0']='CA1E0000-0000-4000-E020-'+String(addedVariables.length+1).padStart(12,'0');
  v['1']=name;v['2']=0;v['3'].s='Variable: '+name;v['3']['66']=[source(code)];
  assert(!w['36'].some(old=>old['0']===v['0']||old['1']===name));
  w['36'].push(v);addedVariables.push(name);return name;
 }
 const monthNames=Array.from({length:12},(_,i)=>variable('calendar_month_name_'+i,monthCode(i)));
 const yearNames=new Map([-1,0,1].map(d=>[d,variable('calendar_year_'+(d<0?'previous':d>0?'next':'current'),`function main(){return String(new Date().getFullYear()+(${d}));}`)]));
 const text=name=>[{'5':'Custom Text','6':'Text','25':'${widgy.'+name+'}'}];
 const captions=[],actions=[];
 const offsets=new Map(panes.map(p=>[p.d0,Number(p.s.split(' ').at(-1))]));
 for(const pane of panes){
  const offset=offsets.get(pane.d0);
  const month=pane['1'].find(n=>n.s==='Calendar Month'),year=pane['1'].find(n=>n.s==='Calendar Year');
  assert(month&&year&&!month.o1&&!year.o1);
  assert.deepEqual(month['66'],[source(monthCode(offset))]);
  assert.deepEqual(year['66'],[source(yearCode(offset))]);
  month['66']=text(monthNames[(offset%12+12)%12]);
  const deltas=offset===0?[0]:offset===-12?[-1]:offset===12?[1]:offset<0?[-1,0]:[0,1];
  const variants=deltas.map((delta,i)=>{
   const n=structuredClone(year);if(i)n.d0=next++;
   n['66']=text(yearNames.get(delta));
   if(deltas.length>1)n.o1={'0':layout['0'],'1':2,'2':`|year:${offset}:${delta}|`};
   return n;
  });
  pane['1'].splice(pane['1'].indexOf(year),1,...variants);
  captions.push({offset,month:month.d0,years:variants.map(n=>n.d0)});

  // Preserve complete exported native actions byte-for-byte. Widgy returned
  // to Home when these lists omitted the explicit Calendar/Home states.
  // A patch-style JS state model did not represent native button behavior.
  for(const n of pane['1'].filter(n=>/^Calendar · (Previous|Next) Month$/.test(n.s))){
   assert(n['1a']?.startsWith('button_'));
   const lists=n['1a'].slice(7).split('-').map(s=>s.split(',').map(Number));
   const target=offset+(n.s.includes('Previous')?-1:1);
   assert(lists[0].some(id=>offsets.get(id)===target));
   assert(lists[0].includes(247)&&lists[1].includes(245));
   actions.push({id:n.d0,offset,target,before:lists.flat().length,after:lists.flat().length,preservedExactly:true});
  }
 }
 assert.equal(actions.length,48);
 w.a2=next;
 w['3']='Widgy Shared Calendar Computation 1';
 w['4']='Full Home and Calendar without tap markers. Share 25 month-name calculations through 12 cyclic values and 25 year calculations through three relative-year values; existing layout calculation selects the year. Keep exact caption fonts/frames and all 25 months. Restore complete original month-arrow actions, including explicit Calendar and Home visibility. All Home artwork, map/city/GPS runtime, clock, gauges, Today badges, event sources and refresh rules preserved. 61 to 26 JavaScript definitions; native transition latency is not measured.';
 return {widget:w,report:{captions,actions,addedVariables,extraConditionalYearLabels:22,
  scriptsBefore:61,scriptsAfter:26,variablesBefore:52,variablesAfter:67,nodesBefore:1180,nodesAfter:1202}};
}
