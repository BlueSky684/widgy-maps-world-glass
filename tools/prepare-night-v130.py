"""Build lighting data without changing the v129 albedo or day/night field.

NASA Black Marble 2016 colour composite supplies the emission signal, not
terrain. Registration uses the existing illustrative atlas calibration.
The result is styled historical lighting, not live radiance or exact GIS.
"""
from pathlib import Path
import gzip, hashlib, json
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter
from scipy.spatial import Delaunay

W,H=1827,861
root=Path('assets/earth')
source=Path('work/map/black-marble-2016-3km.jpg')
url='https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg'
Image.MAX_IMAGE_PIXELS=100_000_000
rgb=np.asarray(Image.open(source).convert('RGB'))
sh,sw=rgb.shape[:2]
assert (sw,sh)==(13500,6750)
signal=np.empty((sh,sw),np.float32)
for y in range(0,sh,100):
    s=rgb[y:y+100].astype(np.float32)
    # Remove the blue geographic backdrop from NASA's colour composite.
    # This is display-signal extraction, not physical radiance recovery.
    signal[y:y+100]=np.maximum(s[:,:,0]-.6*s[:,:,2]-.1*s[:,:,1]-2.5,0)
del rgb
coords=np.frombuffer(gzip.decompress((root/'reference-coordinates-v127.bin.gz').read_bytes()),'<i2').reshape(H,W,2)
coords=coords.cumsum(axis=1).astype(np.float32)/100
# Improve coastal registration of the new source only. Original albedo,
# solar mask and IP marker retain the v129 calibration. These are manually
# registered landmarks on illustrative artwork, not a survey-grade transform.
mesh=json.loads((root/'reference-mesh-v127.json').read_text())
points=np.array(mesh['points'],np.float64)
updates={
 (130,31):(1507,298),(141,41):(1552,231),
 (146,-43):(1578,708),(172,-42):(1680,731),
 (115,-22):(1427,622),(153,-28):(1610,648),
 (100,3):(1354,428),(109,-7):(1430,512),
 (133,-4):(1572,497),(-74,40.7):(540,233),
}
for row in points:
    if tuple(row[:2]) in updates: row[2:]=updates[tuple(row[:2])]
extra=[
 [139.69,35.68,1545,267],[135.50,34.69,1519,279],
 [141.9,45.5,1554,188],[140.9,41.55,1552,228],
 [130.40,33.59,1502,282],[126.98,37.57,1492,245],
 [121.47,31.23,1462,283],[121.56,25.03,1462,322],
 [103.82,1.35,1379,462],[106.85,-6.20,1397,506],
 [151.21,-33.87,1597,670],[144.96,-37.81,1563,681],
 [138.60,-34.93,1535,660],[115.86,-31.95,1440,648],
 [130.84,-12.46,1526,553],[174.76,-36.85,1708,699],
 [18.42,-33.93,986,653],[-0.13,51.51,874,159]
]
points=np.vstack((points,np.array(extra)))
tri=Delaunay(points[:,2:])
# Only one-to-one source triangles are permitted.
for indices in tri.simplices:
    a=points[indices,2:]; g=points[indices,:2]
    determinant=lambda v:np.linalg.det(np.array([v[1]-v[0],v[2]-v[0]]))
    assert determinant(a)*determinant(g)<0, f'Folded lighting triangle {indices}'
yg,xg=np.mgrid[:H,:W]
samples=np.column_stack((xg.ravel()+.5,yg.ravel()+.5))
si=tri.find_simplex(samples)
assert np.all(si>=0)
bary=np.einsum('ijk,ik->ij',tri.transform[si,:2],samples-tri.transform[si,2])
weights=np.column_stack((bary,1-bary.sum(axis=1)))
light_coords=np.einsum('ij,ijk->ik',weights,points[tri.simplices[si],:2]).reshape(H,W,2).astype(np.float32)
(root/'night-mesh-v130.json').write_text(json.dumps({'points':points.tolist(),'triangles':tri.simplices.tolist(),'accuracy':'approximate illustrated atlas registration; lighting only'},separators=(',',':'))+'\n')
# Nine samples per destination footprint retain subpixel urban clusters.
# Average BEFORE the contrast curve so subdivision does not amplify noise.
yy,xx=np.mgrid[:H,:W].astype(np.float32)
energy=np.zeros((H,W),np.float32)
for dy in [-1/3,0,1/3]:
    for dx in [-1/3,0,1/3]:
        lon=map_coordinates(light_coords[:,:,0],[yy+dy,xx+dx],order=1,mode='nearest')
        lat=map_coordinates(light_coords[:,:,1],[yy+dy,xx+dx],order=1,mode='nearest')
        energy+=map_coordinates(signal,[(90-lat)/180*sh-.5, (lon+180)/360*sw-.5],order=1,mode='grid-wrap')/9
# Preserve low-level points without lifting the whole dark ocean background.
energy=np.maximum(energy-.35,0)
# Single-channel source, no prebaked bloom or colour, permits independent
# point response / warm halo at runtime. Float energy stored as gzip little-endian uint16.
quantized=np.rint(np.minimum(energy,127)*512).astype(np.uint16)
(root/'night-signal-v130.bin.gz').write_bytes(gzip.compress(quantized.astype('<u2').tobytes(),mtime=0))

# The blue air overlay is decorative. Smooth only its projection residual,
# retaining the original coordinates for terrain, city masks and marker.
xbase=np.broadcast_to((np.arange(W,dtype=np.float32)+.5)/W*360-180,(H,W))
ybase=np.broadcast_to((85-(np.arange(H,dtype=np.float32)+.5)/H*160)[:,None],(H,W))
base=np.stack((xbase,ybase),axis=2)
residual=coords-base
edge=1-np.clip(np.minimum(xx,W-1-xx)/260,0,1)
edge=edge*edge*(3-2*edge)
air=np.empty_like(coords)
for k in range(2):
    moderate=gaussian_filter(residual[:,:,k],sigma=(22,12),mode=('nearest','wrap'))
    broad=gaussian_filter(residual[:,:,k],sigma=(55,12),mode=('nearest','wrap'))
    air[:,:,k]=base[:,:,k]+moderate*(1-edge)+broad*edge
# Keep the decorative halo close to the physical illumination boundary.
air=coords+np.clip(air-coords,-2,2)
quant=np.rint(air*100).astype(np.int32)
delta=np.diff(quant,axis=1,prepend=np.zeros((H,1,2),np.int32))
assert np.max(np.abs(delta))<=32767
(root/'air-coordinates-v130.bin.gz').write_bytes(gzip.compress(delta.astype('<i2').tobytes(),mtime=0))
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
meta={
 'version':130,'source':url,'sourcePage':'https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/',
 'sourceSha256':sha(source),'sourceYear':2016,'sourceSize':[sw,sh],
 'signal':'warm-colour separation, 3x3 footprint sampling, scalar gzip uint16; values /512',
 'registration':'v127 calibration with 18 additional lighting-only coastal controls; approximate, not survey-grade',
 'terrainBase':'reference-base-v127.png','terrainSha256':sha(root/'reference-base-v127.png'),
 'terrainAndSolarFieldUnchanged':True,'newSignalSha256':sha(root/'night-signal-v130.bin.gz'),
 'airOnlySmoothing':{'moderateSigma':[22,12],'edgeSigma':[55,12],'maxCoordinateChangeDegrees':2,
 'p95CoordinateChangeDegrees':float(np.percentile(np.abs(air-coords),95))},
 'meaning':'Historical urban light texture; runtime UTC determines day/night. Not a live satellite feed.'}
(root/'night-provenance-v130.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({'signalRange':list(map(float,[energy.min(),energy.max()])), 'litPixels':int((energy>1).sum()),'signalBytes':(root/'night-signal-v130.bin.gz').stat().st_size,'airBytes':(root/'air-coordinates-v130.bin.gz').stat().st_size,'p95AirChange':meta['airOnlySmoothing']['p95CoordinateChangeDegrees']}))
