// Widgy's existing Async + No main() source supports fetch and sendToWidgy.
// One shared variable fetches all TODAY fields; field bindings do no networking.
function loadSnapshot(endpoint) {
  var completed=false;
  function finish(data){
    if(completed)return;completed=true;
    sendToWidgy(encodeURIComponent(JSON.stringify(data)));
  }
  try {
    fetch(endpoint).then(function(response){
      if(!response || response.ok===false || (typeof response.status==='number' && response.status!==200))throw Error('calendar_unavailable');
      return response.json();
    }).then(function(data){
      if(!data || data.version!==2 || data.ok!==true || !Array.isArray(data.rows))throw Error('invalid_snapshot');
      finish(data);
    }).catch(function(){finish({version:2,ok:false});});
  } catch(error){finish({version:2,ok:false});}
}
function readSnapshot(encoded){
  try {
    var data=JSON.parse(decodeURIComponent(encoded));
    var age=Date.now()-Date.parse(data.generatedAt);
    if(data.version!==2 || data.ok!==true || !Array.isArray(data.rows) || !isFinite(age) ||
      age < -60000 || age > 900000 || Date.now() >= data.validUntil)return null;
    return data;
  }catch(error){return null;}
}
export const snapshotCode=endpoint=>`${loadSnapshot.toString()}\nloadSnapshot(${JSON.stringify(endpoint)});`;
export function fieldCode(field,index=null){
  const encoded='${widgy.calendar_bridge_snapshot}';
  let value;
  if(field==='ready')value='return data ? 1 : 0;';
  else if(field==='total')value='return data ? data.total : -1;';
  else if(field==='count')value='return data ? data.total + (data.total===1 ? " event today" : " events today") : "— events today";';
  else value=`var row=data && data.rows[${Number(index)}];return row ? row[${JSON.stringify(field)}] : ${['color','allDay'].includes(field)?'-1':'""'};`;
  return `${readSnapshot.toString()}\nfunction main(){var data=readSnapshot("${encoded}");${value}}`;
}

export function connectToday(widget,endpoint,nextID){
  let next=nextID,serial=1;
  const scalar=a=>({a:[{a,b:168,c:0,d:168}],b:0});
  const uuid=()=>`CA1E0000-0000-4000-D002-${String(serial++).padStart(12,'0')}`;
  const scriptSource=code=>({'5':'Javascript','6':'Script','10':code});
  function variable(name,code,numeric=false,async=false){
    const id=uuid();
    if(widget['36'].some(v=>v['0']===id || v['1']===name))throw Error('unexpected_template');
    const result={'0':id,'1':name,'2':numeric?2:0,'3':{z:'1',s:`Variable: ${name}`,d:scalar(800),e:scalar(200),
      '66':[{'5':'Javascript','6':async?'Async + No main()':'Script','10':code}]}};
    widget['36'].push(result);return result;
  }
  const snapshot=variable('calendar_bridge_snapshot',snapshotCode(endpoint),false,true);
  widget['36']=widget['36'].filter(v=>v!==snapshot);widget['36'].unshift(snapshot);
  const ready=variable('calendar_bridge_ready',fieldCode('ready'),true);
  variable('calendar_bridge_count',fieldCode('count'));
  const colors=[],allDays=[];
  for(let index=0;index<4;index++){
    colors.push(variable(`calendar_event_${index+1}_color`,fieldCode('color',index),true));
    allDays.push(variable(`calendar_event_${index+1}_all_day`,fieldCode('allDay',index),true));
  }
  let replaced=0;
  for(const v of widget['36']){
    if(v['1']==='calendar_remaining_today'){v['3']['66']=[scriptSource(fieldCode('total'))];replaced++;}
    const m=/^calendar_event_([1-4])_(title|location|start|end)$/.exec(v['1']);
    if(m){v['3']['66']=[scriptSource(fieldCode(m[2],Number(m[1])-1))];replaced++;}
  }
  if(replaced!==17)throw Error('unexpected_template');
  const cal=widget['1'].find(n=>n.s==='CALENDAR');
  if(!cal)throw Error('unexpected_template');
  const count=cal['1'].find(n=>n.s==='Agenda Events Count');
  count['66']=[{'5':'Custom Text','6':'Text','25':'${widgy.calendar_bridge_count}'}];
  for(let index=0;index<4;index++){
    const rank=index+1,row=cal['1'].find(n=>n.s===`Agenda · Row ${rank}`);
    if(!row)throw Error('unexpected_template');
    const accent=row['1'].find(n=>n.s===`Event ${rank} · Accent`);
    if(!accent || accent.z!=='2')throw Error('unexpected_template');
    const bars=[0,1,2,3].map(color=>({...structuredClone(accent),d0:next++,s:`Event ${rank} · Source Color ${color}`,
      g:`hexcol_CA1E000000004000A000${String(7+color).padStart(12,'0')}-100`,
      o1:{'0':colors[index]['0'],'1':0,'2':String(color)}}));
    const accentGroup={d0:accent.d0,s:accent.s,z:'13','1':bars};
    row['1'][row['1'].indexOf(accent)]=accentGroup;
    // Use the provider's actual all-day flag, not guessed 00:00/23:59 times.
    const timed=row['1'].find(n=>n.s===`Event ${rank} · Timed`);
    const midnight=row['1'].find(n=>n.s===`Event ${rank} · Starts Midnight`);
    const label=midnight?.['1'].find(n=>n.s===`Event ${rank} · All Day Label`);
    if(!timed || !label)throw Error('unexpected_template');
    timed.o1={'0':allDays[index]['0'],'1':0,'2':'0'};
    label.o1={'0':allDays[index]['0'],'1':0,'2':'1'};
    row['1'][row['1'].indexOf(midnight)]=label;
  }
  const empty=cal['1'].find(n=>n.s==='Agenda · Empty');
  empty['66']=[{'5':'Custom Text','6':'Text','25':'No events today'}];
  const failure={...structuredClone(empty),d0:next++,s:'Agenda · Connection Status',
    o1:{'0':ready['0'],'1':0,'2':'0'},'66':[{'5':'Custom Text','6':'Text','25':'Calendar unavailable'}]};
  cal['1'].unshift(failure);
  return next;
}
