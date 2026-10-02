"""Extract the approved Phenomena outlines; no synthetic or substituted font."""
import json,sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import ImageFont

font_path=Path(sys.argv[1])
font=TTFont(font_path); glyphs=font.getGlyphSet(); cmap=font.getBestCmap()
pen=BoundsPen(glyphs); glyphs[cmap[ord('H')]].draw(pen)
scale=31/pen.bounds[3]
shaper=ImageFont.truetype(str(font_path),font['head'].unitsPerEm)
out={}
for day in range(1,32):
    text=str(day); start=31-shaper.getlength(text)*scale/2; paths=[]
    for i,char in enumerate(text):
        glyph=cmap[ord(char)]; pen=SVGPathPen(glyphs); glyphs[glyph].draw(pen)
        offset=shaper.getlength(text[:i+1])-font['hmtx'].metrics[glyph][0]
        paths.append(f'<path fill="#101910" d="{pen.getCommands()}" transform="translate({start+offset*scale:.4f} 45) scale({scale:.7f} {-scale:.7f})"/>')
    out[str(day)]=f'<svg xmlns="http://www.w3.org/2000/svg" width="248" height="248" viewBox="0 0 62 62">{"".join(paths)}</svg>'
path=Path(__file__).resolve().parent.parent/'assets/calendar-glass/Calendar_Today_Glyphs.json'
path.write_text(json.dumps(out,separators=(',',':')))
print(f'Extracted {len(out)} days at approved cap height 31 and baseline 45/62')
