/**
 * ocrService.js
 *
 * Node-side wrapper around the Python OCR fallback (scripts/ocr/ocr_pdf.py).
 * Only called for scanned/image-based PDFs, where pdf-parse's text
 * extraction comes back empty or too short to be a real text layer.
 *
 * Flow: write the PDF buffer to a temp file (PyMuPDF needs a real path) →
 * spawn `python3 ocr_pdf.py <path>` → parse its JSON stdout → clean up
 * the temp file. No Python process runs unless this is called.
 */

import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { config } from '../config/serverConfig.js';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OCR_SCRIPT = path.join(__dirname, '..', 'scripts', 'ocr', 'ocr_pdf.py');
const CTX = 'ocrService';

/** True when Node's own PDF text extraction didn't find a real text layer. */
export const isTextInsufficient = (text) =>
  (text || '').trim().length < config.ocrMinTextLength;

const runPython = (bin, args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(bin, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });

    proc.on('error', (err) => {
      // e.g. `python3` not installed / not on PATH
      reject(new Error(`Could not start OCR process ("${bin}"): ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`OCR script exited with code ${code}: ${stderr.trim() || 'no stderr output'}`));
      } else {
        resolve(stdout);
      }
    });
  });

/**
 * Run OCR on a PDF buffer and return the extracted text.
 * @param {Buffer} buffer — raw PDF bytes (as read from S3)
 * @returns {Promise<string>}
 */
export const ocrPdfBuffer = async (buffer) => {
  const tmpPath = path.join(os.tmpdir(), `ocr-${randomUUID()}.pdf`);
  await writeFile(tmpPath, buffer);

  try {
    const stdout = await runPython(config.pythonBin, [OCR_SCRIPT, tmpPath]);
    const { text, pages } = JSON.parse(stdout);
    logger.info(CTX, 'OCR extraction complete', { pages, chars: text.length });
    return text;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
};
