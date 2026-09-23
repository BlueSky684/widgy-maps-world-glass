"""Build v136 HD night-light master from the original NASA source.

Goal: maximum clean urban-network detail with realistic premium champagne-gold
rendering at runtime. The generated file is scalar historical light energy only:
no colour, glow, regional gain, day/night mask, terrain correction or hand edit
is baked into the asset.

HD strategy:
- original 13500x6750 NASA Black Marble source;
- approved reference coordinate field for exact map alignment;
- 5x5 subpixel footprint at +/-0.22 destination pixel;
- robust detail-preserving combination: centre + local percentiles + a restrained
  centre-vs-median detail term;
- wide uint16 precision at scale 384 to retain weak networks and strong cores.
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

# Proven global terrain rejection. Keep extraction conservative; v136 gains HD
# detail through source-space sampling rather than by admitting more background.
source_signal=np.maximum(r-.60*b-.10*g-1.0,0).astype(np.float32)
del rgb,r,g,b

raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_field=coords[:,:,0]
lat_field=coords[:,:,1]

yy,xx=np.mgrid[:H,:W].astype(np.float32)
axis=(-.22,-.11,0,.11,.22)
samples=[]
centre=None
for dy in axis:
    for dx in axis:
        lon=map_coordinates(lon_field,[yy+dy,xx+dx],order=1,mode='nearest')
        lat=map_coordinates(lat_field,[yy+dy,xx+dx],order=1,mode='nearest')
        sy=(90-lat)/180*sh-.5
        sx=(lon+180)/360*sw-.5
        sample=map_coordinates(source_signal,[sy,sx],order=1,mode='grid-wrap').astype(np.float32)
        samples.append(sample)
        if dx==0 and dy==0:
            centre=sample

stack=np.stack(samples,axis=0)
# 25 samples: index 12 = median, 17 ~= 72nd percentile, 21 ~= 88th percentile.
median=np.partition(stack,12,axis=0)[12]
q72=np.partition(stack,17,axis=0)[17]
q88=np.partition(stack,21,axis=0)[21]

# Centre keeps exact point placement; robust upper percentiles reconnect thin
# road/city networks without max-pool sparkle. A small positive centre-vs-median
# term restores micro-contrast at compact cores.
detail=np.maximum(centre-median,0)
energy=np.maximum(.60*centre+.28*q72+.12*q88+.14*detail,0).astype(np.float32)
del stack,samples,median,q72,q88,centre,detail,source_signal

scale=384.0
max_energy=65535/scale
quant=np.rint(np.minimum(energy,max_energy)*scale).astype('<u2')
out=root/'night-signal-v136.bin.gz'
out.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
percentiles={str(p):float(np.percentile(energy,p)) for p in (50,75,90,95,97,99,99.5,99.9,99.99)}
meta={
  'version':136,
  'master':'HD Night Lights Master',
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
    'handEdits':False,
    'bakedGlow':False,
    'bakedColour':False,
    'bakedDayNightMask':False
  },
  'sampling':{
    'footprint':'5x5 at offsets -0.22,-0.11,0,+0.11,+0.22 destination pixel',
    'combination':'60% centre + 28% q72 + 12% q88 + 14% positive centre-minus-median detail',
    'purpose':'HD-like subpixel recovery of compact lights and urban networks while avoiding blur and max-pool sparkle'
  },
  'encoding':'gzip uint16 little-endian, scalar energy / 384',
  'signalScale':scale,
  'clipCeiling':max_energy,
  'energyPercentiles':percentiles,
  'signalRange':[float(energy.min()),float(energy.max())],
  'litPixelsAbove':{
    '0.25':int((energy>.25).sum()),
    '0.5':int((energy>.5).sum()),
    '1':int((energy>1).sum()),
    '2':int((energy>2).sum()),
    '5':int((energy>5).sum()),
    '10':int((energy>10).sum())
  },
  'outputSha256':sha(out),
  'meaning':'Clean historical urban-light scalar master. Champagne-gold colour, brilliance, micro-glow and UTC solar visibility are runtime effects.'
}
(root/'night-provenance-v136.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({
  'output':str(out),
  'bytes':out.stat().st_size,
  'sha256':meta['outputSha256'],
  'range':meta['signalRange'],
  'percentiles':percentiles,
  'litPixelsAbove':meta['litPixelsAbove']
}))
