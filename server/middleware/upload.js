import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_BUCKET } from '../config/s3.js';

// Prefix mirrors the old local folder name so keys stay easy to reason
// about: hr-documents/<uuid>.pdf
const S3_PREFIX = 'hr-documents';

const storage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key(_req, file, cb) {
    // Random UUID name to avoid collisions and path-traversal-style keys —
    // same rationale as the old disk storage.
    cb(null, `${S3_PREFIX}/${uuidv4()}.pdf`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are accepted.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
});

export default upload;
