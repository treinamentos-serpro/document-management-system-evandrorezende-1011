const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');
const filesRepository = require('../repositories/files.repository');
const { NotFoundError } = require('../errors');

// Campos internos (como storedName) não são expostos pela API.
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

  return toPublicDocument(document);
}

function listDocuments(owner) {
  return documentsRepository
    .findByOwner(owner)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .map(toPublicDocument);
}

function getDocumentForDownload(owner, id) {
  const document = documentsRepository.findById(id);

  // Documento de outro usuário é tratado como inexistente para não revelar seu identificador.
  if (!document || document.owner !== owner) {
    throw new NotFoundError();
  }

  return {
    document: toPublicDocument(document),
    filePath: filesRepository.resolvePath(document.storedName),
  };
}

module.exports = { uploadDocument, listDocuments, getDocumentForDownload };
