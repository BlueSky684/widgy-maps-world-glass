"""Deterministic Weather design study. Approved fonts; no image generation."""
from pathlib import Path
import json, math, html
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import ImageFont
from weather_icons_satin import render as satin_icon, definitions as satin_definitions

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'output'
OUT.mkdir(exist_ok=True)
WHITE='#f4f7fa'; MUTED='#aeb7c6'; DIM='#788997'; LIME='#c5ff0a'; BLUE='#87b5d7'
fonts={}
for weight in ['Regular','Light','Bold']:
    path=ROOT/'fonts'/f'Phenomena-{weight}.otf'
    f=TTFont(path); gs=f.getGlyphSet(); cmap=f.getBestCmap()
    pen=BoundsPen(gs); gs[cmap[ord('H')]].draw(pen)
    fonts[weight]=(f,gs,cmap,pen.bounds[3],ImageFont.truetype(str(path),f['head'].unitsPerEm))
parts=[]; text_bounds=[]
def add(s): parts.append(s)
def rect(x,y,w,h,r=0,fill='none',stroke=None,sw=1,extra=''):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}"' if stroke else '')+f' {extra}/>')
def line(x1,y1,x2,y2,c='#30414c',w=1,opacity=1):
    add(f'<path d="M{x1} {y1}L{x2} {y2}" fill="none" stroke="{c}" stroke-width="{w}" opacity="{opacity}"/>')
def text(s,x,y,cap=24,color=WHITE,weight='Regular',anchor='start',tracking=0):
    f,gs,cmap,h,shaper=fonts[weight]; scale=cap/h
    width=shaper.getlength(s)*scale+tracking*max(0,len(s)-1)
    start=x-width/2 if anchor=='middle' else x-width if anchor=='end' else x
    spans=[]; miny=1e6;maxy=-1e6;minx=1e6;maxx=-1e6
    for i,ch in enumerate(s):
        name=cmap[ord(ch)]; pen=SVGPathPen(gs); gs[name].draw(pen)
        offset=(shaper.getlength(s[:i+1])-f['hmtx'][name][0])*scale+i*tracking
        b=BoundsPen(gs);gs[name].draw(b)
        if b.bounds:
            bx,by,bw,bh=b.bounds
            minx=min(minx,start+offset+bx*scale);maxx=max(maxx,start+offset+bw*scale)
            miny=min(miny,y-bh*scale);maxy=max(maxy,y-by*scale)
        spans.append(f'<path d="{pen.getCommands()}" transform="translate({start+offset:.5f} {y}) scale({scale:.8f} {-scale:.8f})"/>')
    add(f'<g fill="{color}" aria-label="{html.escape(s,quote=True)}"><title>{html.escape(s)}</title>'+''.join(spans)+'</g>')
    text_bounds.append(dict(text=s,box=[minx,miny,maxx,maxy]))
    return width
def panel(y,h,hero=False):
    rect(24,y,1086,h,29,'url(#hero)' if hero else 'url(#panel)','#354852',1.5)
    # Fine inner lip follows the same geometry; deliberately no broad shadows.
    rect(25.5,y+1.5,1083,h-3,27.5,'none','#9cb8c8',.55,'opacity=".08"')
def legacy_outline_weather(kind,x,y,size=52,accent=LIME,cloud=WHITE):
    add(f'<g transform="translate({x-size/2} {y-size/2}) scale({size/64})" stroke-linecap="round" stroke-linejoin="round">')
    def sun(cx,cy,r,full=True):
        add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{accent}" stroke-width="3.3"/>')
        for a in range(0,360,45):
            ang=math.radians(a);p1=(cx+(r+5)*math.cos(ang),cy+(r+5)*math.sin(ang));p2=(cx+(r+10)*math.cos(ang),cy+(r+10)*math.sin(ang))
            add(f'<path d="M{p1[0]} {p1[1]}L{p2[0]} {p2[1]}" stroke="{accent}" stroke-width="3.2"/>')
    if kind=='sun': sun(32,32,13)
    elif kind=='moon':
        add(f'<path d="M42 10C25 8 13 20 15 35C17 51 35 59 49 49C36 51 25 40 27 27C28 20 33 13 42 10Z" fill="{BLUE}" stroke="{BLUE}" stroke-width="1"/>')
    else:
        if kind=='partly':sun(41,22,10)
        add(f'<path d="M16 51C5 51 2 37 12 32C11 16 33 12 38 27C52 24 60 43 47 50C42 52 24 51 16 51Z" fill="#101c23" stroke="{cloud}" stroke-width="3.3"/>')
    add('</g>')
def weather(kind,x,y,size=52,accent=LIME,cloud=WHITE):
    add(satin_icon(kind,x,y,size))
def drop(x,y,sz=13):
    add(f'<path d="M0 -9C-2 -5 -6 0 -6 4A6 6 0 0 0 6 4C6 0 2 -5 0 -9Z" fill="{BLUE}" opacity=".8" transform="translate({x} {y}) scale({sz/18})"/>')
def nav_icon(kind,x,y,color):
    add(f'<g transform="translate({x} {y})" fill="none" stroke="{color}" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round">')
    if kind=='home':
        add('<path d="M-25-3L0-25 25-3M-18-6V23H18V-6M10-19V-25H17V-13"/><path d="M-6 23V6H6V23"/>')
    elif kind=='calendar':
        add('<rect x="-20" y="-18" width="40" height="43" rx="4"/><path d="M-11-25V-13M11-25V-13M-20-7H20"/>')
        for xx in [-10,0,10]:
            for yy in [2,11,20]: add(f'<rect x="{xx-1.6}" y="{yy-1.6}" width="3.2" height="3.2" rx=".6" fill="{color}" stroke="none"/>')
    elif kind=='fitness':
        add(f'<circle cx="6" cy="-24" r="6" fill="{color}" stroke="none"/><path d="M-12-4L-5-13 7-10 15-2 23-5M6-8L0 7-13 14-20 27M0 7L10 16 2 28M-5-13L-13 4" stroke-width="6"/>')
    add('</g>')

W,H=1207,1256
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">')
add('<title id="title">Widgy World Glass — Weather technical design study</title><desc id="desc">Illustrative weather for Ashkelon, Israel. Deterministic vector rendering using approved Phenomena font outlines and current widget frame measurements.</desc>')
add('''<defs>
  <linearGradient id="canvas" x2=".8" y2="1"><stop stop-color="#101820"/><stop offset="1" stop-color="#04080d"/></linearGradient>
  <linearGradient id="glass" x2=".25" y2="1"><stop stop-color="#15212a"/><stop offset=".43" stop-color="#101b23"/><stop offset="1" stop-color="#080f14"/></linearGradient>
  <linearGradient id="rim" x2=".8" y2="1"><stop stop-color="#758c9e"/><stop offset=".28" stop-color="#3f4e5c"/><stop offset=".7" stop-color="#34424e"/><stop offset="1" stop-color="#5a6674"/></linearGradient>
  <linearGradient id="panel" x2=".25" y2="1"><stop stop-color="#0c171e"/><stop offset="1" stop-color="#091218"/></linearGradient>
  <linearGradient id="hero" x2="1" y2=".7"><stop stop-color="#14232a"/><stop offset=".46" stop-color="#0c181f"/><stop offset="1" stop-color="#0a141b"/></linearGradient>
  <linearGradient id="range" x2="1" y2="0"><stop stop-color="#638f74"/><stop offset=".55" stop-color="#a4ce51"/><stop offset="1" stop-color="#c5ff0a"/></linearGradient>
  <radialGradient id="active"><stop stop-color="#c5ff0a" stop-opacity=".11"/><stop offset="1" stop-color="#c5ff0a" stop-opacity="0"/></radialGradient>
  <linearGradient id="hairlight"><stop stop-color="#abc7d6" stop-opacity="0"/><stop offset=".3" stop-color="#c2d9e4" stop-opacity=".45"/><stop offset="1" stop-color="#abc7d6" stop-opacity="0"/></linearGradient>
  <clipPath id="frame"><rect x="3" y="3" width="1129" height="1178" rx="83"/></clipPath>
  <linearGradient id="hourSelected" x2="0" y2="1"><stop stop-color="#c5ff0a" stop-opacity=".07"/><stop offset="1" stop-color="#c5ff0a" stop-opacity=".015"/></linearGradient>
</defs>''')
add(satin_definitions())
rect(0,0,W,H,fill='url(#canvas)')
add('<g transform="translate(36 36)">')
rect(5,12,1125,1174,84,'#000000',extra='opacity=".28"')
rect(3,3,1129,1178,83,'url(#glass)','url(#rim)',2.5)
rect(5,5,1125,1174,81,'none','#c0d8e7',1,'opacity=".07"')
add('<g clip-path="url(#frame)"><path d="M90 5H1045" stroke="url(#hairlight)" stroke-width="1.5"/></g>')

# Exactly the existing frame/location/navigation grid.
w=text('WE',44,124,72,WHITE,'Bold',tracking=.2)
text('ATHER',44+w,124,72,LIME,'Bold',tracking=.2)
text('FRIDAY',925,80,28,WHITE,'Bold','middle')
text('OCTOBER',925,119,28,MUTED,'Regular','middle')
line(995,53,995,129,'#4b5b67',1.6,.7)
text('9',1082,130,89,LIME,'Bold','end')
rect(24,154,1086,75,29,'#0b151c','#425864',1.8)
add(f'<path d="M12 22C10 19 3 13 3 9a9 9 0 0 1 18 0c0 4-7 10-9 13Z M12 12a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z" fill="{MUTED}" fill-rule="evenodd" transform="translate(53 177) scale(1.0833333)"/>')
text('Ashkelon, Israel',94,204,30,MUTED)
text('Friday, 9 October 2026',1079,204,30,MUTED,anchor='end')

panel(248,246,True)
weather('partly',131,357,141,cloud=LIME)
text('29',247,403,110,WHITE,'Bold')
text('°C',407,338,34,MUTED)
text('Partly Cloudy',249,451,30,MUTED)
line(537,279,537,463,'#344750',1.4)
for x in [730,922]:line(x,280,x,351,'#344750',1);line(x,382,x,462,'#344750',1)
line(567,366,1079,366,'#344750',1)
for label,val,x in [('Feels Like','31°',582),('High','32°',767),('Low','25°',959)]:
    text(label,x,300,21,MUTED)
    text(val,x,343,33,WHITE,'Bold')
for label,val,x in [('Humidity','64%',582),('Wind','NW 18 km/h',767),('UV Index','7',959)]:
    text(label,x,402,21,MUTED)
    text(val,x,445,33 if label!='Wind' else 25,WHITE,'Bold' if label!='Wind' else 'Regular')
text('High',989,443,21,MUTED)
for i in range(7):rect(959+i*16,458,12,3,1.5,LIME if i<5 else '#304048',extra='opacity=".75"')

panel(512,214)
rect(49,539,4,24,2,LIME)
text('HOURLY FORECAST',69,563,23,WHITE,'Bold',tracking=.45)
text('NEXT 6 HOURS',1080,562,16,DIM,anchor='end',tracking=.65)
hours=[('14:00','sun','29°','0%'),('15:00','sun','29°','0%'),('16:00','partly','28°','0%'),('17:00','partly','27°','0%'),('18:00','partly','26°','10%'),('19:00','moon','25°','10%')]
for i,(time,icon,temp,rain) in enumerate(hours):
    cx=131+i*174.5
    if i==0:rect(cx-72,578,144,129,17,'url(#hourSelected)','#627441',.65,'stroke-opacity=".42"')
    if i>0:line(cx-87.25,592,cx-87.25,695,'#283a44',1,.8)
    text(time,cx,604,20,LIME if i==0 else MUTED,anchor='middle')
    weather(icon,cx-33,648,46)
    text(temp,cx+24,662,35,WHITE,'Bold','middle')
    drop(cx-18,692,13)
    text(rain,cx+1,698,18,MUTED)

panel(744,283)
rect(49,770,4,24,2,LIME)
text('DAILY FORECAST',69,794,23,WHITE,'Bold',tracking=.45)
text('LOW / HIGH',1080,793,16,DIM,anchor='end',tracking=.65)
line(49,809,1085,809,'#293c46',1)
days=[('TODAY','partly','Partly Cloudy',10,25,32),('SAT','sun','Sunny',0,24,31),('SUN','sun','Mostly Sunny',0,24,30),('MON','cloud','Cloudy',20,23,29),('TUE','partly','Partly Cloudy',10,24,30)]
for i,(day,icon,label,rain,low,high) in enumerate(days):
    cy=831+i*42
    if i>0:line(49,cy-21,1085,cy-21,'#293943',.85,.8)
    text(day,61,cy+9,23,LIME if i==0 else WHITE,'Bold' if i==0 else 'Regular')
    weather(icon,218,cy,35)
    text(label,273,cy+9,23,MUTED)
    drop(570,cy,12)
    text(str(rain)+'%',596,cy+9,21,MUTED)
    text(str(low)+'°',735,cy+10,25,MUTED,anchor='end')
    rect(762,cy-3,238,6,3,'#263741')
    x0=762+(low-22)/11*238; x1=762+(high-22)/11*238
    rect(round(x0,2),cy-3,round(x1-x0,2),6,3,'url(#range)')
    text(str(high)+'°',1078,cy+10,25,WHITE,'Bold','end')

line(25,1049,1108,1049,'#44525e',1.5,.75)
for x in [270,563,854]:line(x,1077,x,1148,'#44525e',1.5,.75)
add('<ellipse cx="638" cy="1111" rx="64" ry="58" fill="url(#active)"/>')
nav_icon('home',92,1109,MUTED);text('HOME',148,1124,27,MUTED,'Light')
nav_icon('calendar',350,1109,MUTED);text('CALENDAR',397,1124,27,MUTED,'Light')
weather('partly',638,1109,61,LIME,LIME);text('WEATHER',699,1124,27,LIME,'Light')
nav_icon('fitness',928,1109,MUTED);text('FITNESS',984,1124,27,MUTED,'Light')
add('</g></svg>')
(OUT/'Widgy_Weather_Premium_Technical.svg').write_text(''.join(parts))
(ROOT/'layout-audit.json').write_text(json.dumps({'designCanvas':[1135,1184],'artboard':[W,H],'text':text_bounds},indent=2))
print(json.dumps({'svg':str(OUT/'Widgy_Weather_Premium_Technical.svg'),'textObjects':len(text_bounds),'fonts':'Original user-supplied Phenomena outlines','externalRequests':0}))
focus='<svg xmlns="http://www.w3.org/2000/svg" width="620" height="420"><rect width="620" height="420" rx="24" fill="#101c24"/>'+satin_definitions()+satin_icon('partly',237,210,370)+satin_icon('partly',507,188,64)+satin_icon('partly',507,286,36)+'</svg>'
(OUT/'Widgy_Weather_Sun_Placement.svg').write_text(focus)
