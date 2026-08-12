#!/usr/bin/env python3
"""
ocr_pdf.py

Minimal OCR fallback for scanned/image-based PDFs.

Node's `pdf-parse` (server/services/documentProcessor.js) only reads a
PDF's embedded text layer. A scanned document has no text layer — just a
picture of each page — so pdf-parse returns empty/near-empty text for it.
This script is the fallback for exactly that case: it rasterises each
page with PyMuPDF and runs Tesseract OCR on the page image.

This is NOT a service. It is a small, single-purpose CLI that the Node
server shells out to (see server/utils/ocrService.js), only when Node's
own extraction already came back too short to be real text.

Usage
-----
    python3 ocr_pdf.py <path-to-pdf>

Output (stdout, on success): a single JSON line — {"text": "...", "pages": N}
On failure: an error message on stderr and a non-zero exit code, so the
Node caller can tell a real failure apart from an empty result.
"""

import io
import json
import sys

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

# Render at 2x zoom — a plain 72dpi page render is too low-res for
# Tesseract to read reliably; 2x is a good accuracy/speed tradeoff.
ZOOM = fitz.Matrix(2, 2)


def ocr_pdf(pdf_path: str) -> dict:
    doc = fitz.open(pdf_path)
    try:
        page_texts = []
        for page in doc:
            pixmap = page.get_pixmap(matrix=ZOOM)
            image = Image.open(io.BytesIO(pixmap.tobytes("png")))
            page_texts.append(pytesseract.image_to_string(image))
        return {"text": "\n".join(page_texts).strip(), "pages": len(page_texts)}
    finally:
        doc.close()


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 ocr_pdf.py <path-to-pdf>", file=sys.stderr)
        sys.exit(1)

    try:
        result = ocr_pdf(sys.argv[1])
    except Exception as exc:  # noqa: BLE001 — any failure just needs to reach stderr
        print(f"OCR failed: {exc}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result))


if __name__ == "__main__":
    main()
