import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {personalizedWidget} from './calendar-connect-widget.js';
import {perf5DiagnosticBaseline} from './widget-home-map-diagnostic.js';

const template=JSON.parse(readFileSync(new URL('./Widgy_Home_Glass_Calendar_C16.json',import.meta.url)));
const widget=personalizedWidget(template,'https://example.test/api/calendar-dots?token=synthetic','https://example.test/api/calendar-widget?token=synthetic');
const ring=w=>w['1'].find(n=>n.s==='HOME')['1'].filter(n=>/^Steps Goal Ring · \d+%$/.test(n.s));
const approved=ring(template),actual=ring(widget),legacy=ring(perf5DiagnosticBaseline(widget));
assert.equal(actual.length,100);
assert.deepEqual(actual,approved); // Includes shapes, colors, frames and conditions.
const shown=(n,p)=>n.o1['1']===5?p>=Number(n.o1['2']):p===Number(n.o1['2']);
async function render(layers,p){
  const shapes=layers.filter(n=>shown(n,p)).map(n=>{
    const points=JSON.parse(Buffer.from(n['2'],'base64').toString()).items.find(x=>x.id===n['3']).shape.points;
    return '<polygon points="'+points.map(({x,y})=>`${x*142},${y*142}`).join(' ')+'"/>';
  }).join('');
  return sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="284" height="284" viewBox="0 0 142 142"><g fill="#c5ff0a">'+shapes+'</g></svg>')).ensureAlpha().raw().toBuffer();
}
function alphaAt(data,degree,r=64.5){
  const a=(degree-90)*Math.PI/180,x=Math.round((71+r*Math.cos(a))*2),y=Math.round((71+r*Math.sin(a))*2);
  return data[(y*284+x)*4+3];
}
assert.equal(alphaAt(await render(legacy,34),45),0,'Reproduce the perf-5 gap');
assert.equal(alphaAt(await render(actual,34),45),255,'Restore the approved arc');
for(let p=0;p<=100;p++){
  assert.equal(actual.filter(n=>shown(n,p)).length,p);
  const data=await render(actual,p);
  for(let degree=0;degree<360;degree++){
    assert.equal(alphaAt(data,degree,50),0,'Ring center must stay hollow');
    if(p>0 && degree<=p*3.6)assert(alphaAt(data,degree)>245,`Gap at ${p}%/${degree}°`);
    if(p<95 && degree>p*3.6+9 && degree<351)assert.equal(alphaAt(data,degree),0,'Unfilled arc');
  }
}
for(const path of ['widgy-copy.js','calendar-connect.js','calendar-widget-export.js','calendar-connect-widget.js']){
  assert(!readFileSync(new URL('./'+path,import.meta.url),'utf8').includes('perf5DiagnosticBaseline'),'Legacy diagnostic baseline must not enter normal copy flows');
}
console.log('Passed: actual personalized ring matches approved C16 at all 101 progress states; perf-5 defect reproduced; cumulative fill and hollow center verified; legacy conditions isolated to diagnostics.');
