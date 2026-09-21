import json
import os
import re

import barcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display


INPUT_FILE = "books.json"
OUTPUT_DIR = "barcodes"

# Label size: 50 x 30 mm at 300 DPI
DPI = 300
WIDTH = round(50 / 25.4 * DPI)
HEIGHT = round(30 / 25.4 * DPI)


def sanitize_filename(name):
    """Make a safe filename."""
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip()


def get_font(size):
    """
    Try to find a font that supports Arabic.
    Put DejaVuSans.ttf in the same directory if necessary.
    """
    font_paths = [
        "DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/tahoma.ttf",
    ]

    for path in font_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)

    # Fallback
    return ImageFont.load_default()


def fit_text(draw, text, max_width, start_size=45, min_size=18):
    """Find the largest font size that fits the available width."""
    for size in range(start_size, min_size - 1, -1):
        font = get_font(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]

        if text_width <= max_width:
            return font

    return get_font(min_size)

def prepare_arabic_text(text):
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)


# Load books
with open(INPUT_FILE, "r", encoding="utf-8") as file:
    books = json.load(file)


barcode_class = barcode.get_barcode_class("code128")


for book in books:

    book_id = str(book["id"])
    original_name = book.get("name", "").strip()
    book_name = prepare_arabic_text(book.get("name", "").strip())

    # ---------------------------------------
    # 1. Generate barcode
    # ---------------------------------------

    barcode_options = {
        "module_width": 0.45,
        "module_height": 16,
        "font_size": 12,
        "text_distance": 2,
        "quiet_zone": 3,
        "dpi": DPI,
        "write_text": False,  # We'll draw the ID ourselves
    }

    barcode_instance = barcode_class(
        book_id,
        writer=ImageWriter()
    )

    # Temporary barcode filename
    temp_path = os.path.join(
        OUTPUT_DIR,
        f"_temp_{book_id}"
    )

    barcode_file = barcode_instance.save(
        temp_path,
        options=barcode_options
    )

    # Open generated barcode
    barcode_image = Image.open(barcode_file).convert("RGB")

    # ---------------------------------------
    # 2. Create 50 x 30 mm white label
    # ---------------------------------------

    label = Image.new(
        "RGB",
        (WIDTH, HEIGHT),
        "white"
    )

    draw = ImageDraw.Draw(label)

    # ---------------------------------------
    # 3. Draw book name at the top
    # ---------------------------------------

    book_font = fit_text(
        draw,
        book_name,
        WIDTH - 60,
        start_size=42,
        min_size=18
    )

    bbox = draw.textbbox(
        (0, 0),
        book_name,
        font=book_font
    )

    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = (WIDTH - text_width) // 2
    text_y = 20

    draw.text(
        (text_x, text_y),
        book_name,
        fill="black",
        font=book_font
    )

    # ---------------------------------------
    # 4. Resize barcode
    # ---------------------------------------

    max_barcode_width = WIDTH - 100
    max_barcode_height = round(14 / 25.4 * DPI)

    barcode_image.thumbnail(
        (max_barcode_width, max_barcode_height),
        Image.Resampling.LANCZOS
    )

    barcode_x = (WIDTH - barcode_image.width) // 2

    # Position barcode below book name
    barcode_y = text_y + text_height + 25

    label.paste(
        barcode_image,
        (barcode_x, barcode_y)
    )

    # ---------------------------------------
    # 5. Draw ID underneath barcode
    # ---------------------------------------

    id_font = get_font(38)

    id_bbox = draw.textbbox(
        (0, 0),
        book_id,
        font=id_font
    )

    id_width = id_bbox[2] - id_bbox[0]

    id_x = (WIDTH - id_width) // 2
    id_y = barcode_y + barcode_image.height + 15

    draw.text(
        (id_x, id_y),
        book_id,
        fill="black",
        font=id_font
    )

    # ---------------------------------------
    # 6. Save final PNG
    # ---------------------------------------

    filename = sanitize_filename(original_name)

    if not filename:
        filename = f"book_{book_id}"

    output_file = os.path.join(
        OUTPUT_DIR,
        f"{filename}_{book_id}.png"
    )

    label.save(
        output_file,
        "PNG",
        dpi=(DPI, DPI)
    )

    # Remove temporary barcode
    if os.path.exists(barcode_file):
        os.remove(barcode_file)

    print(f"Created: {output_file}")


print("\nDone!")
