# F344 - Filtro temporal de harmonias por secao

## Origem

A auditoria em `docs/auditoria.md` apontou que a selecao de harmonias de uma secao usava apenas o numero do compasso. Isso falha em secoes parciais dentro de um compasso ou em janelas que comecam/terminam no meio de eventos harmonicos.

## Objetivo

Quando a secao possui `startTick` e `endTick`, selecionar harmonias por sobreposicao temporal real.

## Implementacao

- `selectSectionHarmonies` passa a filtrar por ticks quando a secao fornece limites temporais.
- O filtro por compasso continua como fallback quando nao ha ticks confiaveis na secao.

## Resultado

Janelas parciais nao puxam todas as cifras do compasso inteiro. Isso reduz contaminacao em analises locais, propostas por trecho e comparacao com harmonia de referencia.

## Validacao

- Teste com tres harmonias no mesmo compasso e secao cobrindo apenas a harmonia central.
- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts scripts/score-ingestion-modes.spec.ts`
- `npm run build`
