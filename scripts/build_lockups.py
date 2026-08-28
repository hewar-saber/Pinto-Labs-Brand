#!/usr/bin/env python3
"""Generate the Pinto Labs logo lockups as tight-cropped ("Normal") and
clear-space ("Padded") SVGs, one per colourway (red / white / black).

Geometry is taken from the live site (src/components/logo-lockup.tsx):
  - bean logomark: public/marks/bean.svg, portrait 33.5097 x 65.664, rendered
    rotated 90deg -> landscape 65.664 x 33.5097
  - wordmark: "Pinto Labs", Crimson Pro ExtraBold (wght 800), 28px, gap 20px
"""
import json, os, sys

OUT = sys.argv[1]

BEAN_D = ("M15.0777 65.664C20.5079 65.664 23.492 63.3146 27.0459 58.464C31.4584 52.4416 "
          "33.5097 42.8754 33.5097 32.832C33.5097 25.6297 33.257 20.6971 30.0413 13.5561C26.0353 "
          "5.34127 22.4152 0 15.0777 0L15.0385 5.06276e-05C7.42921 0.019745 2.89037 4.32 0.806035 "
          "12.8083C-1.06992 20.448 3.24467 25.6848 1.82967 35.712C0.0820783 48.096 -0.394205 "
          "50.9139 0.317711 55.296C2.38609 62.496 6.66617 65.6423 15.0385 65.6639L15.0777 65.664Z")

BEAN_W, BEAN_H = 65.664, 33.5097          # landscape
WORD_PATH = open(os.path.join(os.path.dirname(OUT), "wordmark.path")).read()
wx0, wy0, wx1, wy1 = [float(v) for v in
    open(os.path.join(os.path.dirname(OUT), "wordmark.path.bbox")).read().split()]

FONT_PX = 28.0
S = FONT_PX / 100.0                        # wordmark.path was built at em=100
WORD_W = (wx1 - wx0) * S
WORD_H = (wy1 - wy0) * S
GAP = 20.0                                 # Tailwind gap-5 in the site lockup

# Approved treatments, in the order they are approved:
#   red on white, white on red, black on white.
# The exported artwork is the colourway alone, on transparency; the ground is
# a usage rule, not part of the file.
COLORS = {
    "red":   "#FF4016",
    "white": "#FFFFFF",
    "black": "#000000",
}

def bean(x, y, scale=1.0, fill="#FF4016"):
    """Landscape bean with its top-left at (x, y)."""
    return (f'<g transform="translate({x:.4f} {y:.4f}) scale({scale:.6f}) '
            f'translate({BEAN_W:.4f} 0) rotate(90)">'
            f'<path d="{BEAN_D}" fill="{fill}"/></g>')

def word(x, y, fill="#FF4016"):
    """Wordmark with its glyph bounding box top-left at (x, y)."""
    return (f'<g transform="translate({x - wx0*S:.4f} {y - wy0*S:.4f}) scale({S:.6f})">'
            f'<path d="{WORD_PATH}" fill="{fill}"/></g>')

def svg(w, h, body):
    return (f'<svg width="{round(w)}" height="{round(h)}" viewBox="0 0 {w:.4f} {h:.4f}" '
            f'fill="none" xmlns="http://www.w3.org/2000/svg">\n{body}\n</svg>\n')

# ---------------------------------------------------------------- variants
# Each variant returns (art_w, art_h, body(fill), unit_w, unit_h) where
# unit_w/unit_h are the clear-space unit = the brand symbol at this lockup's
# scale. Clear space = half the unit on each axis.
def v_symbol():
    return BEAN_W, BEAN_H, (lambda f: bean(0, 0, 1.0, f)), BEAN_W, BEAN_H

def v_primary():
    aw = BEAN_W + GAP + WORD_W
    ah = max(BEAN_H, WORD_H)
    def body(f):
        by = (ah - BEAN_H) / 2
        wy = (ah - WORD_H) / 2
        return bean(0, by, 1.0, f) + word(BEAN_W + GAP, wy, f)
    return aw, ah, body, BEAN_W, BEAN_H

def v_center():
    gap = BEAN_H / 2                       # stacked gap = half the symbol height
    aw = max(BEAN_W, WORD_W)
    ah = BEAN_H + gap + WORD_H
    def body(f):
        return (bean((aw - BEAN_W) / 2, 0, 1.0, f)
                + word((aw - WORD_W) / 2, BEAN_H + gap, f))
    return aw, ah, body, BEAN_W, BEAN_H

def v_wordmark():
    # No symbol present: the clear-space unit is the symbol scaled so its
    # height matches the wordmark's own height.
    k = WORD_H / BEAN_H
    return WORD_W, WORD_H, (lambda f: word(0, 0, f)), BEAN_W * k, BEAN_H * k

VARIANTS = {
    "Primary Logo": v_primary,
    "Brand Symbol": v_symbol,
    "Wordmark":     v_wordmark,
    "Center":       v_center,
}

manifest = []
for vname, vfn in VARIANTS.items():
    aw, ah, body, uw, uh = vfn()
    for color, hexv in COLORS.items():
        # --- Normal: tight crop, viewBox == artwork bounding box
        normal = svg(aw, ah, body(hexv))
        # --- Padded: clear space = half the unit on each axis
        px, py = uw / 2, uh / 2
        pw, ph = aw + 2 * px, ah + 2 * py
        padded = svg(pw, ph, f'<g transform="translate({px:.4f} {py:.4f})">{body(hexv)}</g>')
        manifest.append({
            "variant": vname, "color": color, "hex": hexv,
            "art_w": aw, "art_h": ah, "pad_x": px, "pad_y": py,
            "padded_w": pw, "padded_h": ph,
            "normal": normal, "padded": padded,
        })

json.dump(manifest, open(OUT, "w"))
print(f"variants={len(VARIANTS)} colors={len(COLORS)} entries={len(manifest)}")
for vname, vfn in VARIANTS.items():
    aw, ah, _, uw, uh = vfn()
    print(f"  {vname:<14} art {aw:8.3f} x {ah:7.3f}   clear-space {uw/2:6.3f} / {uh/2:6.3f}"
          f"   padded {aw+uw:8.3f} x {ah+uh:7.3f}   ratio W {(aw+uw)/aw:.4f} H {(ah+uh)/ah:.4f}")
