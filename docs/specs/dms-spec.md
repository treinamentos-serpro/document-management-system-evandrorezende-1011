# Especificação - Document Management System

> Especificação derivada do modelo `spec-template.md`, para orientar o
> desenvolvimento guiado por especificação (Spec Driven Development). Este
> documento descreve o que deve ser construído; a implementação ainda não foi
> iniciada.

## 1. Objetivo

Entregar um sistema web simples que permita a um usuário enviar, listar e baixar
seus próprios documentos, com os arquivos gravados no filesystem local da
aplicação e os metadados mantidos em memória nesta fase.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada usuário enxerga apenas os seus documentos)

### Fora do escopo

- Armazenamento externo ou em nuvem (S3, Google Drive, Azure Blob etc.)
- Serviços de upload de terceiros
- Versionamento de documentos
- Exclusão e edição de documentos
- Autenticação e autorização completas (login, senha, tokens, perfis)
- Persistência de metadados em banco de dados
- Upload de múltiplos arquivos em uma única requisição
- Pré-visualização de conteúdo no navegador

### Premissas

- A identificação do usuário é feita pelo cabeçalho HTTP `X-User-Id`, enviado
  pelo cliente. Não há validação de credenciais nesta fase.
- Como os metadados ficam em memória, todos os dados são perdidos ao reiniciar
  o backend. Os arquivos gravados em disco permanecem, mas sem metadados não
  são listáveis após o reinício. Isso é aceito nesta fase.
- Um único processo do backend é executado por vez. Não há escalonamento
  horizontal.

## 3. Requisitos funcionais

| ID    | Requisito                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------- |
| RF-01 | O usuário pode enviar um documento (um arquivo por requisição)                                    |
| RF-02 | O sistema associa o documento enviado ao usuário identificado pelo cabeçalho `X-User-Id`          |
| RF-03 | O usuário pode listar os documentos que ele enviou                                                |
| RF-04 | A lista de documentos é ordenada do upload mais recente para o mais antigo                        |
| RF-05 | O usuário pode baixar um documento pelo seu identificador                                         |
| RF-06 | O download devolve o conteúdo original do arquivo, com o nome original no cabeçalho `Content-Disposition` |
| RF-07 | Um usuário não consegue listar nem baixar documentos de outro usuário                             |
| RF-08 | Upload sem arquivo, com campo diferente de `file` ou sem `X-User-Id` é rejeitado com erro explícito |
| RF-09 | Upload acima do tamanho máximo configurado é rejeitado e o arquivo parcial não é mantido           |
| RF-10 | A interface permite informar o usuário, selecionar um arquivo, enviá-lo, ver a lista e baixar cada documento |

### Critérios de aceite (resumo)

- **RF-01:** `POST /upload` com `multipart/form-data` (campo `file`) e `X-User-Id` retorna `201` com os metadados do documento.
- **RF-03/RF-04:** `GET /documents` retorna apenas os documentos do usuário informado, mais recentes primeiro.
- **RF-05/RF-06:** `GET /documents/:id/download` retorna `200` com os bytes idênticos ao arquivo enviado.
- **RF-07:** Documento de outro usuário responde `404` (não `403`), para não revelar a existência do identificador.
- **RF-09:** Arquivo acima de `MAX_UPLOAD_SIZE_BYTES` responde `413` e nenhum arquivo permanece em `STORAGE_DIR`.

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local via `multer` com `diskStorage`, na pasta `backend/storage`            |
| RNF-02 | Metadados mantidos em memória nesta fase, sem banco de dados                                                |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor App), com valores padrão seguros para desenvolvimento      |
| RNF-04 | Nome do arquivo em disco é gerado pelo sistema (ex.: UUID), nunca o nome enviado pelo cliente              |
| RNF-05 | Backend em CommonJS (Node.js + Express 5); frontend em ESM (React 19 + Vite); JavaScript puro, sem TypeScript |
| RNF-06 | Testes do backend com o runner nativo `node:test`, executados por `npm test` em `backend/`                  |
| RNF-07 | Código sem overengineering: SOLID, DRY, KISS e YAGNI; dependências limitadas às já presentes nos `package.json` |
| RNF-08 | Mensagens ao usuário e comentários em português; símbolos de código em inglês descritivo                  |
| RNF-09 | Erros são tratados nos limites do sistema (entrada HTTP e leitura/escrita de arquivos)                     |
| RNF-10 | Segurança básica: sem uso do nome original como caminho em disco; cabeçalho `Content-Disposition` com nome codificado |

### Variáveis de ambiente

| Variável              | Padrão                    | Uso                                              |
| --------------------- | ------------------------- | ------------------------------------------------ |
| `PORT`                | `3000`                    | Porta do backend                                 |
| `STORAGE_DIR`         | `backend/storage`         | Pasta onde os arquivos são gravados              |
| `MAX_UPLOAD_SIZE_BYTES` | `10485760` (10 MB)      | Tamanho máximo aceito por upload                 |

## 5. Modelo de dados (metadados do documento)

Os metadados são mantidos em uma coleção em memória. A entidade exposta pela API
é a abaixo.

| Campo        | Tipo   | Descrição                                                                 |
| ------------ | ------ | ------------------------------------------------------------------------- |
| id           | string | Identificador único do documento (UUID v4 gerado pelo sistema)            |
| originalName | string | Nome original do arquivo enviado pelo cliente                             |
| size         | number | Tamanho em bytes                                                          |
| mimeType     | string | Tipo MIME informado pelo cliente no upload (ex.: `application/pdf`)       |
| uploadedAt   | string | Data/hora do upload em ISO 8601 (UTC)                                     |
| owner        | string | Valor do cabeçalho `X-User-Id` do usuário dono                            |

### Campo interno (não exposto pela API)

| Campo       | Tipo   | Descrição                                                       |
| ----------- | ------ | --------------------------------------------------------------- |
| storedName  | string | Nome do arquivo no disco dentro de `STORAGE_DIR` (UUID + extensão) |

### Regras

- `id` é único em toda a coleção.
- `owner` é obrigatório e não pode ser vazio.
- `size` deve ser igual ao tamanho real gravado em disco.
- O `storedName` nunca aparece em respostas HTTP.

## 6. Contratos de API

Base: `http://localhost:3000` (no frontend, acessada via `/api`, com proxy do Vite
removendo o prefixo). Todas as rotas de documentos exigem o cabeçalho
`X-User-Id`. Respostas de erro seguem o formato:

```json
{ "error": "Mensagem legível em português" }
```

### GET /health

- Saída `200`: `{ "status": "ok" }` (já existente no seed)

### POST /upload

- Cabeçalhos: `Content-Type: multipart/form-data`, `X-User-Id: <usuário>`
- Corpo: campo `file` com o arquivo
- Saída `201`: metadados do documento criado

```json
{
  "id": "3f2a9c1e-8b7d-4e6f-9a0b-1c2d3e4f5a6b",
  "originalName": "contrato.pdf",
  "size": 183422,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-11-10T19:40:00.000Z",
  "owner": "maria"
}
```

- Erros:
  - `400`: campo `file` ausente ou requisição não multipart
  - `401`: cabeçalho `X-User-Id` ausente ou vazio
  - `413`: arquivo acima de `MAX_UPLOAD_SIZE_BYTES`

### GET /documents

- Cabeçalho: `X-User-Id: <usuário>`
- Saída `200`: array com os metadados dos documentos do usuário, do mais recente para o mais antigo. Lista vazia `[]` quando não há documentos.
- Erros: `401` sem `X-User-Id`

### GET /documents/:id/download

- Cabeçalho: `X-User-Id: <usuário>`
- Parâmetro: `id` (UUID do documento)
- Saída `200`: corpo binário do arquivo
  - `Content-Type`: o `mimeType` registrado (ou `application/octet-stream` se ausente)
  - `Content-Length`: o `size` do documento
  - `Content-Disposition: attachment; filename*=UTF-8''<nome-codificado>`
- Erros:
  - `401`: sem `X-User-Id`
  - `404`: documento inexistente **ou** pertencente a outro usuário

### Tabela resumo

| Método | Caminho                     | Sucesso | Erros                          |
| ------ | --------------------------- | ------- | ------------------------------ |
| GET    | `/health`                   | 200     | —                              |
| POST   | `/upload`                   | 201     | 400, 401, 413                  |
| GET    | `/documents`                | 200     | 401                            |
| GET    | `/documents/:id/download`   | 200     | 401, 404                       |

## 7. Decisões arquiteturais

### Backend (Clean Architecture simples)

Em `backend/src`, com fluxo de dependência `routes -> controllers -> services -> repositories`:

- `routes/`: define os endpoints e delega para os controllers. Aplica o middleware do `multer` na rota de upload.
- `controllers/`: converte HTTP em chamadas de serviço e vice-versa. Faz validação básica de entrada (cabeçalho, presença do arquivo) e monta as respostas e erros.
- `services/`: regras de negócio (associação ao dono, filtro por usuário, ordenação, validação de existência e propriedade).
- `repositories/`: persistência. Um repositório de metadados em memória e um repositório de arquivos que usa o disco (`STORAGE_DIR`).

Camadas internas não importam camadas externas. `services/` não conhece Express nem `multer`.

### Armazenamento

- `multer` com `diskStorage` grava o arquivo em `STORAGE_DIR` com nome gerado (UUID).
- `limits.fileSize` do `multer` aplica `MAX_UPLOAD_SIZE_BYTES`.
- Em caso de erro após a gravação (ex.: falha ao registrar metadados), o arquivo é removido do disco.
- `backend/storage/` é ignorado pelo Git (exceto o `.gitkeep`).

### Frontend (baseado em componentes)

- React 19 com componentes funcionais e Hooks, bundlado com Vite.
- Organização: `components/` (elementos reutilizáveis), `pages/` (tela principal), `services/` (chamadas `fetch` à API).
- Chamadas via `fetch` ao prefixo `/api`, com proxy do Vite para `http://localhost:3000`.
- O usuário é informado em um campo na interface, guardado em `localStorage` e enviado no cabeçalho `X-User-Id`.

### Estrutura de pastas prevista

```
backend/
  src/
    app.js
    config.js          (variáveis de ambiente)
    errors.js          (AppError e NotFoundError)
    routes/
    controllers/
    services/
    repositories/
    middlewares/       (X-User-Id e tratamento de erros)
  storage/
  test/
frontend/
  src/
    main.jsx
    App.jsx
    components/
    pages/
    services/
docs/specs/
  spec-template.md
  dms-spec.md
```

## 8. Plano de execução

Etapas na ordem de implementação. Cada etapa deve terminar com os testes ou a
verificação indicados antes de seguir para a próxima.

### Etapa 1 - Configuração e base do backend

1. Criar leitura de configuração a partir de variáveis de ambiente (`PORT`, `STORAGE_DIR`, `MAX_UPLOAD_SIZE_BYTES`) com os valores padrão da seção 4.
2. Garantir que `STORAGE_DIR` seja criado na inicialização, se não existir.
3. Manter a regra existente do `.gitignore` que ignora `backend/storage/*` e preserva o `.gitkeep`.
4. **Verificação:** `GET /health` continua respondendo `200`.

### Etapa 2 - Camada de persistência

5. Implementar o repositório de metadados em memória (inserir, listar por dono, buscar por id).
6. Implementar o repositório de arquivos: gravação com `diskStorage` (nome UUID), leitura como stream e remoção.
7. **Verificação:** testes unitários dos dois repositórios com `node:test`, usando diretório temporário para arquivos.

### Etapa 3 - Camada de serviço

8. Implementar o serviço de documentos: registrar upload, listar documentos do usuário ordenados por `uploadedAt` desc, obter documento para download verificando a propriedade (retorna "não encontrado" para documento de outro usuário).
9. Remover o arquivo do disco quando o registro de metadados falhar.
10. **Verificação:** testes unitários cobrindo RF-02, RF-03, RF-04 e RF-07 (isolamento entre usuários).

### Etapa 4 - Camada HTTP (controllers e routes)

11. Criar middleware de identificação que lê `X-User-Id` e responde `401` quando ausente ou vazio.
12. Configurar `multer` (`diskStorage` + `limits.fileSize`) e a rota `POST /upload` com campo `file`.
13. Implementar controllers e rotas de `GET /documents` e `GET /documents/:id/download` com os cabeçalhos de `Content-Type`, `Content-Length` e `Content-Disposition`.
14. Tratar erros centralizadamente: `400`, `401`, `404`, `413` e `500`, sempre no formato `{ "error": "..." }`.
15. Ligar as rotas no `app.js` sem alterar o `/health` existente.
16. **Verificação:** testes de integração com `supertest`-like via `node:test` e `app` exportado (ou `fetch` contra servidor de teste) cobrindo todos os contratos da seção 6 e os critérios de aceite da seção 3.

### Etapa 5 - Frontend: base e camada de API

17. Criar `services/documentsApi.js` com funções `uploadDocument`, `listDocuments` e `getDownloadUrl`, todas usando `fetch` em `/api` e enviando `X-User-Id`.
18. Tratar erros de resposta nesse módulo, retornando mensagens em português ao componente.
19. **Verificação:** `npm run build` em `frontend/` sem erros.

### Etapa 6 - Frontend: componentes e tela

20. Criar componente `UserField` para informar o usuário, persistido em `localStorage`.
21. Criar componente `UploadForm` (seleção de arquivo, envio, estado de carregamento e erro).
22. Criar componente `DocumentList` (tabela com nome, tamanho, data e botão de download), reutilizável e sem duplicação de lógica.
23. Criar `pages/DocumentsPage.jsx` compondo os componentes e carregando a lista após upload.
24. Ajustar `App.jsx` para renderizar a página.
25. **Verificação:** `npm run build` e uso manual da tela com o backend em execução.

### Etapa 7 - Integração e documentação

26. Validar o fluxo ponta a ponta: informar usuário, enviar arquivo, ver na lista, baixar e conferir que o conteúdo é idêntico; confirmar que outro usuário não vê o documento.
27. Validar o limite de tamanho (`413`) pela interface, com `MAX_UPLOAD_SIZE_BYTES` reduzido.
28. Atualizar o `README.md` com como executar backend e frontend, variáveis de ambiente e a limitação de metadados em memória.
29. **Verificação final:** `npm test` em `backend/` e `npm run build` em `frontend/` passam.

### Dependências entre etapas

- Etapa 2 depende da Etapa 1.
- Etapa 3 depende da Etapa 2.
- Etapa 4 depende da Etapa 3.
- Etapa 5 depende da Etapa 4 (contratos estáveis).
- Etapa 6 depende da Etapa 5.
- Etapa 7 depende das Etapas 4 e 6.
