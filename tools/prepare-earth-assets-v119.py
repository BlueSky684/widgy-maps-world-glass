"""Master-inspired slate cartography and warm night lighting.

Uses the same NASA inputs as v114 and finer Natural Earth 1:10m polygons. No geographic
warping, painted cities or static day/night shadow is added to either texture.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, SCALE = 2400, 1188, 3
PIXEL_SCALE = W / 1484
NORTH, SOUTH = 85, -65
OUT = Path('assets/earth')

def project(lon, lat):
    return ((lon + 180) / 360 * W, (NORTH - lat) / (NORTH - SOUTH) * H)

def sample(path):
    im = Image.open(path).convert('RGB')
    return np.asarray(im.crop((0, (90-NORTH)/180*im.height, im.width,
                              (90-SOUTH)/180*im.height)).resize((W,H), Image.Resampling.LANCZOS), dtype=float)

mask = Image.new('L', (W*SCALE,H*SCALE))
borders = Image.new('L', (W*SCALE,H*SCALE))
md, bd = ImageDraw.Draw(mask), ImageDraw.Draw(borders)
geo = json.loads(Path('work/map/countries-10m.geojson').read_text())
for feature in geo['features']:
    g=feature['geometry']
    polygons = [g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    for poly in polygons:
        for i,ring in enumerate(poly):
            points=[tuple(v*SCALE for v in project(lon,lat)) for lon,lat in ring]
            md.polygon(points, fill=255 if i==0 else 0)
            bd.line(points, fill=255, width=3, joint='curve')
land_image=mask.resize((W,H),Image.Resampling.LANCZOS)
land=np.asarray(land_image,dtype=float)[...,None]/255
edges=np.asarray(borders.resize((W,H),Image.Resampling.LANCZOS),dtype=float)[...,None]/255
day=sample('work/map/blue-marble-september.jpg')
night=sample('work/map/black-marble-2016.jpg')
lum=(day[...,0]*.25+day[...,1]*.55+day[...,2]*.20)/255
relief=np.power(lum,.82)[...,None]
blur=np.asarray(Image.fromarray((lum*255).astype('uint8')).filter(ImageFilter.GaussianBlur(3*PIXEL_SCALE)),dtype=float)/255
detail=np.clip((lum-blur)*2,-.20,.20)[...,None]

# Less saturated slate and finer silver-grey borders replace the blue outlines.
day_rgb=np.array([4,11,18])*(1-land)+(np.array([16,25,37])+relief*np.array([47,48,49])+detail*np.array([32,35,38]))*land
day_rgb=day_rgb*(1-edges*.43)+np.array([137,147,161])*edges*.43
night_rgb=np.array([2,6,11])*(1-land)+(np.array([8,15,25])+relief*np.array([22,28,35])+detail*np.array([9,12,16]))*land
night_rgb=night_rgb*(1-edges*.32)+np.array([70,86,106])*edges*.32

# Restrained, geographic coastline detail; no luminous contour around continents.
coast=np.clip(np.asarray(land_image.filter(ImageFilter.MaxFilter(3)),dtype=float)-np.asarray(land_image.filter(ImageFilter.MinFilter(3)),dtype=float),0,255)/255
coast_glow=np.asarray(Image.fromarray((coast*255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.4*PIXEL_SCALE)),dtype=float)[...,None]/255
day_rgb+=coast_glow*np.array([6,8,11])
night_rgb+=coast_glow*np.array([4,7,11])

# More visible urban networks, while retaining the geographic Black Marble signal.
# Separate small and broad bloom keeps bright cores and gives cities a warm halo.
lights=np.clip((night[...,0]-.60*night[...,2]-.10*night[...,1]-3)/130,0,1)
lights=np.power(lights,.54)
light_im=Image.fromarray(np.clip(lights*255,0,255).astype('uint8'))
near=np.asarray(light_im.filter(ImageFilter.GaussianBlur(.65*PIXEL_SCALE)),dtype=float)/255
bloom=np.asarray(light_im.filter(ImageFilter.GaussianBlur(2.3*PIXEL_SCALE)),dtype=float)/255
night_rgb+=lights[...,None]*np.array([330,278,182])+near[...,None]*np.array([72,53,24])+bloom[...,None]*np.array([90,56,18])

# Fine neutral-blue graticule, in the same projection as land, sun and marker.
grid=Image.new('L',(W*SCALE,H*SCALE));gd=ImageDraw.Draw(grid)
for lon in range(-150,180,30):
    x=project(lon,0)[0]*SCALE
    for y in range(0,H*SCALE,29):gd.line((x,y,x,min(y+18,H*SCALE)),fill=100,width=2)
for lat in range(-60,90,30):
    y=project(0,lat)[1]*SCALE
    for x in range(0,W*SCALE,29):gd.line((x,y,min(x+18,W*SCALE),y),fill=100,width=2)
grid=np.asarray(grid.resize((W,H),Image.Resampling.LANCZOS),dtype=float)[...,None]/255
for name,arr in [('day',day_rgb),('night',night_rgb)]:
    arr=arr*(1-grid)+np.array([78,96,114])*grid
    path=OUT/f'{name}-v119.png'
    Image.fromarray(np.clip(arr,0,255).astype('uint8')).save(path,optimize=True)
    print(name,path.stat().st_size)
