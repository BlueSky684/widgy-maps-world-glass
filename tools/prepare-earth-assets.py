"""Prepare georeferenced display textures, not a screenshot or an AI mockup.

Sources/coordinates are documented in assets/earth/SOURCES.md.
Run from the repository root with NASA JPGs and Natural Earth GeoJSON in work/map.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw

W, H = 1484, 640
NORTH, SOUTH = 85, -65
OUT = Path('assets/earth')
OUT.mkdir(parents=True, exist_ok=True)

def project(lon, lat):
    return ((lon + 180) / 360 * W, (NORTH - lat) / (NORTH - SOUTH) * H)

def sample(path):
    im = Image.open(path).convert('RGB')
    return np.asarray(im.crop((0, (90-NORTH)/180*im.height, im.width,
                              (90-SOUTH)/180*im.height)).resize((W,H), Image.Resampling.LANCZOS), dtype=float)

# Supersampling keeps coastlines and country borders crisp at phone size.
mask = Image.new('L', (W*2,H*2))
borders = Image.new('L', (W*2,H*2))
md, bd = ImageDraw.Draw(mask), ImageDraw.Draw(borders)
geo = json.loads(Path('work/map/countries.geojson').read_text())
for feature in geo['features']:
    g=feature['geometry']
    polygons = [g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    for poly in polygons:
        for i,ring in enumerate(poly):
            points=[tuple(v*2 for v in project(lon,lat)) for lon,lat in ring]
            # Natural Earth polygons already split at the antimeridian.
            md.polygon(points, fill=255 if i==0 else 0)
            bd.line(points, fill=255, width=1, joint='curve')
land=np.asarray(mask.resize((W,H),Image.Resampling.LANCZOS),dtype=float)[...,None]/255
edges=np.asarray(borders.resize((W,H),Image.Resampling.LANCZOS),dtype=float)[...,None]/255
day=sample('work/map/blue-marble-september.jpg')
night=sample('work/map/black-marble-2016.jpg')
lum=(day[...,0]*.25+day[...,1]*.55+day[...,2]*.20)/255
relief=np.power(lum,.68)[...,None]
day_rgb=np.array([5,14,23])*(1-land)+(np.array([24,38,55])+relief*np.array([58,68,83]))*land
day_rgb=day_rgb*(1-edges*.63)+np.array([121,144,166])*edges*.63
night_rgb=np.array([2,6,11])*(1-land)+(np.array([8,15,24])+relief*np.array([12,16,23]))*land
night_rgb=night_rgb*(1-edges*.30)+np.array([50,67,84])*edges*.30
# Black Marble's warm bright signal isolates city lighting from blue land/ocean.
lights=np.clip((night[...,0]-.55*night[...,2]-.12*night[...,1]-5)/160,0,1)[...,None]
lights=np.power(lights,.85)
night_rgb+=lights*np.array([235,203,145])

# Fine geographic graticule, projected with the exact same bounds as the imagery.
grid=Image.new('L',(W*2,H*2)); gd=ImageDraw.Draw(grid)
for lon in range(-150,180,30):
    x=project(lon,0)[0]*2
    for y in range(0,H*2,12): gd.line((x,y,x,min(y+5,H*2)),fill=60,width=1)
for lat in range(-60,90,30):
    y=project(0,lat)[1]*2
    for x in range(0,W*2,12): gd.line((x,y,min(x+5,W*2),y),fill=60,width=1)
grid=np.asarray(grid.resize((W,H),Image.Resampling.LANCZOS),dtype=float)[...,None]/255
for name,arr in [('day',day_rgb),('night',night_rgb)]:
    arr=arr*(1-grid)+np.array([88,113,137])*grid
    Image.fromarray(np.clip(arr,0,255).astype('uint8')).save(OUT/f'{name}.png',optimize=True)
    print(name,(OUT/f'{name}.png').stat().st_size)
