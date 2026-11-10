const multer = require('multer');

function createUploadFileMiddleware(filesRepository, maxUploadSizeBytes) {
  return multer({
    storage: filesRepository.diskStorage,
    limits: { fileSize: maxUploadSizeBytes },
  }).single('file');
}

module.exports = { createUploadFileMiddleware };
