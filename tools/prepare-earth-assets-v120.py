"""Geographic textures with layered coastal relief and detailed urban networks.

Uses NASA Blue Marble, the 13,500px Black Marble and Natural Earth 1:10m. No geographic
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
night=sample('work/map/black-marble-2016-3km.jpg')
lum=(day[...,0]*.25+day[...,1]*.55+day[...,2]*.20)/255
relief=np.power(lum,.82)[...,None]
blur=np.asarray(Image.fromarray((lum*255).astype('uint8')).filter(ImageFilter.GaussianBlur(3*PIXEL_SCALE)),dtype=float)/255
detail=np.clip((lum-blur)*2.6,-.24,.24)[...,None]
macro_blur=np.asarray(Image.fromarray((lum*255).astype('uint8')).filter(ImageFilter.GaussianBlur(16*PIXEL_SCALE)),dtype=float)/255
macro_detail=np.clip((lum-macro_blur)*1.8,-.22,.22)[...,None]

# Cool slate at two spatial scales gives the land depth without painting terrain.
# Brighter coastal relief remains distinct from the fine administrative lines.
day_rgb=np.array([3,9,16])*(1-land)+(np.array([13,23,36])+relief*np.array([37,44,54])+detail*np.array([28,35,44])+macro_detail*np.array([23,29,36]))*land
night_rgb=np.array([1,4,8])*(1-land)+(np.array([7,13,23])+relief*np.array([19,25,35])+detail*np.array([12,19,28])+macro_detail*np.array([10,15,22]))*land

# Restrained, geographic coastline detail; no luminous contour around continents.
coast=np.clip(np.asarray(land_image.filter(ImageFilter.MaxFilter(3)),dtype=float)-np.asarray(land_image.filter(ImageFilter.MinFilter(3)),dtype=float),0,255)/255
# Country polygon outlines also include the coast. Remove that overlap before
# applying the independent shoreline treatment, avoiding a bright double edge.
admin_edges=edges*(1-coast[...,None])
day_rgb=day_rgb*(1-admin_edges*.53)+np.array([138,151,170])*admin_edges*.53
night_rgb=night_rgb*(1-admin_edges*.36)+np.array([74,89,111])*admin_edges*.36
coast_im=Image.fromarray((coast*255).astype('uint8'))
coast_fine=np.asarray(coast_im.filter(ImageFilter.GaussianBlur(.45*PIXEL_SCALE)),dtype=float)[...,None]/255
coast_glow=np.asarray(coast_im.filter(ImageFilter.GaussianBlur(2.5*PIXEL_SCALE)),dtype=float)[...,None]/255
# A shallow inward bevel follows the actual shoreline; it is not a continent halo.
shore_soft=np.asarray(land_image.filter(ImageFilter.GaussianBlur(4*PIXEL_SCALE)),dtype=float)[...,None]/255
inward=(1-shore_soft)*land
day_rgb+=coast_fine*np.array([28,34,42])+coast_glow*np.array([8,14,23])+inward*np.array([16,22,30])
night_rgb+=coast_fine*np.array([12,18,27])+coast_glow*np.array([4,7,12])+inward*np.array([7,11,17])

# More visible urban networks, while retaining the geographic Black Marble signal.
# Separate small and broad bloom keeps bright cores and gives cities a warm halo.
lights=np.clip((night[...,0]-.60*night[...,2]-.10*night[...,1]-1.8)/115,0,1)
lights=np.power(lights,.47)
light_im=Image.fromarray(np.clip(lights*255,0,255).astype('uint8'))
near=np.asarray(light_im.filter(ImageFilter.GaussianBlur(.45*PIXEL_SCALE)),dtype=float)/255
bloom=np.asarray(light_im.filter(ImageFilter.GaussianBlur(1.7*PIXEL_SCALE)),dtype=float)/255
night_rgb+=lights[...,None]*np.array([355,294,204])+near[...,None]*np.array([78,59,32])+bloom[...,None]*np.array([75,49,22])

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
    path=OUT/f'{name}-v120.png'
    Image.fromarray(np.clip(arr,0,255).astype('uint8')).save(path,optimize=True)
    print(name,path.stat().st_size)
