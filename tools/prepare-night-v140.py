"""Build v140 Luxury Multi-Layer Night Lights from scratch.

Fresh rebuild from the untouched NASA Black Marble 2016 source.
No previous generated night-light asset is read or reused.

v140 produces THREE independent scalar layers:
1. Urban Network — weak/mid connected urban corridors and roads.
2. City Body — compact city mass used for a soft premium glow.
3. City Core — strongest city centres only, rendered as small round ivory cores.

No colour, glow, day/night mask, regional gain, hand edit, starburst, shine,
flare, or directional kernel is baked into the assets.
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
source_signal=np.maximum(r-.60*b-.10*g-1.0,0).astype(np.float32)
del rgb,r,g,b

raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_field=coords[:,:,0]
lat_field=coords[:,:,1]

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
q56=np.partition(stack,13,axis=0)[13]
q68=np.partition(stack,16,axis=0)[16]
q80=np.partition(stack,19,axis=0)[19]
q88=np.partition(stack,21,axis=0)[21]

# NETWORK: keep weak/mid connected illumination. Centre remains important,
# with robust mid percentiles reconnecting thin roads/urban corridors.
network=np.maximum(.50*centre+.32*q56+.18*q68,0).astype(np.float32)

# BODY: suppress weak isolated noise and favour compact populated areas without
# max pooling. This layer will receive a small isotropic blur at runtime.
body_base=np.maximum(.52*centre+.30*q68+.18*q80,0).astype(np.float32)
body=np.maximum(body_base-.18,0).astype(np.float32)

# CORE: strong population centres only. Using q88 + centre gives stable compact
# cores, then a global threshold removes weak points entirely. No sharpening.
core_base=np.maximum(.64*centre+.36*q88,0).astype(np.float32)
core=np.maximum(core_base-10.0,0).astype(np.float32)

del stack,samples,q56,q68,q80,q88,centre,body_base,core_base,source_signal

scale=384.0
max_energy=65535/scale
def write_layer(name,arr):
    quant=np.rint(np.minimum(arr,max_energy)*scale).astype('<u2')
    path=root/name
    path.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))
    return path

network_out=write_layer('night-network-v140.bin.gz',network)
body_out=write_layer('night-body-v140.bin.gz',body)
core_out=write_layer('night-core-v140.bin.gz',core)

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def stats(arr):
    return {
      'range':[float(arr.min()),float(arr.max())],
      'percentiles':{str(p):float(np.percentile(arr,p)) for p in (50,75,90,95,97,99,99.5,99.9,99.99)},
      'pixelsAbove':{
        '0.25':int((arr>.25).sum()),
        '0.5':int((arr>.5).sum()),
        '1':int((arr>1).sum()),
        '2':int((arr>2).sum()),
        '5':int((arr>5).sum()),
        '10':int((arr>10).sum())
      }
    }

meta={
  'version':140,
  'master':'Luxury Multi-Layer Night Lights Rebuild',
  'derivation':'fresh rebuild from original NASA source; no previous night asset reused',
  'source':source_url,
  'sourcePage':'https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/',
  'sourceYear':2016,
  'sourceSize':[sw,sh],
  'sourceSha256':sha(source),
  'geometry':'reference-coordinates-v127.bin.gz (approved map field)',
  'geometrySha256':sha(root/'reference-coordinates-v127.bin.gz'),
  'sourceExtraction':'max(R - 0.60*B - 0.10*G - 1.0, 0)',
  'sampling':'5x5 compact footprint at +/-0.18 and +/-0.09 destination pixel',
  'layers':{
    'network':{
      'file':network_out.name,
      'formula':'50% centre + 32% q56 + 18% q68',
      'purpose':'weak/mid connected urban corridors and roads',
      **stats(network)
    },
    'body':{
      'file':body_out.name,
      'formula':'max(52% centre + 30% q68 + 18% q80 - 0.18, 0)',
      'purpose':'compact city mass for soft premium glow',
      **stats(body)
    },
    'core':{
      'file':core_out.name,
      'formula':'max(64% centre + 36% q88 - 10.0, 0)',
      'purpose':'strongest city centres only, for small round ivory cores',
      **stats(core)
    }
  },
  'encoding':'gzip uint16 little-endian, scalar energy / 384',
  'signalScale':scale,
  'regionalBoosts':False,
  'handEdits':False,
  'previousSignalReuse':False,
  'bakedColour':False,
  'bakedGlow':False,
  'bakedDayNightMask':False,
  'starburstLayer':False,
  'directionalKernel':False,
  'outputs':{
    network_out.name:sha(network_out),
    body_out.name:sha(body_out),
    core_out.name:sha(core_out)
  }
}
(root/'night-provenance-v140.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({
  'network':{'bytes':network_out.stat().st_size,'sha256':meta['outputs'][network_out.name],**stats(network)},
  'body':{'bytes':body_out.stat().st_size,'sha256':meta['outputs'][body_out.name],**stats(body)},
  'core':{'bytes':core_out.stat().st_size,'sha256':meta['outputs'][core_out.name],**stats(core)}
}))
