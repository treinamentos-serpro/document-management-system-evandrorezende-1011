const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const config = require('../config');

const MAX_EXTENSION_LENGTH = 16;

function buildStoredName(originalName) {
  const extension = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const safeExtension = extension.length > 1 ? extension.slice(0, MAX_EXTENSION_LENGTH) : '';
  return `${randomUUID()}${safeExtension}`;
}

const diskStorage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(config.storageDir, { recursive: true }, (error) => {
      callback(error, config.storageDir);
    });
  },
  filename(req, file, callback) {
    callback(null, buildStoredName(file.originalname));
  },
});

function resolvePath(storedName) {
  return path.join(config.storageDir, storedName);
}

async function remove(storedName) {
  await fs.promises.rm(resolvePath(storedName), { force: true });
}

module.exports = { diskStorage, resolvePath, remove };
