# F291 - Factory de teste para materiais do acorde

## Objetivo

Reduzir duplicacao na montagem de `WriterMaterialPaletteItem` em testes.

## Alteracoes

- Criado `scripts/helpers/writerMaterialTestFactory.ts`.
- Specs de rotas, foco e acao passam a usar `writerMaterialTestItem`.
- O helper deriva `actionLabel` pelo presenter real da paleta.

## Resultado

Os testes ficam menores e mais alinhados ao contrato de producao dos materiais do acorde.
