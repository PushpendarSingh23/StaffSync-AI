# OCR fallback (`ocr_pdf.py`)

The only Python in this project. Used when a document is a **scanned/
image-based PDF** — i.e. `pdf-parse` (Node) finds no real text layer to
extract.

## Flow

```
PDF uploaded
    │
    ▼
Node: pdf-parse extracts text        (documentProcessor.js)
    │
    ▼
Text length < threshold (config.ocrMinTextLength)?
    │                              │
   No                             Yes
    │                              │
    ▼                              ▼
use Node-extracted text     Node spawns: python3 ocr_pdf.py <tmp-file>.pdf
    │                              │
    │                              ▼
    │                       Python: PyMuPDF rasterises each page →
    │                       Tesseract OCR each page image → prints
    │                       {"text": "...", "pages": N} as JSON
    │                              │
    │                              ▼
    │                       Node reads OCR'd text from stdout
    │                              │
    └──────────────┬───────────────┘
                    ▼
        existing RAG pipeline (chunk → embed → store)
```

Node does this via `server/utils/ocrService.js`, which writes the PDF
buffer to a temp file, runs `python3 ocr_pdf.py <path>` as a child
process, and parses its JSON stdout. Everything downstream (chunking,
embeddings, vector storage, chat, reranking) is unchanged — OCR only
decides *what text* enters that pipeline for scanned PDFs.

## Setup

**Docker (recommended):** nothing to do — `server/Dockerfile` already
installs Python, Tesseract, and this folder's `requirements.txt`. Note:
Alpine (musl libc) only has prebuilt PyMuPDF wheels for `x86_64` — if you
build the image on Apple Silicon / arm64, add `--platform linux/amd64` to
`docker build`.

**Local (non-Docker) dev**, if you want to test OCR outside a container:

```bash
# 1. System dependency — the Tesseract OCR engine itself (not a pip package)
#    macOS:   brew install tesseract
#    Ubuntu:  sudo apt-get install tesseract-ocr
#    Windows: https://github.com/UB-Mannheim/tesseract/wiki

# 2. Python dependencies
cd server/scripts/ocr
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

If `python3` isn't on your `PATH` under that exact name, set `PYTHON_BIN`
in `server/.env` (e.g. `PYTHON_BIN=python`) — `ocrService.js` reads it.

## Manual test

```bash
python3 ocr_pdf.py /path/to/scanned.pdf
# → {"text": "...extracted text...", "pages": 3}
```
