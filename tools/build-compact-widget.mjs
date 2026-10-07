import fs from 'node:fs';
import {compactWidgetStructure} from './compact-widget-structure.js';
const [input,output,reportPath]=process.argv.slice(2);
if(!input||!output||input===output)throw Error('Provide distinct local input/output paths');
const {widget,report}=compactWidgetStructure(JSON.parse(fs.readFileSync(input,'utf8')));
const data=JSON.stringify(widget);fs.writeFileSync(output,data);
if(reportPath)fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({before:report.before,after:report.after,bytes:Buffer.byteLength(data),inlined:report.inlined.map(x=>x.name),pruned:report.pruned}));
