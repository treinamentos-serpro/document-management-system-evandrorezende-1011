// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const { randomUUID } = require('node:crypto');
const config = require('./config');
const documentsRepository = require('./repositories/documents.repository');
const filesRepository = require('./repositories/files.repository');
const { createDocumentsService } = require('./services/documents.service');
const { createDocumentsController } = require('./controllers/documents.controller');
const { createDocumentsRouter } = require('./routes/documents.routes');
const { createUploadFileMiddleware } = require('./middlewares/upload-file.middleware');
const { requireUserId } = require('./middlewares/user-id.middleware');
const { errorHandler } = require('./middlewares/error.middleware');

const documentsService = createDocumentsService({
  documentsRepository,
  filesRepository,
  createId: randomUUID,
  now: () => new Date(),
});
const documentsController = createDocumentsController(documentsService);
const documentsRouter = createDocumentsRouter({
  documentsController,
  uploadFile: createUploadFileMiddleware(filesRepository, config.maxUploadSizeBytes),
  requireUserId,
});

const app = express();

app.use(express.json());

// Endpoint de verificação de saúde.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentsRouter);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`DMS backend ouvindo na porta ${config.port}`);
  });
}

module.exports = app;
