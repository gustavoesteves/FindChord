# F127 - Resolucao linear de notas-guia

## Fonte

`docs/theory/bert ligon - connecting chords with linear harmony.pdf`

A F126 trouxe as notas-guia para a leitura contextual. A F127 da o proximo
passo: mostrar como essas notas tendem a se mover.

## Problema

Listar `B` e `F` em `G7` ajuda, mas ainda e uma leitura estatica. A ideia de
conectar acordes exige mostrar destino: `B` sobe para `C`, `F` desce para `E`.

## Decisao

Cada candidata contextual passa a carregar `guideToneResolutions`, uma lista de
pares `origem->destino` estimados por proximidade cromatica ou diatonica curta.

No caso de `G7 -> C`:

```text
B->C
F->E
```

## Efeito na UI

O detalhe `Ver leitura` mostra:

- notas-guia;
- alvos;
- resolucoes;
- tensoes;
- cobertura melodica;
- notas a evitar.

## Limite atual

Ainda nao ha geracao de linha improvisada. O sistema apenas explicita os pontos
de conducao que podem sustentar uma linha futura.
