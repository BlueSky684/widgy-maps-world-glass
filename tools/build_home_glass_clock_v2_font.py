"""Build the user-approved Home Glass Time font from original Barlow 1.422.

This does not publish a widget or change R8. Requires fonttools and Pillow.
"""
from pathlib import Path
from hashlib import sha256
import json

from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets/fonts/home-glass-clock"
SOURCE = ASSETS / "BarlowCondensed-Light.otf"
OUTPUT = ASSETS / "HomeGlassTime-Light.otf"
SHIFT = 112  # Approved preview V2: 14 units below the initial +126 proposal.


def build():
    assert sha256(SOURCE.read_bytes()).hexdigest() == "0dd27baa26aeca7bcf194fd32f4aafccb1779a499e5d1ec478923ff6685090e9"
    original = TTFont(SOURCE, recalcTimestamp=False)
    font = TTFont(SOURCE, recalcTimestamp=False)
    assert font["head"].unitsPerEm == 1000
    cff = font["CFF "].cff
    top = cff.topDictIndex[0]
    colon = top.CharStrings["colon"]
    colon.decompile()
    assert colon.program[:12] == [
        -175, 5, 100, 238, 100, 'hstem', 47, 101, 'vstem', 98, 343, 'rmoveto'
    ]
    # Translate both horizontal hints and the initial contour origin.
    # All relative curve commands, widths and subroutines stay identical.
    colon.program[1] += SHIFT
    colon.program[10] += SHIFT
    cff.fontNames = ["HomeGlassTime-Light"]
    top.FullName = "Home Glass Time Light"
    top.FamilyName = "Home Glass Time"
    top.version = "001.422.2"
    renamed = {
        1: "Home Glass Time Light", 2: "Regular",
        3: "1.422.2;HomeGlass;HomeGlassTime-Light",
        4: "Home Glass Time Light", 5: "Version 1.422.2",
        6: "HomeGlassTime-Light", 16: "Home Glass Time", 17: "Light",
    }
    for record in font["name"].names:
        if record.nameID in renamed:
            record.string = renamed[record.nameID].encode(record.getEncoding())
    description = ("Modified from user-supplied Barlow Condensed Light 1.422 under SIL OFL 1.1. "
                   "Only the colon is raised 112 font units, with matching hint offsets. "
                   "Numerals, spacing and all other outlines are unchanged.")
    for platform, encoding, language in ((3, 1, 0x409), (1, 0, 0)):
        font["name"].setName(description, 10, platform, encoding, language)
    if "DSIG" in font:
        del font["DSIG"]
    font.save(OUTPUT)

    saved = TTFont(OUTPUT, recalcTimestamp=False)
    assert saved.getGlyphOrder() == original.getGlyphOrder()
    old_cs = original["CFF "].cff.topDictIndex[0].CharStrings
    new_cs = saved["CFF "].cff.topDictIndex[0].CharStrings
    changed = []
    for name in original.getGlyphOrder():
        old_cs[name].decompile()
        new_cs[name].decompile()
        if old_cs[name].program != new_cs[name].program:
            changed.append(name)
    assert changed == ["colon"], changed
    for table in ("hmtx", "hhea", "OS/2", "cmap", "GPOS", "GSUB"):
        assert original[table].compile(original) == saved[table].compile(saved), table
    # Compare every actual outline, including any subroutine references.
    old_glyphs, new_glyphs = original.getGlyphSet(), saved.getGlyphSet()
    for name in original.getGlyphOrder():
        before, after = RecordingPen(), RecordingPen()
        pen = TransformPen(before, (1, 0, 0, 1, 0, SHIFT)) if name == "colon" else before
        old_glyphs[name].draw(pen)
        new_glyphs[name].draw(after)
        assert before.value == after.value, name

    # Exhaust all 1,440 HH:mm strings: every advance width is identical.
    a = ImageFont.truetype(str(SOURCE), 120)
    b = ImageFont.truetype(str(OUTPUT), 120)
    for hour in range(24):
        for minute in range(60):
            value = f"{hour:02}:{minute:02}"
            assert a.getlength(value) == b.getlength(value), value

    report = {
        "status": "user-approved preview V2; font geometry verified; iPhone installation pending",
        "approved_colon_rise": 112,
        "preview_reference": "Clock_Colon_Position_Preview_V2.png / lower panel",
        "source": "user-uploaded BarlowCondensed-Light(1).otf, version 1.422",
        "source_url": "https://raw.githubusercontent.com/jpt/barlow/1.422/fonts/otf/BarlowCondensed-Light.otf",
        "source_sha256": sha256(SOURCE.read_bytes()).hexdigest(),
        "output_sha256": sha256(OUTPUT.read_bytes()).hexdigest(),
        "postscript_name": "HomeGlassTime-Light",
        "changed_glyphs": changed, "vertical_shift_font_units": SHIFT,
        "colon_center_before": 224, "colon_center_after": 336,
        "all_1440_time_widths_unchanged": True,
        "zero_outline_unchanged": True,
    }
    (ASSETS / "validation-v2.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))



if __name__ == "__main__":
    build()
