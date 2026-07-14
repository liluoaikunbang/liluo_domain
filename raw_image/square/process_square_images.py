from pathlib import Path

from PIL import Image


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"}


def get_fill_color(image: Image.Image):
    if image.mode in {"RGBA", "LA"} or "transparency" in image.info:
        return (0, 0, 0, 0)
    if image.mode == "CMYK":
        return (0, 0, 0, 0)
    if image.mode == "L":
        return 255
    if image.mode == "P":
        return 0
    return tuple(255 for _ in image.getbands())


def square_image(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as image:
        image.load()
        side_length = max(image.width, image.height)
        square = Image.new(image.mode, (side_length, side_length), get_fill_color(image))
        x = (side_length - image.width) // 2
        y = (side_length - image.height) // 2
        square.paste(image, (x, y))
        square.save(output_path)


def main() -> None:
    raw_dir = Path(__file__).resolve().parent
    output_dir = raw_dir / "processed"
    output_dir.mkdir(exist_ok=True)

    processed_count = 0
    for source_path in sorted(raw_dir.iterdir()):
        if not source_path.is_file():
            continue
        if source_path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue

        output_path = output_dir / source_path.name
        square_image(source_path, output_path)
        processed_count += 1
        print(f"processed: {source_path.name} -> processed\\{output_path.name}")

    print(f"done: {processed_count} image(s) processed")


if __name__ == "__main__":
    main()
