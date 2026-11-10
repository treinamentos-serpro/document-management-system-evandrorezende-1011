const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDocumentsService } = require('../src/services/documents.service');
const { NotFoundError } = require('../src/errors');

function createRepositories(initialDocuments = []) {
  const documents = new Map(initialDocuments.map((document) => [document.id, document]));
  const removedFiles = [];

  return {
    documents,
    removedFiles,
    documentsRepository: {
      save(document) {
        documents.set(document.id, document);
        return document;
      },
      findById(id) {
        return documents.get(id) || null;
      },
      findByOwner(owner) {
        return [...documents.values()].filter((document) => document.owner === owner);
      },
    },
    filesRepository: {
      async remove(storedName) {
        removedFiles.push(storedName);
      },
      resolvePath(storedName) {
        return `/storage/${storedName}`;
      },
    },
  };
}

test('documents service uses injected dependencies for upload and document listing', async () => {
  const repositories = createRepositories();
  const service = createDocumentsService({
    ...repositories,
    createId: () => 'document-id',
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  });

  const document = await service.uploadDocument('ana', {
    originalname: 'contrato.txt',
    size: 12,
    mimetype: 'text/plain',
    filename: 'stored.txt',
  });

  assert.strictEqual(document.id, 'document-id');
  assert.strictEqual(document.uploadedAt, '2026-01-01T00:00:00.000Z');
  assert.deepStrictEqual(service.listDocuments('ana'), [document]);
});

test('documents service removes the stored file if metadata persistence fails', async () => {
  const repositories = createRepositories();
  const persistenceError = new Error('Falha ao salvar metadados.');
  repositories.documentsRepository.save = () => {
    throw persistenceError;
  };
  const service = createDocumentsService({
    ...repositories,
    createId: () => 'document-id',
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  });

  await assert.rejects(
    service.uploadDocument('ana', {
      originalname: 'contrato.txt',
      size: 12,
      mimetype: 'text/plain',
      filename: 'stored.txt',
    }),
    persistenceError,
  );
  assert.deepStrictEqual(repositories.removedFiles, ['stored.txt']);
});

test('documents service resolves authorized downloads and hides documents owned by others', () => {
  const document = { id: 'document-id', owner: 'ana', storedName: 'stored.txt' };
  const repositories = createRepositories([document]);
  const service = createDocumentsService({
    ...repositories,
    createId: () => 'unused',
    now: () => new Date(),
  });

  assert.deepStrictEqual(service.getDocumentForDownload('ana', document.id), {
    document,
    filePath: '/storage/stored.txt',
  });
  assert.throws(
    () => service.getDocumentForDownload('bruno', document.id),
    NotFoundError,
  );
});
