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

# --- TERRAIN: clean source only, no light subtraction or inpainting ---
base_img=Image.open(AS/'reference-base-v127.png').convert('RGB').resize((SRC_W,SRC_H),Image.Resampling.LANCZOS)
base=np.asarray(base_img,dtype=np.float32)
luma=.26*base[:,:,0]+.55*base[:,:,1]+.19*base[:,:,2]
land=np.clip((luma-7)/18,0,1); land=land*land*(3-2*land)

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

# A is visually closest to the approved blue-gray reference at this stage.
terrain=terrain_variants['A']
terrain_path=OUT/'TerrainMaster_v144_FullHD_Lossless.png'
Image.fromarray(terrain,'RGB').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(terrain_path,optimize=False)

# --- LIGHTS: independent NASA-derived v141 network/body/core assets ---
def load_layer(name):
    raw=gzip.decompress((AS/name).read_bytes())
    if len(raw)!=SRC_W*SRC_H*2:
        raise RuntimeError('Invalid '+name)
    return np.frombuffer(raw,dtype='<u2').reshape(SRC_H,SRC_W).astype(np.float32)/384.0

network=load_layer('night-network-v141.bin.gz')
body=load_layer('night-body-v141.bin.gz')
core=load_layer('night-core-v141.bin.gz')

# Tone curves preserve weak networks while compressing peaks.
N=np.where(network>.06, 175*np.power(network/(network+2.8),.70), 0)
B=np.where(body>0, 225*np.power(body/(body+4.0),.64), 0)
C=np.where(core>0, 205*np.power(core/(core+9.0),.80), 0)
N=np.clip(N,0,180); B=np.clip(B,0,205); C=np.clip(C,0,165)

# Isotropic body glow only. No directional kernels / starburst.
B8=np.clip(B,0,255).astype(np.uint8)
near=np.asarray(Image.fromarray(B8,'L').filter(ImageFilter.GaussianBlur(radius=.72)),dtype=np.float32)
far=np.asarray(Image.fromarray(B8,'L').filter(ImageFilter.GaussianBlur(radius=1.80)),dtype=np.float32)

# Three visual candidates; all remain gold/ivory and starburst-free.
light_configs={
  'A': dict(network=.36,body=.22,near=.52,far=.08,core=.30,
            ncol=(1,.78,.33),bcol=(1,.69,.22),ccol=(1,.95,.76)),
  'B': dict(network=.42,body=.25,near=.62,far=.10,core=.34,
            ncol=(1,.76,.28),bcol=(1,.65,.17),ccol=(1,.94,.74)),
  'C': dict(network=.34,body=.28,near=.70,far=.12,core=.30,
            ncol=(1,.80,.38),bcol=(1,.68,.20),ccol=(1,.96,.79)),
}

lights_variants={}
for name,cfg in light_configs.items():
    out=np.zeros((SRC_H,SRC_W,3),dtype=np.float32)
    for k in range(3):
        n=N*cfg['network']*cfg['ncol'][k]
        bp=B*cfg['body']*cfg['bcol'][k]
        ng=near*cfg['near']*cfg['bcol'][k]
        fg=far*cfg['far']*cfg['bcol'][k]
        cc=C*cfg['core']*cfg['ccol'][k]
        tr=(1-n/255)*(1-bp/255)*(1-ng/255)*(1-fg/255)*(1-cc/255)
        out[:,:,k]=255*(1-tr)
    # Global highlight compression only; no local star effect.
    mx=out.max(axis=2)
    scale=np.ones_like(mx)
    hot=mx>232
    scale[hot]=232/np.maximum(mx[hot],1)
    out=np.clip(out*scale[:,:,None],0,255).astype(np.uint8)
    lights_variants[name]=out
    Image.fromarray(out,'RGB').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(
        OUT/f'LightsCandidate_{name}_FullHD.png',optimize=False)

# Candidate B is the closest target: rich yellow-gold, restrained ivory cores.
light_rgb=lights_variants['B']
lights_path=OUT/'NightLightsMaster_v144_FullHD_Lossless.png'
Image.fromarray(light_rgb,'RGB').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(lights_path,optimize=False)

# Transparent version.
lumL=.24*light_rgb[:,:,0]+.54*light_rgb[:,:,1]+.22*light_rgb[:,:,2]
alpha=np.clip(lumL*1.48,0,255).astype(np.uint8)
rgba=np.dstack([light_rgb,alpha])
rgba_path=OUT/'NightLightsMaster_v144_FullHD_Transparent.png'
Image.fromarray(rgba,'RGBA').resize((HD_W,HD_H),Image.Resampling.LANCZOS).save(rgba_path,optimize=False)

# Recomposition preview.
T=np.asarray(Image.open(terrain_path).convert('RGB'),dtype=np.float32)
L=np.asarray(Image.open(lights_path).convert('RGB'),dtype=np.float32)
recomp=255-(255-T)*(1-L/255)
recomp=np.clip(recomp,0,255).astype(np.uint8)
recomp_path=OUT/'RecombinedPreview_v144_FullHD.png'
Image.fromarray(recomp,'RGB').save(recomp_path,optimize=False)

# Approved reference for comparison only.
ref=Image.open(AS/'v142-master-native.webp').convert('RGB').resize((HD_W,HD_H),Image.Resampling.NEAREST)
ref_path=OUT/'ApprovedReference_v142_FullHD.png'
ref.save(ref_path,optimize=False)

meta={
  'version':144,
  'architecture':'clean dual-master build',
  'imageGenerationUsed':False,
  'terrainSource':'reference-base-v127.png',
  'lightsSource':'night-network/body/core-v141.bin.gz from NASA Black Marble 2016',
  'terrainCandidateChosen':'A',
  'lightsCandidateChosen':'B',
  'fullHDResolution':[HD_W,HD_H],
  'formats':{'terrain':'PNG lossless','lights':'PNG lossless','lightsTransparent':'RGBA PNG lossless'},
  'starburstLayer':False,'directionalKernel':False,'regionalBoosts':False,
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
