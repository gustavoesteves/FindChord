# F303 - Testes de comportamento material contextual

## Objetivo

Remover a dependencia principal dos testes no alias antigo `contextualScaleCandidates`.

## Alteracoes

- `contextual-scale-candidates.spec.ts` passa a ser `contextual-material-candidate-behavior.spec.ts`.
- O teste grande de comportamento passa a chamar `buildContextualMaterialCandidates`.
- `vitest.curated.config.ts` passa a apontar para o novo arquivo.
- O teste de dominante natural deixa de exigir lista fechada de materiais e passa a verificar a presenca do material essencial.

## Decisao

O motor pode oferecer mais de um material valido para uma mesma leitura. O teste deve proteger a presenca da ideia musical importante, nao bloquear vocabulario adicional util.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/contextual-material-candidate-behavior.spec.ts scripts/contextual-material-candidates.spec.ts scripts/material-source-maps.spec.ts`
- `npm run build`
