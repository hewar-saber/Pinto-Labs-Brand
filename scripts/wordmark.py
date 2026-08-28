"""Outline 'Pinto Labs' in Crimson Pro @ wght 800 to a single SVG path."""
import sys, io
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
import uharfbuzz as hb

SRC = "public/Fonts/Crimson Pro/CrimsonPro-VF.ttf"
TEXT = "Pinto Labs"
WGHT = 800
SIZE = 100.0   # em size for the outline; we normalise later

f = TTFont(SRC)
f.flavor = None
inst = instancer.instantiateVariableFont(f, {"wght": WGHT}, inplace=False, updateFontNames=False)
buf = io.BytesIO(); inst.save(buf); data = buf.getvalue()

face = hb.Face(data); font = hb.Font(face)
upem = face.upem
font.scale = (upem, upem)
hb.ot_font_set_funcs(font)
b = hb.Buffer(); b.add_str(TEXT); b.guess_segment_properties()
hb.shape(font, b, {"kern": True, "liga": True})

gs = inst.getGlyphSet()
order = inst.getGlyphOrder()
scale = SIZE / upem
pen_out = []
x = 0.0
for info, pos in zip(b.glyph_infos, b.glyph_positions):
    gname = order[info.codepoint]
    sp = SVGPathPen(gs)
    # y-flip: font units up -> SVG down
    t = Transform(scale, 0, 0, -scale, (x + pos.x_offset) * scale, -(pos.y_offset) * scale)
    tp = TransformPen(sp, t)
    gs[gname].draw(tp)
    d = sp.getCommands()
    if d: pen_out.append(d)
    x += pos.x_advance

path = " ".join(pen_out)

# measure bbox
from fontTools.pens.boundsPen import BoundsPen
from fontTools.svgLib.path import parse_path
from fontTools.pens.recordingPen import RecordingPen
rec = RecordingPen()
parse_path(path, rec)
bp = BoundsPen(None)
rec.replay(bp)
x0, y0, x1, y1 = bp.bounds
print("BBOX", x0, y0, x1, y1, "W", x1-x0, "H", y1-y0)
open(sys.argv[1], "w").write(path)
open(sys.argv[1] + ".bbox", "w").write(f"{x0} {y0} {x1} {y1}")
