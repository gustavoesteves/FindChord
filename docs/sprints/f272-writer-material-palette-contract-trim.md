# F272 - Enxugamento do contrato da paleta

## Objetivo

Remover dados duplicados da paleta de `Materiais do acorde`.

## Alteracoes

- `WriterMaterialPaletteItem` deixa de duplicar `sourceName`, `sourceType`, `sourceNotes` e `sourcePreview`.
- Componentes e modelos passam a usar `item.source` como fonte unica.
- Fixtures e testes foram atualizados para o contrato menor.

## Resultado

A paleta fica mais simples e menos propensa a divergencias entre a fonte musical real e campos derivados mantidos em paralelo.
