// Runs only in the owner's browser. The private export is never uploaded to the repository.
export function personalizedWidget(original, endpoint) {
  if (original['3'] !== 'Widgy Home Glass Calendar C16') throw new Error('unexpected_template');
  const url=new URL(endpoint);
  if (url.protocol!=='https:' || url.pathname!=='/api/calendar-dots' || !url.searchParams.get('token')) throw new Error('invalid_endpoint');
  const widget=structuredClone(original);
  const scalar=a=>({a:[{a,b:168,c:0,d:168}],b:0});
  let next=widget.a2, panes=0, native=0;
  function visit(nodes) {
    for (const n of nodes) {
      if (n.z==='10' && /^Calendar · Native Month · [456] Weeks$/.test(n.s || '')) {
        delete n['53']; delete n['54']; native++;
      }
      if (n.z==='13') {
        visit(n['1']);
        const match=/^Calendar · Month Offset (-?\d+)$/.exec(n.s || '');
        if (match) {
          const imageURL=new URL(endpoint); imageURL.searchParams.set('offset',match[1]);
          n['1'].unshift({z:'5','1':'Web URL','2':imageURL.href,'3':true,d0:next++,
            s:'Calendar · Browser Event Dots',b:scalar(0),c:scalar(0),d:scalar(1600),e:scalar(1600)});
          panes++;
        }
      }
    }
  }
  visit(widget['1']);
  if (panes!==25 || native!==75) throw new Error('unexpected_template');
  widget.a2=next;
  widget['3']='Widgy Calendar Browser Test';
  widget['4']='Private test copy based on C16. Calendar dots read selected Google/iCloud calendars through an encrypted render link and use a fixed four-color palette. Up to four dots per day. Native TODAY rows still use their existing device sources and row colors. Import separately; on-device alignment and refresh require verification. Keep this file private. Renew the link within one year or after provider access changes.';
  return widget;
}
