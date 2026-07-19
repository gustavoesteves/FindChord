# F295 - Ideia em foco em Materiais do acorde

## Objetivo

Reduzir a sensacao de catalogo na tela `Materiais do acorde` e reforcar o fluxo de navegacao musical.

## Alteracoes

- A coluna de ideias passa a exibir primeiro uma unica ideia em foco.
- As demais sugestoes da mesma rota ficam recolhidas em `Outras ideias da rota`.
- O card ativo continua mostrando celulas e base do material.
- Cards alternativos permanecem acessiveis, mas deixam de competir visualmente com a acao principal.

## Decisao

A tela deve funcionar como uma recomendacao tocavel, nao como uma tabela de todas as possibilidades teoricas. O usuario ainda pode explorar alternativas, mas o primeiro olhar precisa indicar um caminho musical claro.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-routes.spec.ts scripts/writer-material-palette.spec.ts scripts/writer-material-focus.spec.ts`
- `npm run build`
