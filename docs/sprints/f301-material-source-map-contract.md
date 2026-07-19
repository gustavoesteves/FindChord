# F301 - Contrato MaterialSourceMap

## Objetivo

Consolidar a nomenclatura material-first no nucleo que ainda vinha da antiga tela de escalas compativeis.

## Alteracoes

- `MaterialSourceMap` passa a ser a interface principal em `musicTheory`.
- `ScaleInfo` permanece apenas como alias de compatibilidade.
- Consumidores do `Writer` passam a tipar fontes como `MaterialSourceMap`.
- Candidatos contextuais passam a herdar de `MaterialSourceMap`.
- Testes passam a cobrir o contrato `getMaterialSourceMapTypes` e `getMaterialSourceMapsForQuality`.

## Decisao

O sistema ainda pode usar escalas como infraestrutura, mas o contrato publico da camada nova deve falar em mapas-fonte de material. Isso evita que a UI e os services voltem a se organizar como uma lista de escalas compativeis.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/material-source-maps.spec.ts scripts/contextual-material-candidates.spec.ts scripts/contextual-material-ranking.spec.ts scripts/contextual-melodic-materials.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-action.spec.ts scripts/writer-material-palette.spec.ts`
- `npm run build`
- `rg -n "ScaleOverlayPanel|activeTab === \"scales\"|\"scales\"|ScaleInfo" src/domains/writer src/utils/music/theory scripts/helpers scripts/writer-material-action.spec.ts`
