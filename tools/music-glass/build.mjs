import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {nativeOutline} from '../device-glass/design.mjs';
import {outlinedText} from '../../lib/weather/render.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = new URL('./scripting/', import.meta.url);
const fontData = JSON.parse(fs.readFileSync(new URL('../../assets/weather-premium/glyphs.json', import.meta.url)));
const fonts = Object.fromEntries(['Regular', 'Bold'].map(name => [name, fontData[name]]));
for (const font of Object.values(fonts)) {
  if (!font.glyphs['.']) throw new Error('Missing period glyph');
}
fs.writeFileSync(new URL('glyphs.ts', dir), '// Generated from the same Phenomena outlines as Device Glass.\n' +
  'type Font = {cap:number; glyphs:Record<string,{advance:number;path:string}>; kern:Record<string,number>};\n' +
  `export const fonts: Record<"Regular"|"Bold",Font> = ${JSON.stringify(fonts)}\n`);

const device = fs.readFileSync(new URL('../../assets/device-glass/chrome-d9.svg', import.meta.url), 'utf8');
const gradient = id => device.match(new RegExp(`<linearGradient id="${id}"[^>]*>[\\s\\S]*?</linearGradient>`))[0];
const f = fonts.Bold;
const wordWidth = [...'MUS'].reduce((w, c, i, a) => w + f.glyphs[c].advance + (i ? f.kern[a[i-1]+c] || 0 : 0), 0) * 34 / f.cap;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="530" height="530" viewBox="0 0 530 530">
<defs>${['base', 'rim', 'bezel'].map(gradient).join('')}</defs>
<rect width="530" height="530" fill="url(#base)"/>
<path d="${nativeOutline(8)}" fill="none" stroke="url(#rim)" stroke-width="1.3"/>
<path d="${nativeOutline(9.8)}" fill="none" stroke="#b5cede" stroke-opacity=".15" stroke-width=".55"/>
${outlinedText('MUS',34,75,34,'#F4F7FA','Bold')}
${outlinedText('IC',34+wordWidth,75,34,'#C5FF0A','Bold')}
${outlinedText('APPLE MUSIC',35,99,13,'#AEB7C6')}
<circle cx="469" cy="65" r="18" fill="#091116" stroke="#35434e" stroke-width="1"/>
<rect x="36.5" y="115.5" width="239" height="239" rx="23" fill="#091116" stroke="#536b7b" stroke-width="1.5"/>
<path d="M296 137V334" stroke="#35434e" stroke-width="1.1"/>
<path d="M47 371H483Q504 371 504 392V464Q504 508 460 508H70Q26 508 26 464V392Q26 371 47 371Z" fill="#091116" stroke="#35434e" stroke-width="1.15"/>
<path d="M44 414H486" stroke="#35434e" stroke-width=".8"/>
<rect x="122" y="390" width="286" height="6" rx="3" fill="#53616d"/>
<circle cx="265" cy="459" r="43" fill="#0c1922" stroke="url(#bezel)" stroke-width="1.8"/>
<circle cx="265" cy="459" r="39.5" fill="#091116" stroke="#38525f" stroke-width="1"/>
</svg>`;
fs.writeFileSync(new URL('../../assets/music-glass/chrome-m1.svg', import.meta.url), svg);
const png = await sharp(Buffer.from(svg)).withIccProfile('srgb').png().toBuffer();
fs.writeFileSync(new URL('chrome.png', dir), png);
fs.writeFileSync(new URL('../../assets/music-glass/chrome-m1.png', import.meta.url), png);

// Scripting remote import accepts a ZIP whose root is one named script folder.
// Use the documented ZIP route instead of guessing the .scripting file encoding.
const zip = spawnSync('python', ['-c', `
import pathlib, zipfile
root=pathlib.Path(${JSON.stringify(root)})
source=root/'tools/music-glass/scripting'
out=root/'tools/Music_Glass_M1.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in sorted(source.iterdir()):
  if p.is_file():
   info=zipfile.ZipInfo('Music Glass M1/'+p.name, date_time=(2026,10,12,0,0,0))
   info.compress_type=zipfile.ZIP_DEFLATED
   z.writestr(info,p.read_bytes())
print(out.name,out.stat().st_size,'bytes')
`], {encoding:'utf8'});
if (zip.status) throw new Error(zip.stderr);
console.log(zip.stdout.trim());

// Readable single bundle for the user's copy-page workflow; ZIP is the installer.
const text = fs.readdirSync(dir).filter(p => /\.(tsx?|json)$/.test(p)).map(p =>
  `// FILE: ${p}\n${fs.readFileSync(new URL(p, dir), 'utf8')}`).join('\n\n');
fs.writeFileSync(new URL('../Music_Glass_M1_Source.txt', import.meta.url), text);
