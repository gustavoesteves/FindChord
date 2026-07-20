# F331 - Limpeza do contrato de regioes de material

## Objetivo

Remover campos legados de escala do contrato `SectionMaterialReadingRegion`.

## Alteracoes

- `SectionMaterialReadingRegion` deixa de expor `scaleName` e `scaleType`.
- A regiao passa a depender apenas de `sourceName` e `sourceType`.
- O teste temporal de regioes foi atualizado para validar `sourceType`.
- O teste tambem garante que `scaleName` e `scaleType` nao retornem ao contrato.

## Decisao

As regioes do `Improviso` agrupam leituras de material, nao listas de escalas. O material pode nascer de escala, arpejo, pentatonica, ciclo simetrico ou vocabulario curado; por isso o nome correto do contrato e `source`.

Os aliases publicos `SectionScale*` e `buildScale*` permanecem por compatibilidade, mas nao devem guiar novos usos.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts`
