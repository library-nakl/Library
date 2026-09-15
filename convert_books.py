#!/usr/bin/env python3
"""
Convert books-from-db.json (SQL export format: header + rows)
into the flat object format used by books.json.

Source row columns (from "header"):
  id, title, author, shelf_location, library_type,
  stand_number, shelf_number, book_number, section

Target object keys (matching books.json):
  id, name, author, libraryType, section, stand, shelf, number

Notes:
  - "shelf_location" from the source has no equivalent field in
    books.json, so it is dropped.
  - Numeric-looking fields (id, stand, shelf, number) are converted
    to real JSON integers.
  - The literal string "NULL" (as produced by the SQL export) is
    converted to an empty string "" for text fields.
"""

import json
import sys
from pathlib import Path

SOURCE_PATH = Path("/mnt/user-data/uploads/books-from-db.json")
OUTPUT_PATH = Path("/mnt/user-data/outputs/books-from-db-converted.json")


def clean_text(value: str) -> str:
    """Turn SQL NULLs into empty strings, strip whitespace."""
    if value is None:
        return ""
    value = value.strip()
    return "" if value.upper() == "NULL" else value


def to_int(value, default=0):
    """Best-effort conversion to int; falls back to `default`."""
    try:
        return int(str(value).strip())
    except (ValueError, TypeError):
        return default


def convert(source_data):
    converted = []

    for table in source_data:
        header = table["header"]
        rows = table["rows"]

        # Map column name -> index, so the script keeps working
        # even if the column order in the export changes.
        col_index = {name: i for i, name in enumerate(header)}

        for row in rows:
            def get(col):
                return row[col_index[col]] if col in col_index else None

            book = {
                "id": to_int(get("id")),
                "name": clean_text(get("title")),
                "author": clean_text(get("author")),
                "libraryType": clean_text(get("library_type")),
                "section": clean_text(get("section")),
                "stand": to_int(get("stand_number")),
                "shelf": to_int(get("shelf_number")),
                "number": to_int(get("book_number")),
            }
            converted.append(book)

    return converted


def main():
    if not SOURCE_PATH.exists():
        sys.exit(f"Source file not found: {SOURCE_PATH}")

    with open(SOURCE_PATH, encoding="utf-8") as f:
        source_data = json.load(f)

    converted = convert(source_data)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(converted, f, ensure_ascii=False, indent=2)

    print(f"Converted {len(converted)} books -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
