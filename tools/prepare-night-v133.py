"""Build v133 night-light signal from scratch against the approved map geometry.\n\n# v133 rebuild trigger

The source is NASA's 2016 Black Marble colour composite. The output contains
only a scalar historical light-energy field. It contains no golden tint,
no bloom and no day/night mask; those are applied at runtime by the renderer.

Unlike v130, v133 does NOT use a separate lighting-only warp mesh. It samples
the source through the approved reference coordinate field itself, so terrain,
solar shading and lighting all share the same geographic calibration.
"""
from pathlib import Path
import gzip, hashlib, json
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates

W,H=1827,861
root=Path('assets/earth')
work=Path('work/map')
source=work/'BlackMarble_2016_3km.jpg'
source_url='https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg'

Image.MAX_IMAGE_PIXELS=100_000_000
rgb=np.asarray(Image.open(source).convert('RGB'),dtype=np.float32)
sh,sw=rgb.shape[:2]
assert (sw,sh)==(13500,6750), (sw,sh)

r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
luma=.34*r+.46*g+.20*b

# Extract luminous urban emission while rejecting the blue/purple geographic
# backdrop. Keep weak warm/neutral points instead of applying the old hard
# source floor that disproportionately removed dim networks.
warm=np.maximum(r-.48*b-.08*g-.35,0)
neutral_gate=np.clip((((r+g)*.5)-b+3.0)/14.0,0,1)
neutral=np.maximum(luma-14.0,0)*neutral_gate
signal=.78*warm+.22*neutral
signal=np.maximum(signal,0).astype(np.float32)
del rgb,r,g,b,luma,warm,neutral,neutral_gate

raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_field=coords[:,:,0]
lat_field=coords[:,:,1]

# Nine samples per destination pixel preserve compact city clusters while
# avoiding nearest-neighbour sparkle. Sampling the coordinate field itself
# keeps the footprint tied to the approved illustrated map geometry.
yy,xx=np.mgrid[:H,:W].astype(np.float32)
energy=np.zeros((H,W),np.float32)
for dy in (-1/3,0,1/3):
    for dx in (-1/3,0,1/3):
        lon=map_coordinates(lon_field,[yy+dy,xx+dx],order=1,mode='nearest')
        lat=map_coordinates(lat_field,[yy+dy,xx+dx],order=1,mode='nearest')
        sy=(90-lat)/180*sh-.5
        sx=(lon+180)/360*sw-.5
        energy+=map_coordinates(signal,[sy,sx],order=1,mode='grid-wrap')/9

# No regional boosts and no continent-specific tuning. Preserve very weak
# values; runtime tone mapping is responsible for visibility/compression.
energy=np.maximum(energy,0)
scale=1024.0
quant=np.rint(np.minimum(energy,63.999)*scale).astype('<u2')
out=root/'night-signal-v133.bin.gz'
out.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
percentiles={str(p):float(np.percentile(energy,p)) for p in (50,75,90,95,97,99,99.5,99.9)}
meta={
  'version':133,
  'source':source_url,
  'sourcePage':'https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/',
  'sourceYear':2016,
  'sourceSize':[sw,sh],
  'sourceSha256':sha(source),
  'geometry':'reference-coordinates-v127.bin.gz (same approved map field used by terrain/solar/marker)',
  'geometrySha256':sha(root/'reference-coordinates-v127.bin.gz'),
  'signalExtraction':{
    'warm':'max(R - 0.48*B - 0.08*G - 0.35, 0)',
    'neutral':'max(luma - 14, 0) * clamp((((R+G)/2)-B+3)/14,0,1)',
    'mix':'0.78*warm + 0.22*neutral',
    'sourceFloor':0,
    'regionalBoosts':False
  },
  'sampling':'3x3 destination footprint through approved coordinate field',
  'encoding':'gzip uint16 little-endian, scalar energy / 1024',
  'energyPercentiles':percentiles,
  'signalRange':[float(energy.min()),float(energy.max())],
  'litPixelsAbove':{
    '0.25':int((energy>.25).sum()),
    '0.5':int((energy>.5).sum()),
    '1':int((energy>1).sum()),
    '2':int((energy>2).sum())
  },
  'outputSha256':sha(out),
  'meaning':'Historical urban-light signal only; golden colour, bloom and UTC solar night mask are runtime effects. Not live radiance.'
}
(root/'night-provenance-v133.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({'output':str(out),'bytes':out.stat().st_size,'sha256':meta['outputSha256'],'percentiles':percentiles,'litPixelsAbove':meta['litPixelsAbove']}))
