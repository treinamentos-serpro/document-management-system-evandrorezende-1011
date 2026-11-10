const path = require('node:path');

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage')),
  maxUploadSizeBytes: Number(process.env.MAX_UPLOAD_SIZE_BYTES) || DEFAULT_MAX_UPLOAD_SIZE_BYTES,
};
