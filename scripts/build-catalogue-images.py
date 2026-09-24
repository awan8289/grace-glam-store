#!/usr/bin/env python3
"""
Turns the supplied product photography into the storefront's image format.

Reads a manifest of {src, out} pairs and writes 900x1350 WebP files into
public/products/. The 2:3 portrait shape is not arbitrary — every consumer on
the site (`ShopBrowser`, `ProductDetailPage`, `HeroSection`) places images in a
fixed-height box with `object-contain`, so nothing crops, but a photo with a
different ratio renders visibly smaller than its neighbours in the same row.

Usage:  python3 scripts/build-catalogue-images.py <manifest.json> [--check]

manifest.json: [{"src": "/abs/path/to/source.PNG", "out": "jersey-hijab-berry-red"}]
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageOps

TARGET_W, TARGET_H = 900, 1350
QUALITY = 82
# Anything above this is a sign the trim or the source is wrong, not a photo
# worth shipping — the whole point of the exercise is fast pages.
MAX_KB = 200

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "products"


def border_colour(image: Image.Image) -> tuple[int, int, int]:
    """The average of the four corners — the backdrop the photo was shot on."""
    w, h = image.size
    corners = [
        image.getpixel((0, 0)),
        image.getpixel((w - 1, 0)),
        image.getpixel((0, h - 1)),
        image.getpixel((w - 1, h - 1)),
    ]
    return tuple(sum(c[i] for c in corners) // 4 for i in range(3))


def trim(image: Image.Image, backdrop: tuple[int, int, int]) -> Image.Image:
    """
    Crops away uniform backdrop around the subject.

    Left deliberately conservative: a 12px margin is kept so the garment never
    touches the frame edge, and a trim that would remove more than 90% of the
    frame is discarded as a misfire rather than trusted.
    """
    reference = Image.new("RGB", image.size, backdrop)
    diff = ImageChops.difference(image, reference).convert("L")
    box = diff.point(lambda p: 255 if p > 18 else 0).getbbox()
    if not box:
        return image

    area = (box[2] - box[0]) * (box[3] - box[1])
    if area < 0.10 * image.width * image.height:
        return image

    pad = 12
    return image.crop((
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(image.width, box[2] + pad),
        min(image.height, box[3] + pad),
    ))


def convert(src: Path, out_name: str) -> dict:
    with Image.open(src) as raw:
        # Phone photos carry rotation in EXIF; without this half the catalogue
        # would ship sideways.
        image = ImageOps.exif_transpose(raw).convert("RGB")

    backdrop = border_colour(image)
    image = trim(image, backdrop)

    # Fit inside the target, then pad out to exactly 2:3 with the backdrop
    # colour so the padding is invisible against the photo's own background.
    image.thumbnail((TARGET_W, TARGET_H), Image.LANCZOS)
    canvas = Image.new("RGB", (TARGET_W, TARGET_H), backdrop)
    canvas.paste(image, ((TARGET_W - image.width) // 2, (TARGET_H - image.height) // 2))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    destination = OUT_DIR / f"{out_name}.webp"

    # Busy weaves (twill, dense print) carry far more detail than a flat colour
    # and blow past the budget at the default quality. Step down until the file
    # fits rather than shipping one 280 KB image among a hundred 80 KB ones.
    quality = QUALITY
    while True:
        canvas.save(destination, "WEBP", quality=quality, method=6)
        kb = round(destination.stat().st_size / 1024)
        if kb <= MAX_KB or quality <= 62:
            break
        quality -= 6

    return {"out": destination.name, "kb": kb, "quality": quality,
            "backdrop": "#%02x%02x%02x" % backdrop}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    manifest = json.loads(Path(sys.argv[1]).read_text())
    check_only = "--check" in sys.argv

    written, oversized, missing = [], [], []

    for entry in manifest:
        src = Path(entry["src"])
        if not src.exists():
            missing.append(entry["src"])
            continue
        if check_only:
            continue

        result = convert(src, entry["out"])
        written.append(result)
        if result["kb"] > MAX_KB:
            oversized.append(result)

    print(f"written:  {len(written)}")
    print(f"missing:  {len(missing)}")
    for m in missing:
        print(f"  MISSING {m}")

    if written:
        sizes = sorted(r["kb"] for r in written)
        print(f"size KB:  min {sizes[0]}  median {sizes[len(sizes) // 2]}  max {sizes[-1]}")
    for o in oversized:
        print(f"  OVERSIZE {o['out']} {o['kb']} KB (limit {MAX_KB})")

    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
