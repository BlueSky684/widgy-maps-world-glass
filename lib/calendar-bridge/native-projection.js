import native from './native-calendar.cjs';

// Widgy's native URL substitutions are resolved by its data-source loader.
// Unlike JavaScript-variable chains, each projected scalar is a direct JSON
// read. Local Agenda identities are sent only to this existing private bridge.
export function nativeProjection(input, encoded) {
  const get=key=>input.get(key) ?? '';
  const text=key=>{const value=get(key);return value.length<=2048&&!/\$\{widgy\./.test(value)?value:'';};
  const rows=Array.from({length:4},(_,i)=>Object.fromEntries(['title','location','start','end'].map(k=>[k,text(`n${i+1}_${k}`)])));
  const date=get('native_date'),zone=get('day_zone'),count=get('native_count');
  const hour=Number(get('native_hour')),minute=Number(get('native_minute'));
  const valid=/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^\d{1,4}$/.test(count)
    && /^\d{1,2}$/.test(get('native_hour'))&&hour<24
    && /^\d{1,2}$/.test(get('native_minute'))&&minute<60
    && zone&&!/\$\{widgy\./.test(zone);
  const result=JSON.parse(decodeURIComponent(native.nativeBundle(valid?encoded:'',date,zone,rows,valid?count:'',hour*60+minute,[])));
  const n=Number(count);
  // Complete defaults are returned even when calendar metadata fails. Never
  // reuse a previous response or borrow another event by its list position.
  const fields={};
  result.rows.forEach((row,i)=>Object.entries(row).forEach(([key,value])=>{fields[`calendar_event_${i+1}_${key}`]=value;}));
  return {...result,fields,version:2,bundle:encodeURIComponent(JSON.stringify(result)),
    ready:valid?1:0,count:native.countLabel(valid?count:''),
    spacious:valid&&n>0&&n<=2&&result.rows.slice(0,n).some(r=>r.flight===1)?1:0,
    status:!valid?'invalid-native-input':!encoded?'metadata-unavailable':
      result.rows.some(r=>r.flight===1)?'flight-matched':'native-fallback'};
}
