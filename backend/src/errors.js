class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Documento não encontrado.') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

module.exports = { AppError, NotFoundError };
