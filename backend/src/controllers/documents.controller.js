const fs = require('node:fs');
const { pipeline } = require('node:stream');
const { AppError } = require('../errors');

const DEFAULT_MIME_TYPE = 'application/octet-stream';

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function encodeFilename(name) {
  return encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function decodeOriginalName(name) {
  return Buffer.from(name, 'latin1').toString('utf8');
}

function createDocumentsController(documentsService) {
  async function upload(req, res) {
    if (!req.file) {
      throw new AppError(400, 'Nenhum arquivo enviado. Use o campo "file".');
    }

    const uploadedFile = { ...req.file, originalname: decodeOriginalName(req.file.originalname) };
    const document = await documentsService.uploadDocument(req.userId, uploadedFile);
    res.status(201).json(toPublicDocument(document));
  }

  function list(req, res) {
    res.json(documentsService.listDocuments(req.userId).map(toPublicDocument));
  }

  function download(req, res) {
    const { document, filePath } = documentsService.getDocumentForDownload(req.userId, req.params.id);
    const publicDocument = toPublicDocument(document);

    res.set({
      'Content-Type': publicDocument.mimeType || DEFAULT_MIME_TYPE,
      'Content-Length': publicDocument.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeFilename(publicDocument.originalName)}`,
    });

    pipeline(fs.createReadStream(filePath), res, (error) => {
      if (error) {
        console.error(error);
        res.destroy();
      }
    });
  }

  return { upload, list, download };
}

module.exports = { createDocumentsController };
