#!/usr/bin/env python3
"""Build the shared searchable text index from the fixed course PDFs."""

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "books-index.json"
BOOKS = [
    ("اللغة العربية", "arabic.pdf"),
    ("اللغة الإنجليزية", "english.pdf"),
    ("التاريخ", "history.pdf"),
    ("الحاسب الآلي", "ict.pdf"),
    ("الرياضيات", "math.pdf"),
    ("الفلسفة", "philosophy.pdf"),
    ("التربية الدينية", "religion.pdf"),
    ("العلوم", "science.pdf"),
    ("اللغة الثانية", "second_lang.pdf"),
]
MAX_CHARS_PER_BOOK = 350_000
MAX_CHARS_PER_PAGE = 12_000


def main():
    result = []
    for name, filename in BOOKS:
        path = ROOT / "books" / filename
        if not path.is_file():
            raise FileNotFoundError(f"Missing required textbook: {path}")

        reader = PdfReader(str(path))
        pages = []
        total_chars = 0
        for number, page in enumerate(reader.pages, start=1):
            if total_chars >= MAX_CHARS_PER_BOOK:
                break
            text = page.extract_text() or ""
            text = re.sub(r"\s+", " ", text).strip()
            if not text:
                continue
            text = text[:MAX_CHARS_PER_PAGE]
            pages.append({"page": number, "text": text})
            total_chars += len(text)

        if not pages:
            raise ValueError(
                f"No selectable text in {filename}. Scanned/image-only PDFs need OCR."
            )
        result.append(
            {"name": name, "path": f"books/{filename}", "type": "PDF", "pages": pages, "fixed": True}
        )
        print(f"Indexed {name}: {len(pages)} pages, {total_chars:,} characters")

    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
