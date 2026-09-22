"""Calibrate reference-art illumination; the artwork itself is never warped.

Landmark positions are measured on the 1827x861 reconstructed reference.
This is an illustrative atlas calibration, not survey-grade georeferencing.
"""
import json
import gzip
from pathlib import Path
import numpy as np
from scipy.spatial import Delaunay

W,H=1827,861
# longitude, latitude, artwork x, artwork y
points=[
 [-180,85,0,0],[180,85,W,0],[-180,-75,0,H],[180,-75,W,H],
 [-90,85,457,0],[0,85,914,0],[90,85,1370,0],
 [-180,0,0,457],[180,0,W,457],[-90,-75,457,H],[0,-75,914,H],[90,-75,1370,H],
 [-168,65,66,73],[-152,59,183,122],[-123,49,269,183],
 [-122.4,37.8,280,248],[-117.2,32.5,301,280],[-110,23,344,329],
 [-105,20,368,357],[-87,21,438,337],[-80,9,485,400],
 [-74,40.7,538,242],[-80.5,25,471,308],[-85,58,455,130],
 [-56,49,588,185],[-44,60,652,121],[-45,78,682,24],[-90,80,455,28],
 [-19,65,765,97],[-3,55,870,144],[-8,53,839,153],
 [-9,39,837,229],[-5.5,36,854,249],[10,62,961,74],[28,70,1065,27],
 [12.5,42,964,236],[30,39,1080,238],[35.2,32.1,1076,293],
 [18.5,-34,986,658],[-17,15,784,364],[51,12,1143,384],
 [50,-16,1104,530],[44,-25,1087,607],[32,31,1048,306],
 [50,26,1165,318],[58,23,1198,338],[77,8,1242,414],
 [80,29,1265,280],[100,3,1360,431],[109,-7,1460,500],
 [133,-4,1592,489],[130,31,1521,271],[141,41,1580,208],
 [123,54,1485,159],[105,75,1400,39],[175,60,1736,92],
 [115,-22,1434,618],[153,-28,1611,649],[146,-43,1608,713],
 [172,-42,1672,730],[-80,0,485,431],[-81,-6,483,469],
 [-71,-33,522,627],[-67,-55,555,758],[-58,-35,590,644],
 [-35,-7,689,490],[-51,4,595,427],[-62,10,542,405]
]
p=np.array(points,dtype=np.float64)
art=p[:,2:]
geo=p[:,:2]
tri=Delaunay(art)
yy,xx=np.mgrid[0:H,0:W]
samples=np.column_stack((xx.ravel()+.5,yy.ravel()+.5))
simplex=tri.find_simplex(samples)
assert np.all(simplex>=0),'Uncalibrated image area'
xy=np.einsum('ijk,ik->ij',tri.transform[simplex,:2],samples-tri.transform[simplex,2])
weights=np.column_stack((xy,1-xy.sum(axis=1)))
values=np.einsum('ij,ijk->ik',weights,geo[tri.simplices[simplex]])
# A folded calibration can put daytime and location markers on the wrong coast.
for indices in tri.simplices:
 a=art[indices]; g=geo[indices]
 cross=lambda v: np.linalg.det(np.array([v[1]-v[0],v[2]-v[0]]))
 assert cross(a)*cross(g)<0, f'Folded geographic triangle: {indices}'

# Store a compact 1/100-degree coordinate field. Every runtime solar calculation
# reads this field; the location marker uses the exact same triangle mesh.
field=np.rint(values*100).astype('<i2').reshape(H,W,2)
delta=np.diff(field.astype(np.int32),axis=1,prepend=np.zeros((H,1,2),dtype=np.int32)).astype('<i2')
Path('assets/earth/reference-coordinates-v127.bin.gz').write_bytes(gzip.compress(delta.tobytes(),mtime=0))
mesh={'width':W,'height':H,'coordinateOrder':['longitude','latitude'],'scale':100,
      'encoding':'gzip horizontal delta signed little-endian int16 centidegrees; reset at each row',
      'accuracy':'illustrative landmark calibration; not survey-grade',
      'points':points,'triangles':tri.simplices.tolist()}
Path('assets/earth/reference-mesh-v127.json').write_text(json.dumps(mesh,separators=(',',':'))+'\n')
print(json.dumps({'landmarks':len(points),'triangles':len(tri.simplices),'folds':0,'size':[W,H]}))
