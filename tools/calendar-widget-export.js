import {personalizedWidget} from './calendar-connect-widget.js?v=perf-5';

// Same-origin, existing owner session. Keep the personalized payload in memory.
export async function prepareWidget(){
  const response=await fetch('/api/calendar-bridge?op=export',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({version:2}),cache:'no-store'
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error || 'connection_failed');
  if(!data.widgetEndpoint)throw new Error('connection_failed');
  const template=await fetch('./Widgy_Home_Glass_Calendar_C16.json',{cache:'no-store'});
  if(!template.ok)throw new Error('unexpected_template');
  return {data,payload:JSON.stringify(personalizedWidget(await template.json(),data.endpoint,data.widgetEndpoint))};
}
