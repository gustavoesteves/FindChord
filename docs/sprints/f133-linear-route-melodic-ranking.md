# F133 - Ranking melodico das rotas lineares

## Problema

A F132 marcou o encaixe melodico das rotas lineares, mas a apresentacao ainda
seguia a ordem cronologica. Isso podia deixar uma rota neutra aparecer antes de
uma rota claramente apoiada pela melodia.

## Decisao

`buildScaleLinearRoutes` passa a ordenar rotas por encaixe melodico:

1. `aligned`;
2. `neutral`;
3. `caution`.

Dentro do mesmo nivel, a ordem do trecho e preservada por compasso.

## Efeito musical

Quando duas cadencias oferecem material parecido, a UI prioriza a que ja tem
contato com a melodia real. Por exemplo, se uma dominante traz a melodia em `B`
e a rota oferece:

```text
B->C / F->E
```

essa rota sobe na apresentacao porque a propria frase confirma parte do
movimento.

## Limite

Rotas `caution` ainda nao sao descartadas. Elas apenas ficam atras das rotas
mais apoiadas, porque uma ideia com conflito melodico pode continuar util como
alternativa de estudo ou rearmonizacao.

## Proximo passo

O proximo refinamento pode aplicar esse ranking tambem na escolha das leituras
principais por acorde, nao apenas na agregacao de rotas.
