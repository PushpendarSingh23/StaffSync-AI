/**
 * s3.js
 * Single shared S3 client, configured from env vars. HR documents are
 * stored under the `hr-documents/` prefix in this bucket instead of on
 * local disk (see middleware/upload.js).
 */

import { S3Client } from '@aws-sdk/client-s3';

export const S3_BUCKET = process.env.S3_BUCKET_NAME;

if (!S3_BUCKET) {
  // Fail fast with a clear message instead of the cryptic "bucket is
  // required" error multer-s3 throws when it tries to use an undefined
  // bucket name.
  throw new Error(
    'S3_BUCKET_NAME is not set. Add it to your .env (see .env.example) — HR document storage requires it.'
  );
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  // Falls back to the default AWS credential chain (IAM role, shared
  // config file, etc.) when these aren't set — useful in prod where
  // credentials come from the instance/task role rather than env vars.
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});
