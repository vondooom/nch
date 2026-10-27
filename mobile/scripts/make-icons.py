"""Generate app icon / splash / favicon from the NorCalHunt website logo.

Recolors the cream-and-ink logo into the app's pre-dawn palette: the cream
paper becomes deep marsh (#0d1410) and the ink becomes mallard amber, so the
mark reads in a dark blind without blasting night vision.

    python3 scripts/make-icons.py ../public/media/c287c898-f222-4e06-ba3e-f9d2131869ad.png
"""
import sys
from PIL import Image, ImageOps

BG = (13, 20, 16)
INK = (224, 159, 62)

src = Image.open(sys.argv[1]).convert("L")
# Ink coverage: 0 on the cream paper, 1 on solid black ink.
ink = ImageOps.autocontrast(ImageOps.invert(src), cutoff=1)
# Drop the paper grain so the background is a flat marsh color, not a box.
ink = ink.point(lambda v: 0 if v < 40 else min(255, int((v - 40) * 255 / 175)))

def colorize(mask, size, pad, transparent):
    inner = int(size * (1 - 2 * pad))
    m = mask.resize((inner, inner), Image.LANCZOS)
    solid = Image.new("RGB", (inner, inner), INK)
    if transparent:
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        tile = Image.new("RGBA", (inner, inner), INK + (0,))
        tile.putalpha(m)
        out.paste(tile, ((size - inner) // 2,) * 2, tile)
        return out
    out = Image.new("RGB", (size, size), BG)
    out.paste(Image.composite(solid, Image.new("RGB", (inner, inner), BG), m), ((size - inner) // 2,) * 2)
    return out

colorize(ink, 1024, 0.02, False).save("assets/icon.png")
colorize(ink, 1024, 0.18, True).save("assets/adaptive-icon.png")
colorize(ink, 1024, 0.04, True).save("assets/splash-icon.png")
colorize(ink, 48, 0.0, False).save("assets/favicon.png")
print("ok")
