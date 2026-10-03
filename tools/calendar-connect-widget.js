// Runs only in the owner's browser. The private export is never uploaded to the repository.
import {connectToday} from './calendar-connect-today.js?v=home-5';
export function personalizedWidget(original, endpoint, widgetEndpoint) {
  if (original['3'] !== 'Widgy Home Glass Calendar C16') throw new Error('unexpected_template');
  const url=new URL(endpoint);
  if (url.protocol!=='https:' || url.pathname!=='/api/calendar-dots' || !url.searchParams.get('token')) throw new Error('invalid_endpoint');
  if(widgetEndpoint){
    const target=new URL(widgetEndpoint);
    if(target.origin!==url.origin || target.pathname!=='/api/calendar-widget' || !target.searchParams.get('token'))throw Error('invalid_endpoint');
  }
  const widget=structuredClone(original);
  const scalar=a=>({a:[{a,b:168,c:0,d:168}],b:0});
  let next=widget.a2, panes=0, native=0;
  function imageVariable(imageURL,offset){
    const name=`calendar_dots_url_${offset<0?'m':'p'}${Math.abs(offset)}`;
    const id=`CA1E0000-0000-4000-D003-${String(offset+13).padStart(12,'0')}`;
    if(widget['36'].some(v=>v['0']===id || v['1']===name))throw Error('unexpected_template');
    // Match the map's dynamic full-URL binding. The minute bucket prevents a
    // previous PNG being reused indefinitely without requesting on every read.
    imageURL.searchParams.set('render','refresh-1');
    const code=`function main(){return ${JSON.stringify(imageURL.href)} + "&refresh=" + Math.floor(Date.now()/60000);}`;
    widget['36'].push({'0':id,'1':name,'2':0,'3':{z:'1',s:`Variable: ${name}`,d:scalar(800),e:scalar(200),
      '66':[{'5':'Javascript','6':'Script','10':code}]}});
    return '${widgy.'+name+'}';
  }
  function visit(nodes) {
    for (const n of nodes) {
      if (n.z==='10' && /^Calendar · Native Month · [456] Weeks$/.test(n.s || '')) {
        delete n['53']; delete n['54']; native++;
      }
      if (n.z==='13') {
        visit(n['1']);
        const match=/^Calendar · Month Offset (-?\d+)$/.exec(n.s || '');
        if (match) {
          const imageURL=new URL(widgetEndpoint || endpoint); imageURL.searchParams.set('offset',match[1]);
          if(widgetEndpoint)imageURL.searchParams.set('view','dots');
          n['1'].unshift({z:'5','1':'Web URL','2':imageVariable(imageURL,Number(match[1])),'3':true,d0:next++,
            s:'Calendar · Browser Event Dots',b:scalar(0),c:scalar(0),d:scalar(1600),e:scalar(1600)});
          panes++;
        }
      }
    }
  }
  visit(widget['1']);
  if (panes!==25 || native!==75) throw new Error('unexpected_template');
  if(widgetEndpoint)next=connectToday(widget,widgetEndpoint,next);
  widget.a2=next;
  widget['3']='Widgy Calendar Browser Test';
  widget['4']='Private test copy based on C16. Calendar dots read selected Google/iCloud calendars through an encrypted render link and use a fixed four-color palette. Up to four dots per day. Native TODAY rows still use their existing device sources and row colors. Import separately; on-device alignment and refresh require verification. Keep this file private. Renew the link within one year or after provider access changes.';
  if(widgetEndpoint){
    widget['3']='Widgy Calendar Unified';
    widget['4']='Private C16-based calendar. Month dots, TODAY and Home read the same selected calendars. TODAY keeps all daily events, with up to four rows and dots. Home shows the full daily total and the active or next timed event today, falling back to an all-day event. Reminders use the separate iPhone count. The private link grants event titles, times and locations; keep this export private. Renew within one year or after provider access changes. Verify refresh on the device.';
  }
  return widget;
}
