# F286 - Presenter dos labels de acao

## Objetivo

Tornar testavel o mapeamento entre intencao musical e verbo do card em `Materiais do acorde`.

## Alteracoes

- `actionLabelForWriterMaterialIntent` passa a ser exportado.
- O builder da paleta usa esse presenter explicitamente.
- Teste cobre todos os labels de acao: dentro, funcional, cor, tensao e fora.

## Resultado

Mudancas futuras na linguagem dos cards podem ser feitas com um contrato direto e coberto por teste.
