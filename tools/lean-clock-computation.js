import assert from 'node:assert/strict';
import {flatten, variableReferences} from './compact-widget-structure.js';

export const MONTH_LAYOUT_SCRIPT = `function main(){
  var now=new Date(),year=now.getFullYear()-1,month=now.getMonth();
  var weekday=new Date(year,month,1).getDay(),out="|";
  for(var offset=-12;offset<=12;offset++){
    var leap=year%4===0&&(year%100!==0||year%400===0);
    var days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month];
    out+=offset+":"+Math.ceil((weekday+days)/7)+"|";
    out+="year:"+offset+":"+(year-now.getFullYear())+"|";
    weekday=(weekday+days)%7;
    if(++month===12){month=0;year++;}
  }
  return out;
}`;
export const DAY_LABEL_SCRIPT = `function main(){
  var now=new Date();
  var seconds=now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
  return Math.floor(seconds*100/86400)+"%";
}`;

// Independent local clocks: do not replace these with a shared async data
// snapshot or introduce a new variable-order dependency into the widget.
export function withLeanClockComputation(input){
  assert.equal(input['3'],'Widgy Calendar City Country 1');
  assert.equal(flatten(input['1']).length,1192);assert.equal(input['36'].length,63);
  const w=structuredClone(input),ns=flatten(w['1']);
  const day=w['36'].find(v=>v['1']==='day_progress');assert(day);
  const label=ns.find(n=>n.d0===6123),unavailable=ns.find(n=>n.d0===80205);
  assert.deepEqual(label['66'],[{'5':'Custom Text','6':'Text','25':'${widgy.day_progress}%'}]);
  assert.deepEqual(label.o1,{'0':day['0'],'1':5,'2':'0'});
  assert.deepEqual(unavailable.o1,{'0':day['0'],'1':0,'2':'-1'});
  assert.deepEqual(day['3']['66'],[{'5':'Javascript','6':'Script','10':'function main() {\n  var now = new Date();\n  var elapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();\n  return Math.floor(elapsed * 100 / 86400);\n}'}]);
  const restoredCheck=structuredClone(w);restoredCheck['36']=restoredCheck['36'].filter(v=>v['1']!=='day_progress');
  restoredCheck['1'].find(n=>n.d0===245)['1']=restoredCheck['1'].find(n=>n.d0===245)['1'].filter(n=>![6123,80205].includes(n.d0));
  assert.equal(variableReferences(restoredCheck,[day]).size,0,'No other consumer may be removed');
  label['66']=[{'5':'Javascript','6':'Script','10':DAY_LABEL_SCRIPT}];delete label.o1;
  w['1'].find(n=>n.d0===245)['1']=w['1'].find(n=>n.d0===245)['1'].filter(n=>n.d0!==80205);
  w['36']=w['36'].filter(v=>v['1']!=='day_progress');
  const layout=w['36'].find(v=>v['1']==='calendar_month_layouts');assert(layout);
  layout['3']['66'][0]['10']=MONTH_LAYOUT_SCRIPT;
  const names=w['36'].filter(v=>/^calendar_month_name_\d+$/.test(v['1']));assert.equal(names.length,12);
  for(const v of names){
    const offset=Number(v['1'].split('_').at(-1));
    assert(offset>=0&&offset<12);
    v['3']['66'][0]['10']=`function main(){return ['January','February','March','April','May','June','July','August','September','October','November','December'][(new Date().getMonth()+${offset})%12];}`;
  }
  w['3']='Widgy Lean Clock and Data 1';
  w['4']='Full City Country 1 widget with direct day-percentage text and simpler local month calculations. Native day gauge, live clock, all 25 months, complete navigation, approved artwork, exact GPS and live map/city/country retained. No tap dots. Server reuses parsed event times between Home and Calendar without extending freshness. Offline equivalence tested; phone transition speed remains unmeasured. Keep City Country 1 as backup.';
  return {widget:w,report:{before:{nodes:1192,variables:63},after:{nodes:flatten(w['1']).length,variables:w['36'].length},removedVariable:'day_progress',removedUnreachableLayer:80205,changedText:6123,changedVariables:['calendar_month_layouts',...names.map(v=>v['1'])],monthDateConstructions:{before:75,after:14},nativeLatencyMeasured:false}};
}
