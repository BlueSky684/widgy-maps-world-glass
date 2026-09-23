"""Build v137 approved HD yellow-gold night-light master from scratch.

This is a clean rebuild from the original NASA Black Marble 2016 source.
It does not consume, patch, blend or derive from any previous generated
night-signal asset.

Visual target locked by the user:
- crisp/high-definition compact city lights and visible urban networks;
- clean premium yellow-gold, not rose-gold, copper or brown;
- restrained highlight sparkle only at the strongest cores;
- realistic, balanced and uncluttered;
- no regional boosts, hand edits, baked colour, baked glow or baked solar mask.

The generated asset remains scalar light energy. The approved yellow-gold
appearance is applied only at runtime, so geographic energy and styling stay
independent.
"""
from pathlib import Path
import gzip, hashlib, json
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter

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
# Conservative warm/neutral emission separation from the untouched NASA source.
# The extraction remains scalar: yellow-gold colour is NOT baked here.
source_signal=np.maximum(r-.60*b-.10*g-1.0,0).astype(np.float32)
del rgb,r,g,b

raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_field=coords[:,:,0]
lat_field=coords[:,:,1]

# Dense but compact 5x5 subpixel footprint. Offsets stay close to pixel centre
# to preserve network topology instead of broadening cities into blobs.
yy,xx=np.mgrid[:H,:W].astype(np.float32)
axis=(-.18,-.09,0,.09,.18)
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
# Robust percentiles reconnect thin urban/road networks while avoiding
# max-pool sparkle. Centre remains dominant for accurate point placement.
median=np.partition(stack,12,axis=0)[12]
q68=np.partition(stack,16,axis=0)[16]
q84=np.partition(stack,20,axis=0)[20]
base=(.64*centre+.26*q68+.10*q84).astype(np.float32)

# A small one-sided high-frequency recovery sharpens compact cores and thin
# networks globally. This is a single global transform, never a regional edit.
low=gaussian_filter(base,sigma=.58,mode='nearest')
detail=np.maximum(base-low,0)
energy=np.maximum(base+.22*detail,0).astype(np.float32)
del stack,samples,median,q68,q84,centre,base,low,detail,source_signal

# Keep weak networks precise while retaining strong city cores well above the
# previous 64-energy ceiling.
scale=384.0
max_energy=65535/scale
quant=np.rint(np.minimum(energy,max_energy)*scale).astype('<u2')
out=root/'night-signal-v137.bin.gz'
out.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
percentiles={str(p):float(np.percentile(energy,p)) for p in (50,75,90,95,97,99,99.5,99.9,99.99)}
meta={
  'version':137,
  'master':'Approved HD Yellow-Gold Night Lights Master',
  'derivation':'fresh rebuild from original NASA source; no previous night signal used',
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
    'previousSignalReuse':False,
    'bakedGlow':False,
    'bakedColour':False,
    'bakedDayNightMask':False
  },
  'sampling':{
    'footprint':'5x5 at offsets -0.18,-0.09,0,+0.09,+0.18 destination pixel',
    'combination':'64% centre + 26% q68 + 10% q84 + 22% positive high-frequency recovery',
    'highFrequencySigma':0.58,
    'purpose':'maximum practical crispness at final map resolution while preserving thin urban networks and avoiding broad city blobs'
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
  'meaning':'Clean historical urban-light scalar master only. Approved yellow-gold colour, restrained brilliance and UTC solar visibility are runtime effects.'
}
(root/'night-provenance-v137.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({
  'output':str(out),
  'bytes':out.stat().st_size,
  'sha256':meta['outputSha256'],
  'range':meta['signalRange'],
  'percentiles':percentiles,
  'litPixelsAbove':meta['litPixelsAbove']
}))
