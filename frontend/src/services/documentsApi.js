// Cliente da API de documentos. Todas as chamadas usam o prefixo /api, que o Vite
// redireciona para o backend (ver vite.config.js).

const API_PREFIX = '/api';
const DEFAULT_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao servidor.';

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body?.error || DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
}

async function request(path, { userId, headers, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...options,
      headers: { 'X-User-Id': userId, ...headers },
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response;
}

export async function listDocuments(userId) {
  const response = await request('/documents', { userId });
  return response.json();
}

export async function uploadDocument(userId, file) {
  const body = new FormData();
  body.append('file', file);

  const response = await request('/upload', { userId, method: 'POST', body });
  return response.json();
}

export async function downloadDocument(userId, documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`, {
    userId,
  });
  return response.blob();
}
