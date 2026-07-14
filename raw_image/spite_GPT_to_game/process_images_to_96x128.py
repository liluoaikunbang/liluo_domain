from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Iterable

from PIL import Image, ImageChops


TARGET_SIZE = (96, 128)
DEFAULT_COLUMNS = 3
DEFAULT_ROWS = 4
SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
DEFAULT_REFERENCE_SPRITE = (
    Path(__file__).resolve().parents[2]
    / "src"
    / "assets"
    / "game"
    / "sprite"
    / "liluo_walk_source.png"
)


@dataclass(frozen=True)
class ReferenceGrid:
    bboxes: list[list[tuple[int, int, int, int]]]
    frame_size: tuple[int, int]
    columns: int
    rows: int


@dataclass(frozen=True)
class ContentFrame:
    image: Image.Image
    bbox: tuple[int, int, int, int]


@dataclass(frozen=True)
class GridBounds:
    columns: list[tuple[int, int]]
    rows: list[tuple[int, int]]


def iter_image_paths(input_dir: Path, output_dir: Path) -> Iterable[Path]:
    for path in sorted(input_dir.iterdir()):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            if output_dir not in path.parents:
                yield path


def get_alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    if image.mode in ("RGBA", "LA"):
        return image.getchannel("A").getbbox()

    if image.mode == "P" and "transparency" in image.info:
        return image.convert("RGBA").getchannel("A").getbbox()

    return None


def is_full_image_bbox(
    image: Image.Image,
    bbox: tuple[int, int, int, int] | None,
) -> bool:
    return bbox == (0, 0, image.width, image.height)


def color_distance_sq(left: tuple[int, int, int], right: tuple[int, int, int]) -> int:
    return sum((left[index] - right[index]) ** 2 for index in range(3))


def flood_fill_background_mask(
    image: Image.Image,
    tolerance: int,
) -> Image.Image:
    rgb_image = image.convert("RGB")
    width, height = rgb_image.size
    pixels = rgb_image.load()

    corners = [
        pixels[0, 0],
        pixels[width - 1, 0],
        pixels[0, height - 1],
        pixels[width - 1, height - 1],
    ]
    background = tuple(round(sum(color[index] for color in corners) / 4) for index in range(3))
    tolerance_sq = tolerance * tolerance * 3

    mask = Image.new("L", rgb_image.size, 0)
    mask_pixels = mask.load()
    stack = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= width or y >= height or mask_pixels[x, y]:
            continue

        if color_distance_sq(pixels[x, y], background) > tolerance_sq:
            continue

        mask_pixels[x, y] = 255
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return mask


def get_border_background_bbox(
    image: Image.Image,
    tolerance: int,
) -> tuple[int, int, int, int] | None:
    background_mask = flood_fill_background_mask(image, tolerance)
    content_mask = ImageChops.invert(background_mask)
    return content_mask.getbbox()


def get_content_mask(
    image: Image.Image,
    trim_mode: str,
    tolerance: int,
) -> Image.Image | None:
    mask = None

    if trim_mode in ("auto", "alpha"):
        if image.mode in ("RGBA", "LA"):
            mask = image.getchannel("A")
        elif image.mode == "P" and "transparency" in image.info:
            mask = image.convert("RGBA").getchannel("A")

        if mask is not None and trim_mode == "auto" and is_full_image_bbox(image, mask.getbbox()):
            mask = None

    if mask is None and trim_mode in ("auto", "border"):
        background_mask = flood_fill_background_mask(image, tolerance)
        mask = ImageChops.invert(background_mask)

    return mask


def get_content_bbox(
    image: Image.Image,
    trim_mode: str,
    tolerance: int,
) -> tuple[int, int, int, int] | None:
    mask = get_content_mask(image, trim_mode, tolerance)
    if mask is None:
        return None

    return mask.getbbox()


def extract_content_frame(
    image: Image.Image,
    trim_mode: str,
    tolerance: int,
) -> ContentFrame | None:
    image = image.convert("RGBA")
    mask = get_content_mask(image, trim_mode, tolerance)

    if mask is None:
        mask = Image.new("L", image.size, 255)

    bbox = mask.getbbox()
    if bbox is None:
        return None

    content = image.crop(bbox)
    return ContentFrame(image=content, bbox=bbox)


def clear_fully_transparent_rgb(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (red, green, blue, alpha)
    return image


def trim_empty_pixels(
    image: Image.Image,
    trim_mode: str,
    tolerance: int,
) -> Image.Image:
    content = extract_content_frame(image, trim_mode, tolerance)

    if content is None:
        return image

    return clear_fully_transparent_rgb(content.image)


def resize_to_canvas(
    image: Image.Image,
    target_size: tuple[int, int],
) -> Image.Image:
    image = clear_fully_transparent_rgb(image)
    image.thumbnail(target_size, Image.Resampling.LANCZOS)
    image = clear_fully_transparent_rgb(image)

    canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    left = (target_size[0] - image.width) // 2
    top = (target_size[1] - image.height) // 2
    canvas.paste(image, (left, top), image)
    return canvas


def scale_bbox(
    bbox: tuple[int, int, int, int],
    from_size: tuple[int, int],
    to_size: tuple[int, int],
) -> tuple[int, int, int, int]:
    x_scale = to_size[0] / from_size[0]
    y_scale = to_size[1] / from_size[1]
    return (
        round(bbox[0] * x_scale),
        round(bbox[1] * y_scale),
        round(bbox[2] * x_scale),
        round(bbox[3] * y_scale),
    )


def load_reference_grid(
    reference_path: Path,
    target_frame_size: tuple[int, int],
    trim_mode: str,
    tolerance: int,
) -> ReferenceGrid | None:
    if not reference_path.exists():
        print(f"Reference sprite not found, using normal centering: {reference_path}")
        return None

    with Image.open(reference_path) as reference_image:
        reference_image = reference_image.convert("RGBA")
        reference_columns = DEFAULT_COLUMNS
        reference_rows = DEFAULT_ROWS

        if (
            reference_image.width % reference_columns != 0
            or reference_image.height % reference_rows != 0
        ):
            print(f"Reference sprite is not a {reference_columns}x{reference_rows} grid, using normal centering: {reference_path}")
            return None

        bboxes: list[list[tuple[int, int, int, int]]] = []
        reference_frame_size = (
            reference_image.width // reference_columns,
            reference_image.height // reference_rows,
        )

        for row in range(reference_rows):
            row_bboxes: list[tuple[int, int, int, int]] = []
            for column in range(reference_columns):
                frame = crop_grid_cell(
                    reference_image,
                    column=column,
                    row=row,
                    columns=reference_columns,
                    rows=reference_rows,
                )
                bbox = get_content_bbox(frame, trim_mode, tolerance)
                if bbox is None:
                    bbox = (0, 0, reference_frame_size[0], reference_frame_size[1])
                row_bboxes.append(scale_bbox(bbox, reference_frame_size, target_frame_size))
            bboxes.append(row_bboxes)

    return ReferenceGrid(
        bboxes=bboxes,
        frame_size=target_frame_size,
        columns=reference_columns,
        rows=reference_rows,
    )


def pick_reference_bbox(
    reference_grid: ReferenceGrid,
    column: int,
    row: int,
    columns: int,
    rows: int,
) -> tuple[int, int, int, int]:
    if columns <= 1:
        reference_column = reference_grid.columns // 2
    else:
        reference_column = round(column * (reference_grid.columns - 1) / (columns - 1))

    if rows <= 1:
        reference_row = reference_grid.rows // 2
    else:
        reference_row = round(row * (reference_grid.rows - 1) / (rows - 1))

    return reference_grid.bboxes[reference_row][reference_column]


def get_reference_profile(reference_grid: ReferenceGrid) -> tuple[float, float, float]:
    bboxes = [bbox for row in reference_grid.bboxes for bbox in row]
    target_height = median(bbox[3] - bbox[1] for bbox in bboxes)
    target_width = max(bbox[2] - bbox[0] for bbox in bboxes)
    target_center_x = median((bbox[0] + bbox[2]) / 2 for bbox in bboxes)
    return target_height, target_width, target_center_x


def calculate_sheet_scale(
    content_frames: list[ContentFrame | None],
    reference_grid: ReferenceGrid,
    frame_size: tuple[int, int],
) -> float:
    frames = [frame for frame in content_frames if frame is not None]
    if not frames:
        return 1.0

    target_height, target_width, _ = get_reference_profile(reference_grid)
    source_heights = [frame.image.height for frame in frames]
    source_widths = [frame.image.width for frame in frames]

    height_scale = target_height / max(1, median(source_heights))
    width_scale = target_width / max(1, max(source_widths))
    frame_height_scale = frame_size[1] / max(1, max(source_heights))
    frame_width_scale = frame_size[0] / max(1, max(source_widths))

    return min(height_scale, width_scale, frame_height_scale, frame_width_scale)


def resize_to_reference_frame(
    content_frame: ContentFrame | None,
    frame_size: tuple[int, int],
    reference_bbox: tuple[int, int, int, int],
    reference_center_x: float,
    scale: float,
) -> Image.Image:
    if content_frame is None:
        return Image.new("RGBA", frame_size, (0, 0, 0, 0))

    content = content_frame.image
    resized_size = (
        max(1, min(frame_size[0], round(content.width * scale))),
        max(1, min(frame_size[1], round(content.height * scale))),
    )
    resized = content.resize(resized_size, Image.Resampling.LANCZOS)
    resized = clear_fully_transparent_rgb(resized)

    canvas = Image.new("RGBA", frame_size, (0, 0, 0, 0))
    left = round(reference_center_x - resized.width / 2)
    top = reference_bbox[3] - resized.height
    left = max(0, min(frame_size[0] - resized.width, left))
    top = max(0, min(frame_size[1] - resized.height, top))
    canvas.paste(resized, (left, top), resized)
    return canvas


def crop_grid_cell(
    image: Image.Image,
    column: int,
    row: int,
    columns: int,
    rows: int,
    grid_bounds: GridBounds | None = None,
) -> Image.Image:
    if grid_bounds is not None:
        left, right = grid_bounds.columns[column]
        top, bottom = grid_bounds.rows[row]
        return image.crop((left, top, right, bottom))

    width, height = image.size
    left = round(width * column / columns)
    top = round(height * row / rows)
    right = round(width * (column + 1) / columns)
    bottom = round(height * (row + 1) / rows)
    return image.crop((left, top, right, bottom))


def detect_axis_content_runs(
    mask: Image.Image,
    axis: str,
    expected_count: int,
) -> list[tuple[int, int]] | None:
    width, height = mask.size
    axis_size = width if axis == "x" else height
    cross_size = height if axis == "x" else width
    threshold = max(1, round(cross_size * 0.01))
    min_run_length = max(2, round(axis_size / expected_count * 0.08))

    values: list[int] = []
    for index in range(axis_size):
        if axis == "x":
            line = mask.crop((index, 0, index + 1, height))
        else:
            line = mask.crop((0, index, width, index + 1))
        values.append(sum(1 for value in line.getdata() if value))

    runs: list[tuple[int, int]] = []
    run_start: int | None = None
    for index, value in enumerate(values):
        has_content = value >= threshold
        if has_content and run_start is None:
            run_start = index
        if run_start is not None and (not has_content or index == axis_size - 1):
            run_end = index if not has_content else index + 1
            if run_end - run_start >= min_run_length:
                runs.append((run_start, run_end))
            run_start = None

    if len(runs) != expected_count:
        return None

    return runs


def runs_to_cell_bounds(
    runs: list[tuple[int, int]],
    full_size: int,
) -> list[tuple[int, int]]:
    centers = [(start + end) / 2 for start, end in runs]
    dividers = [round((centers[index] + centers[index + 1]) / 2) for index in range(len(centers) - 1)]
    starts = [0, *dividers]
    ends = [*dividers, full_size]
    return [(starts[index], ends[index]) for index in range(len(runs))]


def detect_grid_bounds(
    image: Image.Image,
    columns: int,
    rows: int,
    trim_mode: str,
    tolerance: int,
) -> GridBounds | None:
    mask = get_content_mask(image, trim_mode, tolerance)
    if mask is None:
        return None

    column_runs = detect_axis_content_runs(mask, "x", columns)
    row_runs = detect_axis_content_runs(mask, "y", rows)
    if column_runs is None or row_runs is None:
        return None

    return GridBounds(
        columns=runs_to_cell_bounds(column_runs, image.width),
        rows=runs_to_cell_bounds(row_runs, image.height),
    )


def resize_sprite_sheet_to_grid(
    image: Image.Image,
    target_size: tuple[int, int],
    columns: int,
    rows: int,
    trim_mode: str,
    tolerance: int,
    reference_grid: ReferenceGrid | None,
) -> Image.Image:
    frame_size = (target_size[0] // columns, target_size[1] // rows)
    sheet = Image.new("RGBA", target_size, (0, 0, 0, 0))
    grid_bounds = detect_grid_bounds(image, columns, rows, trim_mode, tolerance)
    source_frames = [
        crop_grid_cell(image, column, row, columns, rows, grid_bounds)
        for row in range(rows)
        for column in range(columns)
    ]
    content_frames = [
        extract_content_frame(source_frame, trim_mode, tolerance)
        for source_frame in source_frames
    ]
    scale = (
        calculate_sheet_scale(content_frames, reference_grid, frame_size)
        if reference_grid is not None
        else 1.0
    )
    reference_center_x = (
        get_reference_profile(reference_grid)[2]
        if reference_grid is not None
        else frame_size[0] / 2
    )

    for row in range(rows):
        for column in range(columns):
            index = row * columns + column
            if reference_grid is None:
                trimmed_frame = (
                    content_frames[index].image
                    if content_frames[index] is not None
                    else Image.new("RGBA", frame_size, (0, 0, 0, 0))
                )
                resized_frame = resize_to_canvas(trimmed_frame, frame_size)
            else:
                resized_frame = resize_to_reference_frame(
                    content_frame=content_frames[index],
                    frame_size=frame_size,
                    reference_bbox=pick_reference_bbox(
                        reference_grid=reference_grid,
                        column=column,
                        row=row,
                        columns=columns,
                        rows=rows,
                    ),
                    reference_center_x=reference_center_x,
                    scale=scale,
                )
            sheet.alpha_composite(
                resized_frame,
                (column * frame_size[0], row * frame_size[1]),
            )

    return sheet


def process_image(
    source_path: Path,
    output_dir: Path,
    target_size: tuple[int, int],
    trim_mode: str,
    tolerance: int,
    columns: int,
    rows: int,
    whole_image: bool,
    reference_grid: ReferenceGrid | None,
) -> Path:
    with Image.open(source_path) as image:
        if whole_image:
            trimmed = trim_empty_pixels(image, trim_mode, tolerance)
            resized = resize_to_canvas(trimmed, target_size)
        else:
            resized = resize_sprite_sheet_to_grid(
                image=image,
                target_size=target_size,
                columns=columns,
                rows=rows,
                trim_mode=trim_mode,
                tolerance=tolerance,
                reference_grid=reference_grid,
            )

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{source_path.stem}_{target_size[0]}x{target_size[1]}.png"
    resized = clear_fully_transparent_rgb(resized)
    resized.save(output_path)
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Trim every grid frame, normalize character size against liluo_walk_source, "
            "and write 96x128 transparent sprite sheets to processed."
        )
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path(__file__).resolve().parent,
        help="Folder containing source images. Defaults to this script folder.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Output folder. Defaults to <input-dir>/processed.",
    )
    parser.add_argument("--width", type=int, default=TARGET_SIZE[0])
    parser.add_argument("--height", type=int, default=TARGET_SIZE[1])
    parser.add_argument(
        "--columns",
        type=int,
        default=DEFAULT_COLUMNS,
        help="Number of sprite columns in the source sheet. Default: 3.",
    )
    parser.add_argument(
        "--rows",
        type=int,
        default=DEFAULT_ROWS,
        help="Number of sprite rows in the source sheet. Default: 4.",
    )
    parser.add_argument(
        "--whole-image",
        action="store_true",
        help="Process the whole image as one picture instead of centering each grid frame.",
    )
    parser.add_argument(
        "--reference-sprite",
        type=Path,
        default=DEFAULT_REFERENCE_SPRITE,
        help=(
            "Sprite sheet used as the per-frame character size reference. "
            "Defaults to src/assets/game/sprite/liluo_walk_source.png."
        ),
    )
    parser.add_argument(
        "--no-reference-normalize",
        action="store_true",
        help="Disable reference-based per-frame sizing and use the old centered fit.",
    )
    parser.add_argument(
        "--trim-mode",
        choices=("auto", "alpha", "border", "none"),
        default="auto",
        help=(
            "auto: use alpha when present, otherwise remove connected border background; "
            "alpha: trim transparent pixels only; border: trim connected corner-colored background; "
            "none: only resize and pad."
        ),
    )
    parser.add_argument(
        "--tolerance",
        type=int,
        default=8,
        help="Color tolerance for border trimming. Lower is safer. Default: 8.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_dir = args.input_dir.resolve()
    output_dir = (args.output_dir or input_dir / "processed").resolve()
    target_size = (args.width, args.height)

    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    if args.width % args.columns != 0 or args.height % args.rows != 0:
        raise SystemExit("Target width/height must be divisible by columns/rows.")

    frame_size = (args.width // args.columns, args.height // args.rows)
    reference_grid = None
    if not args.whole_image and not args.no_reference_normalize:
        reference_grid = load_reference_grid(
            reference_path=args.reference_sprite.resolve(),
            target_frame_size=frame_size,
            trim_mode=args.trim_mode,
            tolerance=args.tolerance,
        )

    processed_count = 0
    for source_path in iter_image_paths(input_dir, output_dir):
        output_path = process_image(
            source_path=source_path,
            output_dir=output_dir,
            target_size=target_size,
            trim_mode=args.trim_mode,
            tolerance=args.tolerance,
            columns=args.columns,
            rows=args.rows,
            whole_image=args.whole_image,
            reference_grid=reference_grid,
        )
        processed_count += 1
        print(f"Processed: {source_path.name} -> {output_path.relative_to(input_dir)}")

    if processed_count == 0:
        print(f"No supported images found in {input_dir}")
    else:
        print(f"Done. {processed_count} image(s) written to {output_dir}")


if __name__ == "__main__":
    main()
