# F122 - Intencao musical nas leituras de improviso

## Problema

A F121 separou a aba `Improviso` e permitiu escolher qual harmonia sera lida.
Isso corrigiu a mistura entre progressoes diferentes, mas as escalas ainda
apareciam como uma lista quase equivalente.

Musicalmente isso e fraco: uma escala interna, uma cor funcional e uma tensao
alterada nao cumprem o mesmo papel.

## Decisao

Cada candidata contextual de escala passa a carregar uma `intent`:

- `inside`: leitura interna/segura, proxima da funcao e das notas do acorde;
- `functional`: cor funcional, ainda coerente com o centro ou com a funcao do
  acorde;
- `tension`: leitura de tensao, especialmente em dominantes, diminutas e
  alteradas;
- `outside`: reservado para cromatismos mais externos quando essa camada for
  implementada.

## Exemplo

Em `G7 -> C`:

- `G mixolydian` e uma leitura interna;
- `G lydian dominant` e uma tensao funcional;
- `G altered` e uma tensao alterada.

Em `Cmaj7`:

- `C major` e leitura interna;
- `C lydian` e cor funcional.

## Efeito na UI

A aba `Improviso` continua organizada por harmonia avaliada e por compasso. A
leitura principal e as cores alternativas passam a exibir a intencao musical da
escala, evitando que o usuario leia todas as opcoes como equivalentes.

## Limite atual

Ainda nao decidimos automaticamente quando uma leitura deve durar um acorde, um
compasso ou uma regiao inteira. Esse e o proximo bloco natural: transformar a
leitura acorde-a-acorde em leitura por frase quando a harmonia permitir.
