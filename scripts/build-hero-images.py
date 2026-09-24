#!/usr/bin/env python3
"""
Prepares cut-out hero portraits for the home page carousel.

Separate from build-catalogue-images.py on purpose: that script pads every photo
out to 2:3 with the backdrop colour it samples from the corners, which is right
for a photograph on a wall and fatal for a cut-out — it would fill the
transparency back in with grey.

Here the padding stays transparent, so the model floats on whatever the hero
section's own background happens to be.

Usage:  python3 scripts/build-hero-images.py <source.png> <out-slug> [more pairs...]
"""

import sys
from pathlib import Path

from PIL import Image

TARGET_W, TARGET_H = 900, 1350
QUALITY = 88
MAX_KB = 260  # Cut-outs carry more detail than a flat-backdrop photo.

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "products"


def build(src: Path, out_name: str) -> dict:
    with Image.open(src) as raw:
        image = raw.convert("RGBA")

    # Crop to the subject. A generated cut-out often carries a band of empty
    # pixels down one side, which would otherwise shrink the model in frame.
    box = image.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if box:
        image = image.crop(box)

    image.thumbnail((TARGET_W, TARGET_H), Image.LANCZOS)

    # Bottom-aligned: these are standing figures, and a carousel of people all
    # standing on the same invisible line reads as one set. Centring vertically
    # makes tall and short crops bob against each other.
    # A small floor gap: flush against the frame reads as "the photo ran out"
    # rather than "she is standing there", and the hero card has no border to
    # explain the difference.
    gap = round(TARGET_H * 0.02)
    if image.height > TARGET_H - gap:
        image.thumbnail((TARGET_W, TARGET_H - gap), Image.LANCZOS)

    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    canvas.paste(image, ((TARGET_W - image.width) // 2, TARGET_H - gap - image.height), image)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    destination = OUT_DIR / f"{out_name}.webp"

    quality = QUALITY
    while True:
        canvas.save(destination, "WEBP", quality=quality, method=6, exact=False)
        kb = round(destination.stat().st_size / 1024)
        if kb <= MAX_KB or quality <= 66:
            break
        quality -= 6

    alpha = canvas.getchannel("A")
    clear = sum(1 for v in alpha.get_flattened_data() if v < 16)

    return {
        "out": destination.name,
        "kb": kb,
        "quality": quality,
        "transparent_pct": round(clear / (TARGET_W * TARGET_H) * 100, 1),
    }


def main() -> int:
    args = sys.argv[1:]
    if len(args) < 2 or len(args) % 2:
        print(__doc__)
        return 2

    for src, name in zip(args[::2], args[1::2]):
        path = Path(src)
        if not path.exists():
            print(f"  MISSING {src}")
            return 1
        r = build(path, name)
        print(f"  {r['out']:<52} {r['kb']:>4} KB  q{r['quality']}  {r['transparent_pct']}% clear")

    return 0


if __name__ == "__main__":
    sys.exit(main())
