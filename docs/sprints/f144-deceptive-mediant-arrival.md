# F144 - Chegada deceptiva cromatica

## Objetivo

Refinar o caminho progressivo do Harmonizar a partir da ultima lacuna pratica da auditoria do exemplo do Almada: deslocamento tonal por mediantes e chegada deceptiva.

## Problema

A comparacao F79 ainda marcava o exemplo `m` como lacuna. O motor tinha diminutos, dominantes alteradas, SubV e funcao aparente, mas nao conseguia montar a familia:

`Eb7M -> Em7(b5) -> F6 -> Fm6 -> D7(b5)/F# -> G7 -> G#º -> Am7`

O risco era resolver isso como uma copia literal em C. A regra precisava nascer de graus relativos para continuar coerente em outros centros.

## Alteracao

Foi adicionada a proposta `Estratégia — Chegada deceptiva cromática`.

A regra e intervalar em tom maior:

`bIIImaj7 -> iiiø -> IV6 -> ivm6 -> II7(b5)/#IV -> V7 -> #Vdim7 -> vi7`

No exemplo em C, isso gera:

`Ebmaj7 -> Em7b5 -> F6 -> Fm6 -> D7(b5)/F# -> G7 -> G#dim7 -> Am7`

## Criterios

- so entra em modo maior;
- exige frase de quatro compassos;
- exige cobertura melodica suficiente;
- exige que o acorde final `vi7` sustente a melodia do ultimo compasso;
- fica no caminho progressivo, com `routeProfile` cromatico/radical pela propria distancia harmonica.

## Resultado no Almada

`docs/reports/f79-almada-example-comparison.md` foi atualizado:

- Propostas geradas: 15
- Exemplos cobertos: 4
- Familias parcialmente contempladas: 8
- Lacunas praticas de vocabulario: 0

O exemplo `m` passou a ser coberto pela nova proposta, com 88% de sobreposicao de cifras, 100% de recursos harmonicos e 93% de afinidade geral.

## Proximo refinamento

Agora que a auditoria Almada nao tem mais lacunas praticas de vocabulario, o proximo bloco deve sair do "temos o acorde?" para "quando esta escolha e musicalmente justificada?".

Prioridades:

- graduar mistura modal densa;
- separar cadencia plagal menor de cromatismo decorativo;
- controlar movimentos por mediantes para nao virarem receita fixa;
- preservar o fundamento I-IV-V como leitura inicial antes das rearmonizacoes progressivas.
