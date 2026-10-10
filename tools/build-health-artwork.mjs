import fs from 'node:fs';
import sharp from 'sharp';
import {healthScene} from './health-design.js';
fs.mkdirSync('assets/health-premium',{recursive:true});
const scene=healthScene();
await sharp(Buffer.from(scene.svg)).png({compressionLevel:9}).toFile('assets/health-premium/chrome-h1.png');
fs.writeFileSync('assets/health-premium/layout.json',JSON.stringify({fields:scene.fields,rings:scene.rings,bars:scene.bars},null,2)+'\n');
fs.mkdirSync('work/health-qa',{recursive:true});
for(const [name,values]of Object.entries({sample:{},empty:Object.fromEntries(scene.fields.map(f=>[f.key,f.key==='date'?'Saturday, 10 October 2026':f.key.startsWith('day')?'SAT':'—']))})){
 if(name==='empty')for(const k of ['move','exercise','stand','steps'])values[k+'Progress']=0;
 await sharp(Buffer.from(healthScene(values).svg)).resize(1135).png().toFile(`work/health-qa/${name}.png`);
}
console.log(JSON.stringify({nativeFields:scene.fields.length,rings:scene.rings.length,historyDaysPending:6}));
