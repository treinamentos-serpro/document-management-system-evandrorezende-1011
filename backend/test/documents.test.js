const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
process.env.MAX_UPLOAD_SIZE_BYTES = '1024';

const app = require('../src/app');

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(storageDir, { recursive: true, force: true });
});

function storedFiles() {
  return fs.readdirSync(storageDir);
}

function buildUploadForm(content, fileName, fieldName = 'file', mimeType = 'text/plain') {
  const form = new FormData();
  form.append(fieldName, new Blob([content], { type: mimeType }), fileName);
  return form;
}

async function upload(userId, form) {
  const headers = userId === undefined ? {} : { 'X-User-Id': userId };
  return fetch(`${baseUrl}/upload`, { method: 'POST', headers, body: form });
}

test('POST /upload grava o arquivo e retorna os metadados sem storedName', async () => {
  const response = await upload('ana', buildUploadForm('conteudo do contrato', 'contrato.txt'));
  const body = await response.json();

  assert.strictEqual(response.status, 201);
  assert.strictEqual(body.originalName, 'contrato.txt');
  assert.strictEqual(body.size, Buffer.byteLength('conteudo do contrato'));
  assert.strictEqual(body.mimeType, 'text/plain');
  assert.strictEqual(body.owner, 'ana');
  assert.ok(body.id);
  assert.ok(!Number.isNaN(Date.parse(body.uploadedAt)));
  assert.strictEqual(body.storedName, undefined);
  assert.ok(storedFiles().some((name) => name.endsWith('.txt')));
});

test('POST /upload sem X-User-Id responde 401 e não grava arquivo', async () => {
  const filesBefore = storedFiles().length;
  const response = await upload(undefined, buildUploadForm('sem dono', 'sem-dono.txt'));

  assert.strictEqual(response.status, 401);
  assert.strictEqual(storedFiles().length, filesBefore);
});

test('POST /upload sem arquivo responde 400', async () => {
  const response = await upload('ana', new FormData());

  assert.strictEqual(response.status, 400);
});

test('POST /upload com campo diferente de "file" responde 400 e não grava arquivo', async () => {
  const filesBefore = storedFiles().length;
  const response = await upload('ana', buildUploadForm('x', 'x.txt', 'documento'));

  assert.strictEqual(response.status, 400);
  assert.strictEqual(storedFiles().length, filesBefore);
});

test('POST /upload acima do limite responde 413 e não mantém o arquivo', async () => {
  const filesBefore = storedFiles().length;
  const response = await upload('ana', buildUploadForm('x'.repeat(4096), 'grande.txt'));

  assert.strictEqual(response.status, 413);
  assert.strictEqual(storedFiles().length, filesBefore);
});

test('GET /documents lista somente os documentos do usuário, mais recentes primeiro', async () => {
  await upload('bruno', buildUploadForm('primeiro', 'primeiro.txt'));
  await new Promise((resolve) => setTimeout(resolve, 5));
  await upload('bruno', buildUploadForm('segundo', 'segundo.txt'));

  const response = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'bruno' } });
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(
    body.map((document) => document.originalName),
    ['segundo.txt', 'primeiro.txt'],
  );
  assert.ok(body.every((document) => document.owner === 'bruno'));
});

test('GET /documents sem X-User-Id responde 401', async () => {
  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 401);
});

test('GET /documents/:id/download devolve o conteúdo original e os cabeçalhos corretos', async () => {
  const uploadResponse = await upload('carla', buildUploadForm('bytes do relatório', 'relatório final.txt'));
  const created = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${created.id}/download`, {
    headers: { 'X-User-Id': 'carla' },
  });
  const content = await response.text();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(content, 'bytes do relatório');
  assert.ok(response.headers.get('content-type').startsWith('text/plain'));
  assert.strictEqual(response.headers.get('content-length'), String(created.size));
  assert.strictEqual(
    response.headers.get('content-disposition'),
    `attachment; filename*=UTF-8''relat%C3%B3rio%20final.txt`,
  );
});

test('GET /documents/:id/download de documento de outro usuário responde 404', async () => {
  const uploadResponse = await upload('diego', buildUploadForm('privado', 'privado.txt'));
  const created = await uploadResponse.json();

  const response = await fetch(`${baseUrl}/documents/${created.id}/download`, {
    headers: { 'X-User-Id': 'eva' },
  });

  assert.strictEqual(response.status, 404);
});

test('GET /documents/:id/download com identificador inexistente responde 404', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`, {
    headers: { 'X-User-Id': 'diego' },
  });

  assert.strictEqual(response.status, 404);
});
