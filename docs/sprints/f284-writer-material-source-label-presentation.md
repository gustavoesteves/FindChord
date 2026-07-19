# F284 - Label da fonte como apresentacao

## Objetivo

Remover texto de apresentacao do contrato da paleta em `Materiais do acorde`.

## Alteracoes

- `WriterMaterialPaletteItem` deixa de expor `sourceLabel`.
- `WriterMaterialIdeaCard` passa a montar `Base: {source.name}` diretamente.
- Fixtures e expectativas foram atualizadas para o contrato menor.

## Resultado

A paleta fica mais musical e menos acoplada ao texto visual do card.
