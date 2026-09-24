from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
AS=ROOT/'assets'/'earth'
OUT=ROOT/'work'/'v144'
OUT.mkdir(parents=True,exist_ok=True)

TARGET_NATIVE=(1653,779)
TARGET_HD=(3306,1558)

def sha256(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

# Visual reference approved by the user.
master=np.asarray(Image.open(AS/'v142-master-native.webp').convert('RGB').resize(TARGET_NATIVE,Image.Resampling.NEAREST),dtype=np.float32)

# Clean terrain source: no city-light layer.
base=np.asarray(Image.open(AS/'reference-base-v127.png').convert('RGB').resize(TARGET_NATIVE,Image.Resampling.LANCZOS),dtype=np.float32)

R,G,B=[master[:,:,i] for i in range(3)]
warm=np.clip((R-B-12)/90,0,1)*np.clip((G-B-2)/72,0,1)*np.clip((R+G+B-70)/250,0,1)
master_luma=.24*R+.54*G+.22*B
base_luma=.24*base[:,:,0]+.54*base[:,:,1]+.22*base[:,:,2]

# Clean calibration pixels: avoid warm emissive areas, bright city cores and black ocean.
clean=(warm<.035)&(master_luma>7)&(base_luma>7)
# Keep calibration broad enough across all continents.
idx=np.flatnonzero(clean.ravel())
if len(idx)>220000:
    idx=idx[::max(1,len(idx)//220000)]

# Robust affine RGB transform from clean base terrain -> approved master terrain.
X=base.reshape(-1,3)[idx]
Y=master.reshape(-1,3)[idx]
# Add luma and constant term for better blue-gray tonal fit.
lum=(.24*X[:,0]+.54*X[:,1]+.22*X[:,2])[:,None]
A=np.concatenate([X,lum,np.ones((len(X),1),dtype=np.float32)],axis=1)
coef=np.linalg.lstsq(A,Y,rcond=None)[0]
allX=base.reshape(-1,3)
allLum=(.24*allX[:,0]+.54*allX[:,1]+.22*allX[:,2])[:,None]
allA=np.concatenate([allX,allLum,np.ones((len(allX),1),dtype=np.float32)],axis=1)
terrain=(allA@coef).reshape(master.shape)
terrain=np.clip(terrain,0,255)

# Preserve approved deep oceans: blend transformed terrain toward master where both source and master are near-black/cool.
ocean=np.clip((18-base_luma)/14,0,1)*np.clip((22-master_luma)/18,0,1)
terrain=terrain*(1-ocean[...,None])+master*ocean[...,None]

# Keep terrain clean: globally neutralize residual warm cast without blurring geometry.
tr,tg,tb=[terrain[:,:,i] for i in range(3)]
twarm=np.clip((tr-tb-6)/60,0,1)*np.clip((tg-tb)/52,0,1)
tluma=.24*tr+.54*tg+.22*tb
# Convert warm-biased pixels to a cool blue-gray with same luma.
cool=np.stack([tluma*.70,tluma*.82,tluma*1.08],axis=2)
strength=np.clip(twarm*.72,0,.72)[...,None]
terrain=terrain*(1-strength)+cool*strength
terrain=np.clip(terrain,0,255)

# Night lights: derive only positive warm emissive difference relative to clean terrain.
diff=np.maximum(master-terrain,0)
dr,dg,db=[diff[:,:,i] for i in range(3)]
light_strength=np.clip((R-B-8)/75,0,1)*np.clip((G-B)/65,0,1)
light_strength=np.maximum(light_strength,np.clip((master_luma-tluma-2)/55,0,1)*.55)
# Retain the approved gold/ivory structure, suppress cool terrain residual.
lights=diff*light_strength[...,None]
# Add a very small amount of approved warm component for thin urban networks.
approved_warm=np.stack([
    np.maximum(R-B,0),
    np.maximum(G-B*.75,0),
    np.maximum(B*.18,0)
],axis=2)
lights=np.maximum(lights,approved_warm*np.clip(warm*.28,0,.28)[...,None])
lights=np.clip(lights,0,255)

# Transparent light master.
alpha=np.clip(np.max(lights,axis=2)*1.35,0,255)
rgba=np.dstack([lights,alpha])

# Create HD masters. Terrain uses Lanczos for true high-resolution presentation;
# lights use Lanczos as an emissive layer. PNG is lossless.
terrain_native=Image.fromarray(np.rint(terrain).astype(np.uint8),'RGB')
lights_native=Image.fromarray(np.rint(lights).astype(np.uint8),'RGB')
rgba_native=Image.fromarray(np.rint(rgba).astype(np.uint8),'RGBA')

terrain_hd=terrain_native.resize(TARGET_HD,Image.Resampling.LANCZOS)
lights_hd=lights_native.resize(TARGET_HD,Image.Resampling.LANCZOS)
rgba_hd=rgba_native.resize(TARGET_HD,Image.Resampling.LANCZOS)
master_hd=Image.fromarray(master.astype(np.uint8),'RGB').resize(TARGET_HD,Image.Resampling.NEAREST)

terrain_path=OUT/'TerrainMaster_v144_FullHD_Lossless.png'
lights_path=OUT/'NightLightsMaster_v144_FullHD_Lossless.png'
rgba_path=OUT/'NightLightsMaster_v144_FullHD_Transparent.png'
reference_path=OUT/'ApprovedReference_v142_FullHD.png'
terrain_hd.save(terrain_path,optimize=False)
lights_hd.save(lights_path,optimize=False)
rgba_hd.save(rgba_path,optimize=False)
master_hd.save(reference_path,optimize=False)

# Technical preview composition (screen blend); for comparison only.
T=np.asarray(terrain_hd,dtype=np.float32)
L=np.asarray(lights_hd,dtype=np.float32)
recomp=255-(255-T)*(1-L/255)
recomp=np.clip(recomp,0,255).astype(np.uint8)
recomp_path=OUT/'RecombinedPreview_v144_FullHD.png'
Image.fromarray(recomp,'RGB').save(recomp_path,optimize=False)

meta={
  'version':144,
  'architecture':'clean dual-master build',
  'reference':'assets/earth/v142-master-native.webp',
  'terrainSource':'assets/earth/reference-base-v127.png',
  'nativeResolution':TARGET_NATIVE,
  'fullHDResolution':TARGET_HD,
  'formats':{'terrain':'PNG lossless','lights':'PNG lossless','lightsTransparent':'RGBA PNG lossless'},
  'terrainGeneration':'clean source color-calibrated to approved reference; no inpainting/subtraction from lit master',
  'lightsGeneration':'warm positive emissive difference relative to clean calibrated terrain',
  'imageGenerationUsed':False,
  'files':{
    terrain_path.name:sha256(terrain_path),
    lights_path.name:sha256(lights_path),
    rgba_path.name:sha256(rgba_path),
    reference_path.name:sha256(reference_path),
    recomp_path.name:sha256(recomp_path)
  }
}
(OUT/'v144-manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta))
