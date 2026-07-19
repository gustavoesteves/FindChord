# F296 - Navegador de rotas mais compacto

## Objetivo

Diminuir o peso visual do seletor de rotas em `Materiais do acorde` e deixar a intencao musical mais direta.

## Alteracoes

- O acorde em foco passa a aparecer como contexto compacto.
- As rotas ficam em uma grade simples de intencoes.
- Cada rota mostra apenas a quantidade de ideias disponiveis.
- A descricao da rota ativa permanece visivel, mas sem competir com a acao principal.

## Decisao

O navegador nao deve parecer uma configuracao do motor. Ele deve funcionar como uma escolha musical rapida: ficar dentro, colorir ou tensionar.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-routes.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
