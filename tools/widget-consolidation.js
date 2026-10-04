// Browser-only transformation of an already personalized export. No requests,
// new providers, scripts, fonts, images, geometry or refresh behavior.
const clone=value=>structuredClone(value);
const key=value=>JSON.stringify(value);
const walk=nodes=>nodes.flatMap(n=>[n,...(n.z==='13'?walk(n['1']):[])]);
const fail=()=>{throw Error('unexpected_template');};

function tapTargets(widget){
  return new Set(walk(widget['1']).flatMap(n=>n['1a']?.startsWith('button_')?
    n['1a'].slice(7).split(/[-,]/).map(Number):[]));
}

// Factor conjunctions over CONTIGUOUS drawings only. Reordering drawings would
// change overlapping masks or unusual multi-condition weather states. Every
// leaf keeps the exact same set of native predicates, including missing inputs.
function factorWeather(home,targets){
  const roots=home['1'].filter(n=>n.z==='13' && /^WX · /.test(n.s));
  if(roots.length!==14)fail();
  const first=home['1'].indexOf(roots[0]);
  if(!roots.every((n,i)=>home['1'][first+i]===n))fail();
  const groups=[],predicates=new Map(),records=[];
  const frame={a:[{a:1600,b:1301,c:0,d:1301}],b:0};
  function collect(nodes,path=[]){
    for(const n of nodes){
      if(n.z!=='13'){records.push({node:n,conditions:[...new Set(path)]});continue;}
      if(Object.keys(n).sort().join(',')!=='1,d,d0,e,o1,s,z' ||
          key(n.d)!==key(frame) || key(n.e)!==key(frame) || targets.has(n.d0) ||
          Object.keys(n.o1||{}).sort().join(',')!=='0,1,2')fail();
      groups.push(n);
      const id=key(n.o1);predicates.set(id,n.o1);
      collect(n['1'],[...path,id]);
    }
  }
  collect(roots);
  if(groups.length!==91 || records.length!==46)fail();

  // Adjacent leaves with an identical conjunction form one indivisible run.
  const runs=[];
  for(const record of records){
    const signature=key([...record.conditions].sort());
    if(runs.at(-1)?.signature===signature)runs.at(-1).nodes.push(record.node);
    else runs.push({signature,conditions:record.conditions,nodes:[record.node]});
  }
  const memo=new Map();
  function solve(lo,hi,excluded=new Set()){
    const cacheKey=key([lo,hi,[...excluded].sort()]);
    if(memo.has(cacheKey))return memo.get(cacheKey);
    const common=runs[lo].conditions.filter(p=>!excluded.has(p) &&
      runs.slice(lo,hi).every(r=>r.conditions.includes(p)));
    const next=new Set([...excluded,...common]);
    let result;
    if(hi-lo===1)result={cost:common.length,common,nodes:runs[lo].nodes};
    else{
      let best;
      for(let split=lo+1;split<hi;split++){
        const left=solve(lo,split,next),right=solve(split,hi,next);
        const cost=common.length+left.cost+right.cost;
        if(!best || cost<best.cost)best={cost,common,children:[left,right]};
      }
      result=best;
    }
    memo.set(cacheKey,result);return result;
  }
  const plan=solve(0,runs.length);
  let used=0;
  function build(p){
    let nodes=p.nodes || p.children.flatMap(build);
    for(const condition of [...p.common].reverse()){
      const source=groups[used++];
      nodes=[{...source,s:'WX · Shared native condition',o1:clone(predicates.get(condition)),'1':nodes}];
    }
    return nodes;
  }
  const replacement=build(plan);
  if(used>=groups.length)fail();
  home['1'].splice(first,roots.length,...replacement);
  return {before:groups.length,after:used,drawings:records.length};
}

function simplifyCalendar(calendar,targets){
  let removed=0;
  for(let rank=1;rank<=4;rank++){
    const row=calendar['1'].find(n=>n.s===`Agenda · Row ${rank}`);
    if(!row || row.z!=='13')fail();
    for(const name of [`Event ${rank} · Original Title Layout`,`Event ${rank} · Accent`]){
      const index=row['1'].findIndex(n=>n.s===name),g=row['1'][index];
      if(!g || g.z!=='13' || targets.has(g.d0))fail();
      if(name.endsWith('Accent')){
        if(Object.keys(g).sort().join(',')!=='1,d0,s,z' || g['1'].length!==4)fail();
        row['1'].splice(index,1,...g['1']);
      }else{
        // Native condition moves to its single unchanged drawing. No transform,
        // manual visibility or group effect exists to preserve on this wrapper.
        if(Object.keys(g).sort().join(',')!=='1,d0,o1,s,z' || g['1'].length!==1 ||
            g['1'][0].z!=='1' || g['1'][0].o1)fail();
        row['1'].splice(index,1,{...g['1'][0],o1:clone(g.o1)});
      }
      removed++;
    }
  }
  return {removed};
}

export function consolidateWidget(original){
  if(original['3']!=='Widgy Calendar Unified')fail();
  const widget=clone(original),targets=tapTargets(widget);
  const home=widget['1'].find(n=>n.s==='HOME');
  const calendar=widget['1'].find(n=>n.s==='CALENDAR');
  if(!home || !calendar)fail();
  factorWeather(home,targets);
  simplifyCalendar(calendar,targets);
  // The normal export remains the control. This full-function copy requires
  // actual Widgy validation; source-level equivalence is not a latency result.
  widget['3']='Widgy Consolidated Home Calendar 1';
  widget['4']='Full appearance and live functions retained from the normal Unified export. Share repeated native Home weather conditions without changing drawing order or predicates. Remove eight neutral Calendar wrappers. Original map/city, approved live clock, native data, all 81 variables, 25 month panes, refresh URLs and navigation retained. Offline equivalence verified; native Widgy rendering and transition speed remain to be checked. Keep this private calendar export private.';
  return widget;
}
