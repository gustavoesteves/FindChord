# F172 - Triagem de vocabulario quando a referencia enriquece a rota

## Objetivo

Separar, no corpus real, os casos em que melodia e referencia permanecem no mesmo centro, mas a harmonia escrita pelo autor traz uma rota mais rica do que a proposta melodia-only.

O objetivo nao e criar excecoes por musica. Cada obra funciona como lente para identificar familias gerais de vocabulario harmonico.

## Ajuste

O relatorio F39 passou a mostrar, na triagem de mesmo centro, um resumo do vocabulario da referencia na janela auditada:

```text
vocabulario da referencia: 2 ii-V, 1 dominantes aplicadas, 2 dominantes primarias, 4 tonicas 6/6-9
```

Essa leitura usa a auditoria aplicada ja existente, que resume:

- celulas ii-V;
- dominantes aplicadas e primarias;
- SubV;
- diminutos resolvidos;
- emprestimos modais;
- cadencias plagais menores;
- tonicas 6/6-9;
- densidade de baixos indicados.

## Resultado no corpus principal

Na triagem atual:

```text
Air mail special.musicxml: 2 ii-V, 1 dominante aplicada, 2 dominantes primarias, 4 tonicas 6/6-9
autum leaves.musicxml: 1 ii-V, 1 dominante primaria
affirmation.musicxml: funcional direto
afro blue.musicxml: funcional direto
```

Isso sugere duas linhas de trabalho:

1. Quando ha formulas claras, investigar se o motor melodia-only deveria gerar uma versao equivalente sem depender da cifra escrita.
2. Quando o vocabulario e funcional direto, tratar o enriquecimento como contorno, baixo, densidade ou distribuicao temporal, nao como nova regra harmonica.

## Proximo passo sugerido

Usar os casos de mesmo centro como fila de refinamento geral:

- primeiro, ii-V e tonicas 6/6-9 em `Air mail special`;
- depois, ii-V cadencial em `autum leaves`;
- por fim, casos de contorno/densidade em `affirmation` e `afro blue`.
