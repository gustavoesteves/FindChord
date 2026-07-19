# F283 - Contrato dos labels de acao

## Objetivo

Evitar que os titulos dos cards em `Materiais do acorde` dependam de strings soltas.

## Alteracoes

- Criado `WriterMaterialActionLabel`.
- `WriterMaterialPaletteItem.actionLabel` passa a usar esse contrato.
- Os labels de acao passam a ser derivados de um mapa tipado por intencao musical.

## Resultado

As intencoes dos cards e seus verbos de acao ficam sincronizados, reduzindo risco de divergencia em futuras mudancas de linguagem.
