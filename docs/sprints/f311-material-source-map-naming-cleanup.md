# F311 - Limpeza de nomes dos mapas-fonte

## Objetivo

Remover residuos de nomenclatura interna antiga no contrato de `MaterialSourceMap`.

## Alteracoes

- `materialSourceMapFor` passa a usar `sourceType` internamente.
- A API legada de escalas compativeis permanece como adaptador.
- O comportamento musical dos mapas-fonte nao foi alterado.

## Decisao

O modulo `Escrever` deve falar em materiais musicais navegaveis, nao em uma lista generica de escalas compativeis. A compatibilidade antiga ainda existe para evitar quebra de chamadas, mas nao deve guiar novas implementacoes.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/material-source-maps.spec.ts scripts/writer-material-screen-model.spec.ts scripts/local-chord-vamp-materials.spec.ts`
