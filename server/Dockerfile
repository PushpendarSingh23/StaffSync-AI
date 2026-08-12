# ── Build/deps stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Python OCR fallback (scripts/ocr/ocr_pdf.py) — the ONLY Python in this
# project, used solely for scanned/image-based PDFs that Node's own
# pdf-parse extraction can't read. Everything else stays Node.
RUN apk add --no-cache python3 py3-pip tesseract-ocr tesseract-ocr-data-eng
COPY scripts/ocr/requirements.txt ./scripts/ocr/requirements.txt
# Alpine's system Python is "externally managed" (PEP 668); this image only
# ever runs this one script, so installing directly with --break-system-packages
# is simpler than maintaining a separate venv for three small packages.
RUN pip install --no-cache-dir --break-system-packages -r scripts/ocr/requirements.txt

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Local disk uploads dir (kept for non-S3 / dev fallback use)
RUN mkdir -p uploads/hr-documents

# Run as non-root
RUN addgroup -S nodejs && adduser -S expressjs -G nodejs \
  && chown -R expressjs:nodejs /app
USER expressjs

EXPOSE 8000

CMD ["node", "index.js"]
