"""Weather family review: deterministic SVG; the approved partly icon is immutable."""
import math,json
from pathlib import Path
from weather_icons_satin import (
    APPROVED_HOME, definitions as approved_definitions,
    render as approved_render,
)

LIME='#c5ff0a'
BLUE='#8ebcdc'
CLOUD=APPROVED_HOME['cloud']
HIGHLIGHT=APPROVED_HOME['cloudHighlight']
HOME_RAIN=json.loads((Path(__file__).resolve().parent/'approved_home_rain_geometry.json').read_text())
HOME_FOG=json.loads((Path(__file__).resolve().parent/'approved_home_fog_geometry.json').read_text())

def definitions():
    return approved_definitions()+'''<defs>
<linearGradient id="familyStorm" x2=".2" y2="1"><stop stop-color="#d6e1e9"/><stop offset="1" stop-color="#7890a6"/></linearGradient>
</defs>'''

def cloud(transform='',fill='url(#satinCloud)',back=False):
    return (f'<g transform="{transform}"><path d="{CLOUD}" fill="{fill}" stroke="'+('#b8cbd6' if back else '#f4f8fa')+'" stroke-opacity="'+('.26' if back else '.85')+'" stroke-width=".55"/>'
            +(f'<path d="{HIGHLIGHT}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".8"/>' if not back else '')+'</g>')

def sun(cx=50,cy=50,r=20):
    # Same disk-to-ray proportions and round ray ends as the approved sun.
    s=r/20;parts=[]
    for deg in range(0,360,45):
        a=math.radians(deg)
        x1,y1=cx+32.4*s*math.cos(a),cy+32.4*s*math.sin(a)
        x2,y2=cx+41.6*s*math.cos(a),cy+41.6*s*math.sin(a)
        parts.append(f'<path d="M{x1:.3f} {y1:.3f}L{x2:.3f} {y2:.3f}" stroke="{LIME}" stroke-width="{4.7*s}"/>')
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#satinSun)"/>')
    return ''.join(parts)

def home_rain(kind):
    return ''.join(f'<path d="{stroke["path"]}" fill="{BLUE}"/>' for stroke in HOME_RAIN['kinds'][kind]['strokes'])

def home_rain_stroke(cx,cy):
    stroke=HOME_RAIN['kinds']['light_rain']['strokes'][0]
    x0,y0,x1,y1=stroke['bounds']
    return f'<path d="{stroke["path"]}" fill="{BLUE}" transform="translate({cx-(x0+x1)/2} {cy-(y0+y1)/2})"/>'

def crescent(cx,cy,r):
    """A smooth crescent bounded by two true circular arcs, not hand-shaped lobes."""
    inner=r*.87;dx=r*.3666666667;dy=-r*.2666666667
    distance=math.hypot(dx,dy)
    a=(r*r-inner*inner+distance*distance)/(2*distance)
    h=math.sqrt(r*r-a*a);ux,uy=dx/distance,dy/distance
    lower=(cx+a*ux-h*uy,cy+a*uy+h*ux)
    upper=(cx+a*ux+h*uy,cy+a*uy-h*ux)
    return f'<path d="M{upper[0]:.4f} {upper[1]:.4f}A{r} {r} 0 1 0 {lower[0]:.4f} {lower[1]:.4f}A{inner} {inner} 0 0 1 {upper[0]:.4f} {upper[1]:.4f}Z" fill="url(#satinMoon)" stroke="#d4e7f3" stroke-width=".35"/>'

def snowflake(x,y,size=6):
    p=[]
    for deg in range(0,360,60):
        a=math.radians(deg);ux,uy=math.cos(a),math.sin(a)
        ex,ey=x+size*ux,y+size*uy
        mx,my=x+size*.56*ux,y+size*.56*uy
        p.append(f'M{x:.3f} {y:.3f}L{ex:.3f} {ey:.3f}')
        for side in [-1,1]:
            bx=mx+size*.26*ux-side*size*.23*uy
            by=my+size*.26*uy+side*size*.23*ux
            p.append(f'M{bx:.3f} {by:.3f}L{mx:.3f} {my:.3f}')
    return f'<path d="{"".join(p)}" fill="none" stroke="#c5e3f3" stroke-width="1.45"/>'

def render(kind,x,y,size):
    if kind=='partly':
        return approved_render('partly',x,y,size)
    p=[f'<g transform="translate({x-size/2} {y-size/2}) scale({size/100})" stroke-linecap="round" stroke-linejoin="round">']
    add=p.append
    if kind=='sun':add(sun())
    elif kind=='cloud':add(cloud('translate(4 -12) scale(.8)'))
    elif kind in ['light_rain','heavy_rain','storm','snow']:
        add(cloud('translate(7 -23) scale(.75)',fill='url(#familyStorm)' if kind=='storm' else 'url(#satinCloud)'))
        if kind=='light_rain':
            add(home_rain('light_rain'))
        elif kind=='heavy_rain':
            add(home_rain('heavy_rain'))
        elif kind=='storm':
            add('<path d="M49 64L38 82H49L44 96L66 75H54L60 64Z" transform="translate(52 79) scale(.76) translate(-52 -80)" fill="url(#satinSun)"/>')
            add(home_rain_stroke(29,75));add(home_rain_stroke(75,75))
        else:
            for xx,yy in [(29,74),(50,84),(71,74)]:add(snowflake(xx,yy,6.3))
    elif kind=='fog':
        add(cloud(HOME_FOG['cloudTransform']))
        for stroke in HOME_FOG['strokes']:
            add(f'<path d="{stroke["path"]}" fill="#bac9d3"/>')
    elif kind=='wind':
        add('<path d="M15 38H57C65 38 69 34 69 28C69 22 65 19 60 19C56 19 53 21 52 24M10 51H76C84 51 89 46 89 40C89 35 86 32 82 31M20 64H57C65 64 70 68 70 74C70 80 66 84 61 84C57 84 54 82 53 79" fill="none" stroke="#c1d8e7" stroke-width="3.2"/>')
    elif kind=='moon':
        add(crescent(52,50,30))
    elif kind=='night_cloud':
        add('<g transform="translate(0 8.56) scale(.6849315068)">')
        add('<g mask="url(#homeCloudSeparation)">'+crescent(98,43,26)+'</g>')
        add(cloud());add('</g>')
    else:raise ValueError(kind)
    add('</g>')
    return ''.join(p)

ICONS=[
    ('01','sun','SUNNY','שמש מלאה'),
    ('02','partly','PARTLY CLOUDY','מעונן חלקית — מאושר'),
    ('03','cloud','CLOUDY','מעונן'),
    ('04','light_rain','LIGHT RAIN','גשם קל'),
    ('05','heavy_rain','HEAVY RAIN','גשם חזק'),
    ('06','storm','THUNDERSTORM','סופת רעמים'),
    ('07','snow','SNOW','שלג'),
    ('08','fog','FOG','ערפל'),
    ('09','wind','WINDY','רוח'),
    ('10','moon','CLEAR NIGHT','לילה בהיר'),
    ('11','night_cloud','CLOUDY NIGHT','מעונן חלקית בלילה'),
]
