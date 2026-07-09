# F102 - Lacuna de geracao para chegadas laterais

## Contexto

A F101 mostrou que a regra F100 nao aparece nas propostas reais do corpus atual.

Antes de criar novas rotas cromaticas, era preciso descobrir se o gerador falha em produzir esses candidatos ou se os casos de referencia nem passam pela janela harmonizavel escolhida.

## Decisao

Criar `scripts/audit-side-arrival-generation-gap.ts`.

A auditoria cruza os casos F98 com:

- a janela harmonizavel escolhida por `findHarmonizableWindow`;
- as propostas geradas nessa janela;
- a presenca da raiz da chegada lateral no compasso do caso ou no compasso seguinte.

## Resultado

Nos 8 casos F98:

- casos dentro da janela harmonizavel: 1
- casos com candidato lateral gerado: 1
- casos fora da janela harmonizavel: 7

O unico caso coberto pela janela foi `Dolphin Dance`, e ali o gerador ja produziu uma chegada lateral compatível via `Estratégia — Gramática funcional ii-V`.

## Leitura

O gargalo principal nao e, neste momento, o ranking F100 nem a geracao de candidato lateral.

O gargalo e a selecao/cobertura de janela:

- a maior parte dos casos laterais da referencia aparece fora da janela escolhida pelo pipeline;
- portanto, o sistema nao tem oportunidade de gerar ou ranquear alternativas para eles;
- gerar mais cromatismo agora poderia nao afetar esses casos reais.

## Proximo refinamento

Investigar janelas multiplas por musica, em vez de apenas a melhor janela harmonizavel.

A proxima auditoria deve responder:

- quantas janelas de cada musica cobrem os compassos F98;
- se essas janelas geram propostas validas;
- se o ranking se comporta bem quando o caso lateral esta de fato dentro da janela.
