const express = require('express');

function createDocumentsRouter({ documentsController, uploadFile, requireUserId }) {
  const router = express.Router();

  router.post('/upload', requireUserId, uploadFile, documentsController.upload);
  router.get('/documents', requireUserId, documentsController.list);
  router.get('/documents/:id/download', requireUserId, documentsController.download);

  return router;
}

module.exports = { createDocumentsRouter };
