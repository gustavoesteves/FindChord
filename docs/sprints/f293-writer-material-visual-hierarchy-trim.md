# F293 - Hierarquia visual em Materiais do acorde

## Objetivo

Reduzir a competicao visual em `Escrever > Materiais do acorde` sem mexer na inteligencia musical da tela.

## Alteracoes

- Cards de ideias fora de foco deixam de exibir celulas e rodape tecnico.
- O card ativo continua mostrando celulas e a indicacao do material no braco.
- A leitura teorica do material passa a aparecer como apoio recolhivel.
- O resumo da leitura fica em uma linha curta, permitindo aprofundamento apenas quando o usuario abrir os detalhes.

## Resultado esperado

A tela deve conduzir o compositor primeiro para uma acao tocavel e para o mapa no braco. As explicacoes continuam disponiveis, mas deixam de competir com o gesto musical principal.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-route-presentation.spec.ts scripts/writer-material-action.spec.ts scripts/writer-material-focus.spec.ts scripts/writer-active-material-panel.spec.ts`
- `npm run build`
