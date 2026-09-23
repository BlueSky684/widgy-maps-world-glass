"""Build v135 night-light signal from scratch for the locked 85%C / 15%D target.\n\nWorkflow trigger: clean rebuild.

The source is NASA Black Marble 2016. The generated file is a clean scalar
historical light-energy field only: no colour tint, bloom, day/night mask,
regional boosts or renderer corrections are baked into the asset.

v135 differs structurally from v133:
- it is rebuilt directly from the original NASA source;
- it keeps the approved reference coordinate field for exact map alignment;
- it uses a detail-preserving footprint (60% centre + 40% local 75th percentile)
  instead of averaging the full footprint, reducing blur while avoiding
  single-sample sparkle;
- it uses a wider uint16 dynamic range (scale 256) so dense hotspots are not
  clipped at 63.999 before runtime tone mapping.
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

# Conservative global warm/neutral emission separation. This is intentionally
# the same proven terrain-rejection family as the final v133 extraction, but
# v135 starts again from the original source and changes the sampling/encoding.
# No continent or region receives any special gain.
source_signal=np.maximum(r-.60*b-.10*g-1.0,0).astype(np.float32)
del rgb,r,g,b

raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_field=coords[:,:,0]
lat_field=coords[:,:,1]

yy,xx=np.mgrid[:H,:W].astype(np.float32)
offsets=[
    (-.30,-.30),(-.30,0),(-.30,.30),
    (0,-.30),(0,0),(0,.30),
    (.30,-.30),(.30,0),(.30,.30)
]
samples=[]
centre=None
for dy,dx in offsets:
    lon=map_coordinates(lon_field,[yy+dy,xx+dx],order=1,mode='nearest')
    lat=map_coordinates(lat_field,[yy+dy,xx+dx],order=1,mode='nearest')
    sy=(90-lat)/180*sh-.5
    sx=(lon+180)/360*sw-.5
    sample=map_coordinates(source_signal,[sy,sx],order=1,mode='grid-wrap').astype(np.float32)
    samples.append(sample)
    if dx==0 and dy==0:
        centre=sample

stack=np.stack(samples,axis=0)
# 7th value (0-index 6) of nine is the 75th-percentile sample. It retains
# compact roads/cities better than a full mean but is robust to one bright
# outlier, unlike max pooling.
q75=np.partition(stack,6,axis=0)[6]
energy=np.maximum(.60*centre+.40*q75,0).astype(np.float32)
del stack,samples,q75,centre,source_signal

# Preserve the full useful Black Marble response in uint16. v133 used scale
# 1024 and therefore clipped values above 63.999; v135 uses scale 256 so values
# up to 255.996 survive for a cleaner runtime soft-knee.
scale=256.0
max_energy=(65535/scale)
quant=np.rint(np.minimum(energy,max_energy)*scale).astype('<u2')
out=root/'night-signal-v135.bin.gz'
out.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
percentiles={str(p):float(np.percentile(energy,p)) for p in (50,75,90,95,97,99,99.5,99.9,99.99)}
meta={
  'version':135,
  'target':'85% Option C structure + 15% Option D finishing glow at runtime',
  'source':source_url,
  'sourcePage':'https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/',
  'sourceYear':2016,
  'sourceSize':[sw,sh],
  'sourceSha256':sha(source),
  'geometry':'reference-coordinates-v127.bin.gz (approved map field)',
  'geometrySha256':sha(root/'reference-coordinates-v127.bin.gz'),
  'signalExtraction':{
    'formula':'max(R - 0.60*B - 0.10*G - 1.0, 0)',
    'regionalBoosts':False,
    'bakedGlow':False,
    'bakedColour':False,
    'bakedDayNightMask':False
  },
  'sampling':{
    'footprint':'9 samples at +/-0.30 destination pixel',
    'combination':'60% centre + 40% local 75th percentile',
    'purpose':'retain compact city/road structure without full-footprint blur or max-pool sparkle'
  },
  'encoding':'gzip uint16 little-endian, scalar energy / 256',
  'signalScale':scale,
  'clipCeiling':max_energy,
  'energyPercentiles':percentiles,
  'signalRange':[float(energy.min()),float(energy.max())],
  'litPixelsAbove':{
    '0.25':int((energy>.25).sum()),
    '0.5':int((energy>.5).sum()),
    '1':int((energy>1).sum()),
    '2':int((energy>2).sum()),
    '5':int((energy>5).sum())
  },
  'outputSha256':sha(out),
  'meaning':'Clean historical urban-light scalar only. Warm gold, micro-glow and UTC solar visibility are runtime effects.'
}
(root/'night-provenance-v135.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({
  'output':str(out),
  'bytes':out.stat().st_size,
  'sha256':meta['outputSha256'],
  'range':meta['signalRange'],
  'percentiles':percentiles,
  'litPixelsAbove':meta['litPixelsAbove']
}))
