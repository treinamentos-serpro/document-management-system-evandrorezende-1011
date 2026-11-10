const { NotFoundError } = require('../errors');

function createDocumentsService({
  documentsRepository,
  filesRepository,
  createId,
  now,
}) {
  async function uploadDocument(owner, uploadedFile) {
    const document = {
      id: createId(),
      originalName: uploadedFile.originalname,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      uploadedAt: now().toISOString(),
      owner,
      storedName: uploadedFile.filename,
    };

    try {
      await documentsRepository.save(document);
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

    if (!document || document.owner !== owner) {
      throw new NotFoundError();
    }

    return {
      document,
      filePath: filesRepository.resolvePath(document.storedName),
    };
  }

  return { uploadDocument, listDocuments, getDocumentForDownload };
}

module.exports = { createDocumentsService };
