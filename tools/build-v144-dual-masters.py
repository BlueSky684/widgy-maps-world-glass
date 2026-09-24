from pathlib import Path
import gzip, json, hashlib
import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
AS=ROOT/'assets'/'earth'
OUT=ROOT/'work'/'v144'
OUT.mkdir(parents=True,exist_ok=True)

SRC_W,SRC_H=1827,861
HD_W,HD_H=3306,1558

def sha256(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

# Clean terrain source.
base_img=Image.open(AS/'reference-base-v127.png').convert('RGB').resize((SRC_W,SRC_H),Image.Resampling.LANCZOS)
base=np.asarray(base_img,dtype=np.float32)
luma=.26*base[:,:,0]+.55*base[:,:,1]+.19*base[:,:,2]
land=np.clip((luma-7)/18,0,1)
land=land*land*(3-2*land)

# Terrain candidates: all keep the original geometry/texture exactly;
# only global tonal grading changes.
terrain_variants={}
for name,gain,rscale,gscale,bscale,gamma in [
    ('A',.72,.94,.93,.96,1.02),
    ('B',.68,.94,.92,.96,1.03),
    ('C',.64,.95,.93,.98,1.04),
    ('D',.70,.92,.91,.95,1.05),
]:
    x=np.clip(base/255,0,1)**gamma
    graded=x*255*np.array([rscale,gscale,bscale],dtype=np.float32)
    ocean=np.stack([np.ones_like(luma),np.full_like(luma,3),np.full_like(luma,5)],axis=2)
    t=(ocean*(1-land[:,:,None])+graded*land[:,:,None])*gain
    t=np.clip(t,0,255).astype(np.uint8)
    terrain_variants[name]=t
    Image.fromarray(t,'RGB').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(
        OUT/f'TerrainCandidate_{name}_FullHD.png',optimize=False)

# Chosen provisional terrain: B is intentionally deep but not crushed.
terrain=terrain_variants['B']

# Night-light scalar from the approved clean NASA-derived v137 master.
raw=gzip.decompress((AS/'night-signal-v137.bin.gz').read_bytes())
if len(raw)!=SRC_W*SRC_H*2:
    raise RuntimeError('Invalid v137 signal')
energy=np.frombuffer(raw,dtype='<u2').reshape(SRC_H,SRC_W).astype(np.float32)/384.0

# Global tone response. Keep weak networks, compress peaks and avoid starbursts.
point=238*np.power(energy/(energy+6.9),.78)
point=np.clip(point,0,205)

# Build isotropic near/far glow from scalar data only.
point_u8=np.clip(point,0,255).astype(np.uint8)
near=np.asarray(Image.fromarray(point_u8,'L').filter(ImageFilter.GaussianBlur(radius=.62)),dtype=np.float32)
far=np.asarray(Image.fromarray(point_u8,'L').filter(ImageFilter.GaussianBlur(radius=1.55)),dtype=np.float32)

# Warm premium gold from approved visual reference.
POINT=np.array([1.00,.86,.54],dtype=np.float32)
NEAR=np.array([1.00,.75,.31],dtype=np.float32)
FAR=np.array([1.00,.62,.18],dtype=np.float32)

# No shine layer, no directional flare, no regional boosts.
light_rgb=np.zeros((SRC_H,SRC_W,3),dtype=np.float32)
for k in range(3):
    p=point*.90*POINT[k]
    n=near*.28*NEAR[k]
    f=far*.055*FAR[k]
    # Screen blend the three positive emissive components.
    tr=(1-p/255)*(1-n/255)*(1-f/255)
    light_rgb[:,:,k]=255*(1-tr)

# Limit extreme cores globally to prevent star-like white burn.
mx=light_rgb.max(axis=2)
scale=np.ones_like(mx)
hot=mx>225
scale[hot]=225/np.maximum(mx[hot],1)
light_rgb*=scale[:,:,None]
light_rgb=np.clip(light_rgb,0,255).astype(np.uint8)

lights_hd=Image.fromarray(light_rgb,'RGB').resize((HD_W,HD_H),Image.Resampling.LANCZOS)
lights_path=OUT/'NightLightsMaster_v144_FullHD_Lossless.png'
lights_hd.save(lights_path,optimize=False)

# Transparent variant. Alpha follows emissive luminance, RGB remains straight.
lumL=.24*light_rgb[:,:,0]+.54*light_rgb[:,:,1]+.22*light_rgb[:,:,2]
alpha=np.clip(lumL*1.55,0,255).astype(np.uint8)
rgba=np.dstack([light_rgb,alpha])
rgba_path=OUT/'NightLightsMaster_v144_FullHD_Transparent.png'
Image.fromarray(rgba,'RGBA').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(rgba_path,optimize=False)

terrain_path=OUT/'TerrainMaster_v144_FullHD_Lossless.png'
Image.fromarray(terrain,'RGB').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(terrain_path,optimize=False)

# Technical recomposition: screen blend terrain + lights.
T=np.asarray(Image.open(terrain_path).convert('RGB'),dtype=np.float32)
L=np.asarray(Image.open(lights_path).convert('RGB'),dtype=np.float32)
recomp=255-(255-T)*(1-L/255)
recomp=np.clip(recomp,0,255).astype(np.uint8)
recomp_path=OUT/'RecombinedPreview_v144_FullHD.png'
Image.fromarray(recomp,'RGB').save(recomp_path,optimize=False)

# Approved reference, for side-by-side evaluation only.
ref=Image.open(AS/'v142-master-native.webp').convert('RGB').resize((HD_W,HD_H),Image.Resampling.NEAREST)
ref_path=OUT/'ApprovedReference_v142_FullHD.png'
ref.save(ref_path,optimize=False)

meta={
  'version':144,
  'architecture':'clean dual-master build',
  'imageGenerationUsed':False,
  'terrainSource':'reference-base-v127.png',
  'lightsSource':'night-signal-v137.bin.gz / NASA Black Marble 2016',
  'terrainCandidateChosen':'B',
  'fullHDResolution':[HD_W,HD_H],
  'formats':{'terrain':'PNG lossless','lights':'PNG lossless','lightsTransparent':'RGBA PNG lossless'},
  'lights':{
    'shineLayer':False,
    'directionalKernel':False,
    'regionalBoosts':False,
    'pointPalette':POINT.tolist(),
    'nearPalette':NEAR.tolist(),
    'farPalette':FAR.tolist()
  },
  'files':{
    terrain_path.name:sha256(terrain_path),
    lights_path.name:sha256(lights_path),
    rgba_path.name:sha256(rgba_path),
    recomp_path.name:sha256(recomp_path),
    ref_path.name:sha256(ref_path)
  }
}
(OUT/'v144-manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta))
