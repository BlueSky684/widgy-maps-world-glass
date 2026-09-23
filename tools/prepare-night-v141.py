"""Build v141 High-Res Emissive Light Atlas from scratch.

Fresh rebuild from the untouched NASA Black Marble 2016 source.
No previous generated night-light asset is read or reused.

Pipeline:
1. Upsample the approved geographic coordinate field to 2x destination size.
2. Sample the original 13500x6750 NASA source at that 2x field.
3. Build three high-resolution emissive fields:
   - network: weak/mid connected urban ribbons
   - body: soft city mass
   - core: compact strongest centres
4. Downsample each field with high-quality area reduction to 1827x861.
5. Store scalar layers only. Colour and night visibility remain runtime effects.

Explicitly absent:
- starburst / shine / directional flare
- regional boosts / hand edits
- baked colour / baked glow / baked day-night mask
- previous signal reuse
"""
from pathlib import Path
import gzip, hashlib, json
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter, maximum_filter

W,H=1827,861
SCALE2=2
HW,HH=W*SCALE2,H*SCALE2
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

# Decode approved destination geographic field.
raw=gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes())
coords=np.frombuffer(raw,'<i2').reshape(H,W,2).cumsum(axis=1).astype(np.float32)/100
lon_base=coords[:,:,0]
lat_base=coords[:,:,1]

# Upsample coordinate fields to 2x with bicubic interpolation. This does not
# invent geography; it interpolates the already-approved illustrated map field.
hy,hx=np.mgrid[:HH,:HW].astype(np.float32)
by=(hy+.5)/SCALE2-.5
bx=(hx+.5)/SCALE2-.5
lon_hi=map_coordinates(lon_base,[by,bx],order=3,mode='nearest')
lat_hi=map_coordinates(lat_base,[by,bx],order=3,mode='nearest')

sy=(90-lat_hi)/180*sh-.5
sx=(lon_hi+180)/360*sw-.5
raw_hi=map_coordinates(source_signal,[sy,sx],order=1,mode='grid-wrap').astype(np.float32)
del lon_hi,lat_hi,source_signal,sy,sx

# Global low floor: suppress colour/background residue but keep real weak urban
# emission. All operations are global and continent-agnostic.
raw_hi=np.maximum(raw_hi-.08,0)

# NETWORK: use a very small isotropic dilation followed by a small Gaussian.
# This connects subpixel gaps in urban corridors without directional kernels.
# Blend mostly original energy with the connected field to retain topology.
connected=maximum_filter(raw_hi,size=3,mode='nearest')
network_hi=.58*raw_hi+.42*connected
network_hi=gaussian_filter(network_hi,sigma=.55,mode='nearest')
network_hi=np.maximum(network_hi-.05,0).astype(np.float32)

# BODY: density/mass at city scale. Moderate isotropic blur, then soft-knee
# compression so dense Europe / East US do not become flat white blobs.
body_hi=gaussian_filter(raw_hi,sigma=1.35,mode='nearest')
body_hi=np.maximum(body_hi-.18,0)
body_hi=body_hi/(1+body_hi/105.0)
body_hi=body_hi.astype(np.float32)

# CORE: only strong centres. No sharpening or cross kernel; tiny isotropic blur
# produces compact round cores after downsampling.
core_hi=np.maximum(raw_hi-11.5,0)
core_hi=gaussian_filter(core_hi,sigma=.48,mode='nearest')
core_hi=core_hi/(1+core_hi/95.0)
core_hi=core_hi.astype(np.float32)
del raw_hi,connected

# High-quality 2x -> 1x reduction using exact 2x2 area mean. This acts as a
# deterministic supersampling/downsampling pass and removes pixel-grid harshness.
def down2(arr):
    return arr.reshape(H,SCALE2,W,SCALE2).mean(axis=(1,3)).astype(np.float32)

network=down2(network_hi)
body=down2(body_hi)
core=down2(core_hi)
del network_hi,body_hi,core_hi

enc_scale=384.0
max_energy=65535/enc_scale
def write_layer(name,arr):
    quant=np.rint(np.minimum(arr,max_energy)*enc_scale).astype('<u2')
    path=root/name
    path.write_bytes(gzip.compress(quant.tobytes(),compresslevel=9,mtime=0))
    return path

network_out=write_layer('night-network-v141.bin.gz',network)
body_out=write_layer('night-body-v141.bin.gz',body)
core_out=write_layer('night-core-v141.bin.gz',core)

sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def stats(arr):
    return {
      'range':[float(arr.min()),float(arr.max())],
      'percentiles':{str(p):float(np.percentile(arr,p)) for p in (50,75,90,95,97,99,99.5,99.9,99.99)},
      'pixelsAbove':{
        '0.10':int((arr>.10).sum()),
        '0.25':int((arr>.25).sum()),
        '0.5':int((arr>.5).sum()),
        '1':int((arr>1).sum()),
        '2':int((arr>2).sum()),
        '5':int((arr>5).sum()),
        '10':int((arr>10).sum())
      }
    }

meta={
  'version':141,
  'master':'High-Res Emissive Light Atlas',
  'derivation':'fresh rebuild from original NASA source; no previous night asset reused',
  'source':source_url,
  'sourcePage':'https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/',
  'sourceYear':2016,
  'sourceSize':[sw,sh],
  'sourceSha256':sha(source),
  'geometry':'reference-coordinates-v127.bin.gz (approved map field)',
  'geometrySha256':sha(root/'reference-coordinates-v127.bin.gz'),
  'workingResolution':[HW,HH],
  'finalResolution':[W,H],
  'supersampling':'2x destination resolution then exact 2x2 area reduction',
  'sourceExtraction':'max(R - 0.60*B - 0.10*G - 1.0, 0)',
  'layers':{
    'network':{
      'file':network_out.name,
      'pipeline':'58% original + 42% 3x3 isotropic max-filter, Gaussian sigma 0.55 at 2x, floor 0.05, area downsample',
      'purpose':'continuous weak/mid urban ribbons without point-dust appearance',
      **stats(network)
    },
    'body':{
      'file':body_out.name,
      'pipeline':'Gaussian sigma 1.35 at 2x, floor 0.18, global soft-knee /105, area downsample',
      'purpose':'smooth city mass / premium emissive body',
      **stats(body)
    },
    'core':{
      'file':core_out.name,
      'pipeline':'threshold 11.5, Gaussian sigma 0.48 at 2x, global soft-knee /95, area downsample',
      'purpose':'compact round strongest centres only',
      **stats(core)
    }
  },
  'encoding':'gzip uint16 little-endian, scalar energy / 384',
  'signalScale':enc_scale,
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
(root/'night-provenance-v141.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({
  'network':{'bytes':network_out.stat().st_size,'sha256':meta['outputs'][network_out.name],**stats(network)},
  'body':{'bytes':body_out.stat().st_size,'sha256':meta['outputs'][body_out.name],**stats(body)},
  'core':{'bytes':core_out.stat().st_size,'sha256':meta['outputs'][core_out.name],**stats(core)}
}))
