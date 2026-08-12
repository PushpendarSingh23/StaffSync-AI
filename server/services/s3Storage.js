/**
 * s3Storage.js
 * Thin helpers around the AWS SDK for the two things the app needs to do
 * with an HR-document object: stream it back out (download / indexing)
 * and delete it (document removal).
 */

import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3.js';

/** Fetch an object's body as a Node Readable stream — for piping to res. */
export const getObjectStream = async (key) => {
  const { Body } = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
  return Body; // Readable in Node runtime
};

/** Fetch an object's body fully buffered — for pdf-parse, which needs a Buffer. */
export const getObjectBuffer = async (key) => {
  const stream = await getObjectStream(key);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

/** Delete an object. Swallows errors — deletion is best-effort cleanup. */
export const deleteObject = async (key, { onError } = {}) => {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch (err) {
    if (onError) onError(err);
  }
};
