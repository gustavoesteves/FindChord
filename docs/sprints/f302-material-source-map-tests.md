# F302 - Testes material-first para mapas-fonte

## Objetivo

Fazer a cobertura automatizada acompanhar o contrato `MaterialSourceMap`.

## Alteracoes

- `compatible-scales.spec.ts` passa a ser `material-source-maps.spec.ts`.
- `vitest.curated.config.ts` passa a apontar para o novo nome.
- Os asserts principais usam `getMaterialSourceMaps`.
- `getCompatibleScales` fica coberto apenas como adaptador legado.

## Decisao

Os testes devem ensinar a arquitetura atual. A compatibilidade antiga continua protegida, mas o caminho principal passa a falar em material, nao em escala compativel.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/material-source-maps.spec.ts scripts/contextual-material-candidates.spec.ts scripts/contextual-material-ranking.spec.ts scripts/contextual-melodic-materials.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-action.spec.ts scripts/writer-material-palette.spec.ts`
- `npm run build`
