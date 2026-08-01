from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare image variants for the Liluo asset manager.")
    parser.add_argument("--input", required=True, help="Source image path")
    parser.add_argument("--output-dir", required=True, help="Directory for generated variants")
    parser.add_argument("--large-width", type=int, default=2400)
    parser.add_argument("--medium-width", type=int, default=1600)
    parser.add_argument("--thumb-width", type=int, default=640)
    parser.add_argument("--quality", type=int, default=88)
    return parser.parse_args()


def normalize_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if "A" in image.getbands():
        return image.convert("RGBA")
    return image.convert("RGB")


def resize_to_width(image: Image.Image, max_width: int) -> Image.Image:
    width, height = image.size
    if width <= max_width:
        return image.copy()
    ratio = max_width / width
    return image.resize((max_width, max(1, round(height * ratio))), Image.Resampling.LANCZOS)


def save_variant(image: Image.Image, output_path: Path, quality: int) -> dict[str, object]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="WEBP", quality=quality, method=6)
    width, height = image.size
    return {
        "path": output_path.as_posix(),
        "width": width,
        "height": height,
        "sizeBytes": output_path.stat().st_size,
        "contentType": "image/webp",
    }


def main() -> None:
    args = parse_args()
    source = Path(args.input).resolve()
    output_dir = Path(args.output_dir).resolve()

    with Image.open(source) as raw:
        image = normalize_image(raw)
        variants = {
            "large": save_variant(resize_to_width(image, args.large_width), output_dir / "large.webp", args.quality),
            "medium": save_variant(resize_to_width(image, args.medium_width), output_dir / "medium.webp", args.quality),
            "thumb": save_variant(resize_to_width(image, args.thumb_width), output_dir / "thumb.webp", args.quality),
        }

    payload = {
        "sourcePath": source.as_posix(),
        "outputDir": output_dir.as_posix(),
        "sourceWidth": image.size[0],
        "sourceHeight": image.size[1],
        "variants": variants,
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
