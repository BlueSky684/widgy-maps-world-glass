"""Build private, uniquely named local font copies; change only the zero outline.

Inputs are the owner's supplied Phenomena Regular and Bold files. Font binaries
and installation profiles are written outside the repository/public site.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from PIL import Image, ImageDraw, ImageFont
import argparse, hashlib, json, plistlib, uuid

p=argparse.ArgumentParser()
p.add_argument('--regular',required=True);p.add_argument('--bold',required=True)
p.add_argument('--output',required=True)
a=p.parse_args();out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True,mode=0o700)
repo=Path(__file__).resolve().parents[1]
assert not out.is_relative_to(repo)
family='Widgy Plain Zero'
def recorded(f,g):
    pen=RecordingPen();f.getGlyphSet()[g].draw(pen);return pen.value
def bounds(f,g):
    pen=BoundsPen(f.getGlyphSet());f.getGlyphSet()[g].draw(pen);return pen.bounds
def svg(f):
    pen=SVGPathPen(f.getGlyphSet());f.getGlyphSet()['zero'].draw(pen);return pen.getCommands()
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
report={};paths={};profiles=[]
for weight,src in [('Regular',a.regular),('Bold',a.bold)]:
    before=TTFont(src);f=TTFont(src);assert f['name'].getDebugName(6)=='Phenomena-'+weight
    glyph='zero';assert f.getBestCmap()[48]==glyph
    old=recorded(f,glyph);end=next(i for i,(op,args) in enumerate(old) if op=='closePath')
    pen=RecordingPen();pen.value=old[:end+1]
    # Keep the original exterior and stem/cap thickness. Join the two counters
    # across the diagonal; reconstruct the missing halves symmetrically.
    if weight=='Regular':
        pen.moveTo((203,46));pen.curveTo((150,46),(110,88),(110,145))
        pen.lineTo((110,555));pen.curveTo((110,612),(150,654),(203,654))
        pen.curveTo((256,654),(296,612),(296,555));pen.lineTo((296,145))
        pen.curveTo((296,88),(256,46),(203,46));pen.closePath()
    else:
        pen.moveTo((206,72));pen.curveTo((164,72),(133,105),(133,151))
        pen.lineTo((133,549));pen.curveTo((133,595),(164,628),(206,628))
        pen.curveTo((248,628),(279,595),(279,549));pen.lineTo((279,151))
        pen.curveTo((279,105),(248,72),(206,72));pen.closePath()
    top=f['CFF '].cff.topDictIndex[0]
    target=T2CharStringPen(f['hmtx'][glyph][0],f.getGlyphSet());pen.replay(target)
    top.CharStrings[glyph]=target.getCharString(private=top.Private,globalSubrs=f['CFF '].cff.GlobalSubrs)
    ps='WidgyPlainZero-'+weight;full=family+' '+weight
    replacements={1:family,2:weight,3:'1.001;LOCAL;'+ps,4:full,5:'Version 1.001; private plain-zero variant',6:ps,16:family,17:weight}
    for n in f['name'].names:
        if n.nameID in replacements:n.string=replacements[n.nameID].encode(n.getEncoding())
    for name_id in [16,17]:
        f['name'].setName(replacements[name_id],name_id,3,1,0x409)
    f['CFF '].cff.fontNames=[ps];top.FamilyName=family;top.FullName=full;top.version='1.001'
    dest=out/(ps+'.otf');f.save(dest);after=TTFont(dest)
    assert before['hmtx'].metrics==after['hmtx'].metrics
    assert before.getBestCmap()==after.getBestCmap()
    assert before.getGlyphOrder()==after.getGlyphOrder()
    changed=[g for g in before.getGlyphOrder() if recorded(before,g)!=recorded(after,g)]
    assert changed==['zero'],changed
    assert recorded(after,glyph)[:end+1]==old[:end+1]
    assert bounds(before,glyph)==bounds(after,glyph)
    assert sum(op=='closePath' for op,args in recorded(after,glyph))==2
    for tag in before.keys():
        if tag not in ['GlyphOrder','CFF ','name','head']:
            assert before.getTableData(tag)==after.getTableData(tag),tag
    paths[weight]={'before':svg(before),'after':svg(after)}
    report[weight]={'sourceSHA256':sha(src),'sha256':sha(dest),'postScriptName':ps,'changedGlyphs':changed,
      'allAdvanceWidthsAndSideBearingsIdentical':True,'allOtherGlyphOutlinesIdentical':True,
      'zeroOuterContourAndBoundsIdentical':True,'layoutTablesIdentical':True,'glyphCount':len(after.getGlyphOrder())}
    profiles.append({'PayloadType':'com.apple.font','PayloadVersion':1,
      'PayloadIdentifier':'com.israelroth.widgy.plainzero.'+weight.lower(),
      'PayloadUUID':str(uuid.uuid4()).upper(),'PayloadDisplayName':full,
      'Name':dest.name,'Font':dest.read_bytes()})
profile={'PayloadType':'Configuration','PayloadVersion':1,'PayloadIdentifier':'com.israelroth.widgy.plainzero',
 'PayloadUUID':str(uuid.uuid4()).upper(),'PayloadDisplayName':'Widgy Plain Zero Fonts',
 'PayloadDescription':'Installs Widgy Plain Zero Regular and Bold for the matching Widgy widget.',
 'PayloadOrganization':'Israel Roth','PayloadRemovalDisallowed':False,'PayloadContent':profiles}
profile_path=out/'Widgy_Plain_Zero_Fonts.mobileconfig'
profile_path.write_bytes(plistlib.dumps(profile,sort_keys=False))
assert len(plistlib.loads(profile_path.read_bytes())['PayloadContent'])==2
(out/'font-verification.json').write_text(json.dumps(report,indent=2)+'\n')
(out/'zero-paths.json').write_text(json.dumps(paths,indent=2)+'\n')
# Technical typesetting comparison using the actual original and output fonts.
im=Image.new('RGB',(1800,740),'#0b151d');d=ImageDraw.Draw(im)
label=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',30)
d.text((60,36),'ORIGINAL',font=label,fill='#aeb7c6');d.text((940,36),'CLEAN ZERO',font=label,fill='#c5ff0a')
d.line((900,30,900,710),fill='#30434e',width=2)
for row,(weight,src) in enumerate([('Regular',a.regular),('Bold',a.bold)]):
    y=110+row*300
    for col,path in enumerate([src,out/('WidgyPlainZero-'+weight+'.otf')]):
        x=60+880*col;font=ImageFont.truetype(str(path),110)
        d.text((x,y),weight,font=label,fill='#8596a2')
        d.text((x,y+40),'20°C   00:00   0%',font=font,fill='#f4f7fa')
        d.text((x,y+165),'10,000   2026',font=font,fill='#f4f7fa')
im.save(out/'Widgy_Plain_Zero_Comparison.png')
print(json.dumps(report))
