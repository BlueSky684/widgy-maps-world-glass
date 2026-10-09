"""Option 3, revised sun/cloud overlap. Standalone deterministic vector artwork."""
import math
import json
from pathlib import Path

APPROVED_HOME=json.loads((Path(__file__).resolve().parent/'approved_home_icon_geometry.json').read_text())

def approved_partly_raw():
    """All paths retain their measured position in one shared coordinate system."""
    g=APPROVED_HOME
    rays=''.join(f'<path d="{d}" fill="{LIME}"/>' for d in g['rays'])
    sun=g['sunCircle']
    return rays+f'<circle cx="{sun["cx"]}" cy="{sun["cy"]}" r="{sun["r"]}" fill="url(#satinSun)" mask="url(#homeCloudSeparation)"/>'+f'<path d="{g["cloud"]}" fill="url(#satinCloud)" stroke="#f4f8fa" stroke-width=".55"/>'+f'<path d="{g["cloudHighlight"]}" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width=".8" stroke-linecap="round"/>'

LIME='#c5ff0a'; BLUE='#87b5d7'
CLOUD='M24 76C14.6 76 7 68.4 7 59C7 50.1 13.8 42.7 22.6 42C25.5 29.8 36.3 21 49 21C62.6 21 73.8 30.7 76.1 43.5C86.1 43.6 94 50.7 94 60C94 69 86.7 76 77.6 76Z'
MOON='M68 15C47 12 28 27 27 47C26 68 41 85 62 85C73 85 83 79 89 71C72 75 57 63 54 48C52 34 58 22 68 15Z'

def definitions():
    return f'''<defs><mask id="homeCloudSeparation" maskUnits="userSpaceOnUse" x="0" y="0" width="146" height="121"><rect width="146" height="121" fill="white"/><path d="{APPROVED_HOME['cloud']}" transform="translate(3 -3)" fill="black"/></mask>'''+'''
<linearGradient id="satinCloud" x2=".2" y2="1"><stop stop-color="#f5f9fc"/><stop offset=".5" stop-color="#dce6ef"/><stop offset="1" stop-color="#a6b6c9"/></linearGradient>
<linearGradient id="satinSun" x2=".7" y2="1"><stop stop-color="#e1ff68"/><stop offset="1" stop-color="#a8dc00"/></linearGradient>
<radialGradient id="satinSunGlow"><stop stop-color="#c5ff0a" stop-opacity=".1"/><stop offset="1" stop-color="#c5ff0a" stop-opacity="0"/></radialGradient>
<linearGradient id="satinMoon" x2=".7" y2="1"><stop stop-color="#dbeffd"/><stop offset="1" stop-color="#7aa9cf"/></linearGradient>
</defs>'''

def render(kind,x,y,size):
    out=[]; add=out.append
    add(f'<g transform="translate({x-size/2} {y-size/2}) scale({size/100})" stroke-linecap="round" stroke-linejoin="round">')
    if kind=='partly':
        # Scale the complete approved composition as a unit. Never reposition
        # the sun, rays, or cloud independently of the Home source.
        add('<g transform="translate(0 8.56) scale(.6849315068)">')
        add(approved_partly_raw())
        add('</g></g>')
        return ''.join(out)
    def sun(cx,cy,r,partly=False):
        add(f'<circle cx="{cx}" cy="{cy}" r="{r+11}" fill="url(#satinSunGlow)"/>')
        # Lower rays are covered by the foreground cloud; omit them to avoid
        # isolated green fragments along the cloud edge in tiny forecast icons.
        angles=[225,270,315] if partly else range(0,360,45)
        for angle in angles:
            a=math.radians(angle)
            p=lambda rr:(cx+rr*math.cos(a),cy+rr*math.sin(a))
            (x1,y1),(x2,y2)=p(r+6),p(r+13)
            add(f'<path d="M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}" stroke="{LIME}" stroke-width="4.4"/>')
        add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#satinSun)" stroke="{LIME}" stroke-width="1.1"/>')
        add(f'<path d="M{cx-r*.72} {cy-r*.23}A{r*.76} {r*.76} 0 0 1 {cx+r*.34} {cy-r*.66}" fill="none" stroke="#f2ffd2" stroke-opacity=".65" stroke-width="1.6"/>')
    def cloud(transform=''):
        add(f'<g transform="{transform}">')
        add(f'<path d="{CLOUD}" fill="#030b11" opacity=".4" transform="translate(0 3)"/>')
        add(f'<path d="{CLOUD}" fill="url(#satinCloud)" stroke="#f4f8fa" stroke-width=".8"/>')
        add('<path d="M12 57C12.8 50.1 18.5 46.8 26 46.8C28 34 37.5 25 49.4 25C60.9 25 71 33.2 72 45.7" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="1.3"/>')
        add('</g>')
    if kind=='sun': sun(50,50,20)
    elif kind=='cloud':cloud()
    elif kind=='rain':
        cloud('translate(3 -1) scale(.93)')
        for xx in [32,51,70]:add(f'<path d="M{xx} 80l-4 9" stroke="{BLUE}" stroke-width="4.2"/>')
    elif kind=='storm':
        cloud('translate(3 -5) scale(.93)')
        add(f'<path d="M50 66L39 84H51L45 99L67 76H54L61 66Z" fill="{LIME}" stroke="#0d1921" stroke-width="1"/>')
    elif kind=='moon':add(f'<path d="{MOON}" fill="url(#satinMoon)" stroke="#d4e7f3" stroke-width=".5"/>')
    else:raise ValueError(kind)
    add('</g>')
    return ''.join(out)
