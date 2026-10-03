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
  else if(field==='long_hebrew')value=`var row=data && data.rows[${Number(index)}];return row && /[\\u0590-\\u05ff]/.test(row.title) && (Array.from(row.title).length>18 || /[\\r\\n]/.test(row.title)) ? 1 : 0;`;
  else if(field==='title_layout')value=`var row=data && data.rows[${Number(index)}];if(!row || !/[\\u0590-\\u05ff]/.test(row.title))return 0;return Array.from(row.title).length>18 || /[\\r\\n]/.test(row.title) ? 2 : 1;`;
  else value=`var row=data && data.rows[${Number(index)}];return row ? row[${JSON.stringify(field)}] : ${['color','allDay'].includes(field)?'-1':'""'};`;
  return `${readSnapshot.toString()}\nfunction main(){var data=readSnapshot("${encoded}");${value}}`;
}

function detailIconCode(index,cases,fallback){
  const encoded='${widgy.calendar_bridge_snapshot}';
  return `${readSnapshot.toString()}\nfunction main(){var data=readSnapshot("${encoded}"),row=data && data.rows[${index}];if(!row)return -1;var text=String(row.location || ''),cases=${JSON.stringify(cases)};for(var i=0;i<cases.length;i++)if(text.indexOf(cases[i][0])!==-1)return cases[i][1];return ${fallback};}`;
}

function homeValue(data,field){
  var home=data && data.home && Date.now()<data.home.validUntil ? data.home : null;
  if(field==='count')return data ? String(data.total) : '—';
  if(field==='event_word')return data && data.total===1 ? 'event •' : 'events •';
  if(field==='label')return home ? home.label : 'NEXT EVENT';
  if(field==='title')return home ? home.title : (data && data.home ? 'Updating…' : 'Calendar unavailable');
  if(field==='time')return home ? home.time : '';
  if(field==='meta')return home ? home.label+(home.time ? ' · '+home.time : '') : '';
  if(!home || !home.compact)return 0;
  // The original side-by-side title frame only fits short names comfortably.
  // Keep that C16 layout for short names; give longer names the full row.
  return Array.from(home.title || '').length>12 || /[\r\n]/.test(home.title || '') ? 2 : 1;
}
function loadHomeField(endpoint,field){
  var completed=false;
  function finish(data){
    if(completed)return;completed=true;
    sendToWidgy(homeValue(data,field));
  }
  try{
    // A direct async source avoids depending on another async Widgy variable
    // having completed before this field is evaluated on the Home tab.
    var url=endpoint+'&view=today&render=perf-1&refresh='+Math.floor(Date.now()/60000);
    fetch(url).then(function(response){
      if(!response || response.ok===false || (typeof response.status==='number' && response.status!==200))throw Error('calendar_unavailable');
      return response.json();
    }).then(function(data){
      finish(readSnapshot(encodeURIComponent(JSON.stringify(data))));
    }).catch(function(){finish(null);});
  }catch(error){finish(null);}
}
export function homeFieldCode(field,endpoint){
  if(!['count','event_word','label','title','time','compact','meta'].includes(field))throw Error('invalid_home_field');
  return `${readSnapshot.toString()}\n${homeValue.toString()}\n${loadHomeField.toString()}\nloadHomeField(${JSON.stringify(endpoint)},${JSON.stringify(field)});`;
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
  const colors=[],allDays=[],titleLayouts=[];
  for(let index=0;index<4;index++){
    colors.push(variable(`calendar_event_${index+1}_color`,fieldCode('color',index),true));
    allDays.push(variable(`calendar_event_${index+1}_all_day`,fieldCode('allDay',index),true));
    titleLayouts.push(variable(`calendar_event_${index+1}_title_layout`,fieldCode('title_layout',index),true));
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
    const hebrew=row['1'].find(n=>n.s===`Event ${rank} · Hebrew Title`);
    const otherTitles=row['1'].find(n=>n.s===`Event ${rank} · Without א`);
    const findTitle=(nodes,name)=>{
      for(const node of nodes){
        if(node.s===name)return node;
        if(node.z==='13'){const found=findTitle(node['1'],name);if(found)return found;}
      }
    };
    const latin=findTitle(row['1'],`Event ${rank} · Title`);
    const latinDetail=findTitle(row['1'],`Event ${rank} · Title With Detail`);
    const location=widget['36'].find(v=>v['1']===`calendar_event_${rank}_location`);
    if(!hebrew || !otherTitles || !latin || !latinDetail || !location)throw Error('unexpected_template');
    // Keep Hebrew titles in the same horizontal column as the short names.
    // Long names retain the taller area, with right alignment inside that
    // column rather than at the far edge of the wider Latin title frame.
    // One classification replaces 27 copies and a deeply nested letter chain.
    delete hebrew.o1;
    const normalTitles={z:'13',d0:next++,s:`Event ${rank} · Original Title Layout`,
      o1:{'0':titleLayouts[index]['0'],'1':0,'2':'1'},'1':[hebrew]};
    const latinTitles={z:'13',d0:next++,s:`Event ${rank} · Latin Title Layout`,
      o1:{'0':titleLayouts[index]['0'],'1':0,'2':'0'},'1':[latinDetail,latin]};
    const expanded={...structuredClone(hebrew),d0:next++,s:`Event ${rank} · Long Hebrew Title`,
      '2':scalar(2),o1:{'0':location['0'],'1':0,'2':''}};
    for(const key of ['c','e'])expanded[key]=structuredClone(latin[key]);
    const withDetail={...structuredClone(hebrew),d0:next++,s:`Event ${rank} · Long Hebrew Title With Detail`,
      '2':scalar(2),o1:{'0':location['0'],'1':1,'2':''}};
    const expandedTitles={z:'13',d0:next++,s:`Event ${rank} · Expanded Hebrew Title Layout`,
      o1:{'0':titleLayouts[index]['0'],'1':0,'2':'2'},'1':[expanded,withDetail]};
    const insertAt=row['1'].indexOf(hebrew);
    row['1']=row['1'].filter(n=>n!==hebrew && n!==otherTitles);
    row['1'].splice(insertAt,0,normalTitles,latinTitles,expandedTitles);
    // Preserve the exact detail-icon matching order and drawings, but select
    // one of the distinct icons instead of retaining a 24-level condition tree.
    const details=row['1'].find(n=>n.s===`Event ${rank} · Dynamic Detail Icon`);
    if(!details)throw Error('unexpected_template');
    const icons=[],cases=[],signatures=new Map();let fallback=-1;
    function collectIcons(nodes){
      for(const node of nodes){
        if(node.z==='13'){collectIcons(node['1']);continue;}
        if(node.z!=='4')throw Error('unexpected_template');
        const shape=Object.fromEntries(Object.entries(node).filter(([key])=>!['d0','s','o1'].includes(key)).sort(([a],[b])=>a.localeCompare(b)));
        const signature=JSON.stringify(shape);
        let kind=signatures.get(signature);
        if(kind===undefined){kind=icons.length;signatures.set(signature,kind);icons.push(node);}
        if(node.o1){
          if(node.o1['0']!==location['0'] || node.o1['1']!==2)throw Error('unexpected_template');
          cases.push([node.o1['2'],kind]);
        }else fallback=kind;
      }
    }
    collectIcons(details['1']);
    if(fallback<0)throw Error('unexpected_template');
    const detailKind=variable(`calendar_event_${rank}_detail_icon`,detailIconCode(index,cases,fallback),true);
    details['1']=icons.map((node,kind)=>({...node,o1:{'0':detailKind['0'],'1':0,'2':String(kind)}}));
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
    if(rank<4){
      const separator=row['1'].find(n=>n.s===`Event ${rank} · Separator`);
      const following=cal['1'].find(n=>n.s===`Agenda · Row ${rank+1}`);
      if(!separator || !following)throw Error('unexpected_template');
      row['1'].splice(row['1'].indexOf(separator),1);
      // Keep hairlines outside row groups, above their contents. Match the
      // calendar grid's visible rule thickness and show only between events.
      separator.e=scalar(1.621622);
      separator.o1=structuredClone(following.o1);
      cal['1'].unshift(separator);
    }
  }
  const empty=cal['1'].find(n=>n.s==='Agenda · Empty');
  empty['66']=[{'5':'Custom Text','6':'Text','25':'No events today'}];
  const failure={...structuredClone(empty),d0:next++,s:'Agenda · Connection Status',
    o1:{'0':ready['0'],'1':0,'2':'0'},'66':[{'5':'Custom Text','6':'Text','25':'Calendar unavailable'}]};
  cal['1'].unshift(failure);
  const home=widget['1'].find(n=>n.s==='HOME');
  if(!home)throw Error('unexpected_template');
  const homeFields={};
  for(const field of ['count','event_word','title','meta']){
    homeFields[field]=variable(`calendar_home_${field}`,homeFieldCode(field,endpoint),field==='compact',true);
  }
  const homeNode=name=>{
    const node=home['1'].find(n=>n.s===name);
    if(!node || node.z!=='1')throw Error('unexpected_template');
    return node;
  };
  const bind=(name,field)=>{
    const node=homeNode(name);
    node['66']=[{'5':'Custom Text','6':'Text','25':'${widgy.calendar_home_'+field+'}'}];return node;
  };
  bind('Events Summary · 1','count');bind('Events Summary · 2','event_word');
  homeNode('Events Summary · 3')['66']=[{'5':'Agenda (Today)','6':'Reminder Events Today'}];
  const label=bind('Next Event Label','meta');
  const title=bind('Next Event Title','title'),time=homeNode('Next Event Time');
  // One stable hierarchy: full-width event name, then status and 24-hour time
  // together beneath it. Stay inside the original event area and keep fonts.
  const top=label.c.a[0].a;
  const bottom=title.c.a[0].a+title.e.a[0].a;
  const width=time.b.a[0].a+time.d.a[0].a-title.b.a[0].a;
  title.c=scalar(top);title.d=scalar(width);
  label.b=structuredClone(title.b);label.d=scalar(width);
  label.c=scalar(top+title.e.a[0].a);
  label.e=scalar(bottom-label.c.a[0].a);
  home['1']=home['1'].filter(n=>n!==time);
  return next;
}
