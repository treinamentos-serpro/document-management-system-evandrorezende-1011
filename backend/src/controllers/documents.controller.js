const fs = require('node:fs');
const { pipeline } = require('node:stream');
const documentsService = require('../services/documents.service');
const { AppError } = require('../errors');

const DEFAULT_MIME_TYPE = 'application/octet-stream';

// Codifica o nome conforme RFC 5987, inclusive os caracteres que encodeURIComponent deixa passar.
function encodeFilename(name) {
  return encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

// O multer entrega o nome do arquivo decodificado como latin1; reinterpretamos os bytes como UTF-8.
function decodeOriginalName(name) {
  return Buffer.from(name, 'latin1').toString('utf8');
}

async function upload(req, res) {
  if (!req.file) {
    throw new AppError(400, 'Nenhum arquivo enviado. Use o campo "file".');
  }

  const uploadedFile = { ...req.file, originalname: decodeOriginalName(req.file.originalname) };
  const document = await documentsService.uploadDocument(req.userId, uploadedFile);
  res.status(201).json(document);
}

function list(req, res) {
  res.json(documentsService.listDocuments(req.userId));
}

function download(req, res) {
  const { document, filePath } = documentsService.getDocumentForDownload(req.userId, req.params.id);

  res.set({
    'Content-Type': document.mimeType || DEFAULT_MIME_TYPE,
    'Content-Length': document.size,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeFilename(document.originalName)}`,
  });

  pipeline(fs.createReadStream(filePath), res, (error) => {
    if (error) {
      console.error(error);
      res.destroy();
    }
  });
}

module.exports = { upload, list, download };
