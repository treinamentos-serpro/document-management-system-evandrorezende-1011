const multer = require('multer');
const { AppError } = require('../errors');

function mapMulterError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(413, 'O arquivo excede o tamanho máximo permitido.');
  }
  return new AppError(400, 'Campo de arquivo inválido. Envie o arquivo no campo "file".');
}

// O Express só trata este middleware como de erro com os quatro parâmetros, mesmo sem usar `next`.
// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const appError = error instanceof multer.MulterError ? mapMulterError(error) : error;

  if (appError instanceof AppError) {
    return res.status(appError.status).json({ error: appError.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };
