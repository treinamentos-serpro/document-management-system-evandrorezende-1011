const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');
const filesRepository = require('../repositories/files.repository');
const { NotFoundError } = require('../errors');

async function uploadDocument(owner, uploadedFile) {
  const document = {
    id: randomUUID(),
    originalName: uploadedFile.originalname,
    size: uploadedFile.size,
    mimeType: uploadedFile.mimetype,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: uploadedFile.filename,
  };

  try {
    documentsRepository.save(document);
  } catch (error) {
    await filesRepository.remove(document.storedName);
    throw error;
  }

  return document;
}

function listDocuments(owner) {
  return documentsRepository
    .findByOwner(owner)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function getDocumentForDownload(owner, id) {
  const document = documentsRepository.findById(id);

  // Documento de outro usuário é tratado como inexistente para não revelar seu identificador.
  if (!document || document.owner !== owner) {
    throw new NotFoundError();
  }

  return {
    document,
    filePath: filesRepository.resolvePath(document.storedName),
  };
}

module.exports = { uploadDocument, listDocuments, getDocumentForDownload };
