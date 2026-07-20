# F332 - Remocao de aliases Scale no servico do Harmonizar

## Objetivo

Encerrar aliases `Scale` que ja nao tinham consumidores no servico do `Harmonizar`.

## Alteracoes

- Removidos aliases de tipo:
  - `SectionScaleSuggestion`
  - `SectionScaleReadingRegion`
  - `SectionScaleSuggestionSet`
- Removidos aliases de funcao:
  - `buildSectionScaleSuggestions`
  - `buildProposalScaleSuggestions`
  - `buildScaleReadingRegions`
  - `buildScaleLinearRoutes`
  - `buildProposalScaleSuggestionSets`

## Decisao

Esses nomes nao eram mais usados pelo codigo vivo e reforcavam o modelo antigo de "escala contextual". A compatibilidade relevante permanece nos pontos ainda consumidos: `contextualScaleCandidates` e os aliases de auditoria.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts`
- `npm run build`
