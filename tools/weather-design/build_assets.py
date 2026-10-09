"""Compile the approved technical artwork; no AI or runtime font substitution."""
from pathlib import Path
import json, hashlib
from fontTools.pens.svgPathPen import SVGPathPen
import weather_icon_family as family

ROOT=Path(__file__).resolve().parent
TARGET=ROOT.parents[1]/'assets/weather-premium'
TARGET.mkdir(parents=True,exist_ok=True)
source=(ROOT/'approved_layout.py').read_text()
prefix,body=source.split('W,H=1207,1256',1)
ns={'__file__':str(ROOT/'approved_layout.py'),'__name__':'weather_assets'}
exec(prefix,ns)
original_text,original_rect=ns['text'],ns['rect']
def text(s,x,y,*args,**kwargs):
    # Only typography which is invariant goes into the static chrome.
    if y in [80,119,130,204,403,451,343,445,443,604,662,698,1124]:return 0
    if y>=820 and y<=1020:return 0
    return original_text(s,x,y,*args,**kwargs)
def rect(x,y,w,h,r=0,fill='none',stroke=None,sw=1,extra=''):
    if y==458 or fill=='url(#range)':return
    if x==0 and y==0 and w==1207:return # outside-widget backdrop
    if x==5 and y==12 and w==1125:return # outside-widget drop shadow
    return original_rect(x,y,w,h,r,fill,stroke,sw,extra)
ns['text']=text;ns['rect']=rect
original_drop=ns['drop']
ns['drop']=lambda x,y,sz=13: original_drop(x,y,20 if sz==13 else 18)
ns['nav_icon']=lambda *a,**kw: None
ns['weather']=lambda *a,**kw: None
ns['satin_definitions']=family.definitions
body=body.split("(OUT/'Widgy_Weather_Premium_Technical.svg')",1)[0]
# R6 retains R4 chrome geometry and removes only the US prefix from AQI.
a=body.index('panel(248,246,True)');b=body.index('panel(512,214)')
body=body[:a]+"""panel(248,246,True)
line(498,280,498,460,'#344750',1.4)
for x in [713,906]:
    line(x,286,x,356,'#344750',1)
    line(x,391,x,460,'#344750',1)
line(529,374,1080,374,'#344750',1)
for label,x in [('Feels Like',611),('High / Low',804),('AQI',994)]:
    text(label,x,312,20,MUTED,anchor='middle')
for label,x in [('Humidity',611),('Wind',804),('UV Index',994)]:
    text(label,x,407,20,MUTED,anchor='middle')

"""+body[b:]

exec('W,H=1207,1256'+body,ns)
chrome=''.join(ns['parts']).replace('width="1207" height="1256" viewBox="0 0 1207 1256"','width="1135" height="1184" viewBox="36 36 1135 1184"')
(TARGET/'chrome-r6.svg').write_text(chrome)

# Portable outlined text. Pair kerning uses the exact same shaper as the mockup.
chars=''.join(chr(i) for i in range(32,127))+'°−—·'
fontdata={}
for weight,(font,gs,cmap,cap,shaper) in ns['fonts'].items():
    glyphs={}
    for ch in chars:
        if ord(ch) not in cmap:continue
        name=cmap[ord(ch)];pen=SVGPathPen(gs);gs[name].draw(pen)
        glyphs[ch]={'path':pen.getCommands(),'advance':font['hmtx'][name][0]}
    kern={}
    for a in chars:
        for b in chars:
            delta=shaper.getlength(a+b)-shaper.getlength(a)-shaper.getlength(b)
            if delta:kern[a+b]=delta
    fontdata[weight]={'cap':cap,'glyphs':glyphs,'kern':kern}
(TARGET/'glyphs.json').write_text(json.dumps(fontdata,separators=(',',':')))
icons={kind:family.render(kind,50,50,100) for _,kind,*_ in family.ICONS}
(TARGET/'icons.json').write_text(json.dumps({'definitions':family.definitions(),'icons':icons},separators=(',',':')))
lock=json.loads((ROOT/'approved_weather_icons_lock.json').read_text())
for _,kind,*_ in family.ICONS:
    hashes={str(size):hashlib.sha256(family.render(kind,0,0,size).encode()).hexdigest() for size in [35,46,176]}
    # Old review board hashes used its review positions; preserve them as provenance.
    lock['icons'].setdefault(kind,{})['runtimeCanonicalSHA256']=hashes
(TARGET/'approved-icons.json').write_text(json.dumps(lock,indent=2)+'\n')
print(json.dumps({'chromeBytes':len(chrome),'icons':len(icons),'fonts':list(fontdata)}))
