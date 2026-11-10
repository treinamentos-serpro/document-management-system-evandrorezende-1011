const express = require('express');
const multer = require('multer');
const config = require('../config');
const filesRepository = require('../repositories/files.repository');
const documentsController = require('../controllers/documents.controller');
const { requireUserId } = require('../middlewares/user-id.middleware');

const uploadFile = multer({
  storage: filesRepository.diskStorage,
  limits: { fileSize: config.maxUploadSizeBytes },
}).single('file');

const router = express.Router();

router.post('/upload', requireUserId, uploadFile, documentsController.upload);
router.get('/documents', requireUserId, documentsController.list);
router.get('/documents/:id/download', requireUserId, documentsController.download);

module.exports = router;
