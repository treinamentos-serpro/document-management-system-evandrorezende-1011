---
description: Analisa o código do backend e verifica o uso de boas práticas de clean code.
name: revisar-codigo-backend
argument-hint: escopo da análise (ex. backend/src/services ou backend/src)
agent: agent
---

# Revisar código do backend

Analise o código do backend em `${input:escopo:escopo da análise, padrão backend/src}` e verifique o uso de boas práticas de clean code.

Este prompt apenas analisa e reporta. Não altere arquivos.

Verifique, no mínimo:

- Nomes descritivos em inglês para símbolos de código, funções pequenas e com responsabilidade única.
- Separação de camadas: `routes -> controllers -> services -> repositories`, sem que camadas internas importem camadas externas (ex.: `services/` não conhece Express nem `multer`).
- Duplicação de código (DRY), complexidade desnecessária (KISS) e abstrações ou código não utilizado (YAGNI).
- Tratamento de erros nos limites do sistema (entrada HTTP, leitura e escrita de arquivos), com mensagens ao usuário em português e erros propagados com o status correto.
- Comentários: apenas onde há necessidade de esclarecimento; comentários desnecessários ou desatualizados devem ser apontados.
- Efeitos colaterais escondidos, parâmetros em excesso, números e strings mágicos e aninhamento profundo.
- Configuração via variáveis de ambiente (12-Factor), sem valores fixos no código.

Para cada problema encontrado, informe:

1. Arquivo e linha, no formato `caminho:linha`.
2. Princípio ou prática violada (ex.: SRP, DRY, nome pouco descritivo).
3. Severidade: alta, média ou baixa.
4. Sugestão de correção objetiva.

Finalize com um resumo: os pontos fortes do código analisado e a lista priorizada de melhorias. Se nenhum problema for encontrado, diga isso explicitamente e indique o que foi verificado.
