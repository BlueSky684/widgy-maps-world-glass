"""Build v139 Luxury Yellow-Gold scalar master from scratch.

Fresh rebuild from the untouched NASA Black Marble 2016 source.
No previous generated night signal is read, blended or patched.

Visual target:
- clean premium yellow-gold, brighter and less bronze/brown;
- crisp compact city lights and visible urban networks;
- no starburst, spikes, sparkle, flare or directional highlight effects;
- realistic hierarchy and balanced hotspots;
- no regional boosts, hand edits, baked colour, baked glow or baked solar mask.

The generated file remains a scalar historical light-energy field. Luxury
yellow-gold / ivory styling is applied only at runtime by the renderer.
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
# Conservative global emission extraction. Keep the source scalar and neutral;
# the luxury yellow-gold appearance is NOT baked into this asset.
source_signal=np.maximum(r-.60*b-.10*g-1.0,0).astype(np.float32)
del rgb,r,g,b

raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_field=coords[:,:,0]
lat_field=coords[:,:,1]

# Compact 5x5 subpixel footprint: enough sampling for connected urban networks,
# but deliberately tighter than a broad average so cities remain crisp.
yy,xx=np.mgrid[:H,:W].astype(np.float32)
axis=(-.15,-.075,0,.075,.15)
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
# Robust percentile blend: centre dominates exact point placement, while q64/q80
# reconnect thin networks. No max-pooling and no high-frequency overshoot term,
# specifically to avoid harsh isolated "star" cores.
q64=np.partition(stack,15,axis=0)[15]
q80=np.partition(stack,19,axis=0)[19]
energy=np.maximum(.68*centre+.22*q64+.10*q80,0).astype(np.float32)
del stack,samples,q64,q80,centre,source_signal

scale=384.0
max_energy=65535/scale
quant=np.rint(np.minimum(energy,max_energy)*scale).astype('<u2')
out=root/'night-signal-v139.bin.gz'
out.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
percentiles={str(p):float(np.percentile(energy,p)) for p in (50,75,90,95,97,99,99.5,99.9,99.99)}
meta={
  'version':139,
  'master':'Luxury Yellow-Gold Clean Rebuild',
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
    'bakedDayNightMask':False,
    'highFrequencyOvershoot':False
  },
  'sampling':{
    'footprint':'5x5 at offsets -0.15,-0.075,0,+0.075,+0.15 destination pixel',
    'combination':'68% centre + 22% q64 + 10% q80',
    'purpose':'preserve crisp compact points and connected urban networks without max-pool sparkle or sharpened star cores'
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
  'meaning':'Clean historical urban-light scalar master. Luxury yellow-gold and ivory round cores are runtime effects only.'
}
(root/'night-provenance-v139.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({
  'output':str(out),
  'bytes':out.stat().st_size,
  'sha256':meta['outputSha256'],
  'range':meta['signalRange'],
  'percentiles':percentiles,
  'litPixelsAbove':meta['litPixelsAbove']
}))
