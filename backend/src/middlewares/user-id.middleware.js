const { AppError } = require('../errors');

// Executado antes do multer para não gravar arquivos de requisições não autorizadas.
function requireUserId(req, res, next) {
  const userId = req.get('X-User-Id')?.trim();

  if (!userId) {
    return next(new AppError(401, 'O cabeçalho X-User-Id é obrigatório.'));
  }

  req.userId = userId;
  return next();
}

module.exports = { requireUserId };
