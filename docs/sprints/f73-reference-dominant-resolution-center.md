# F73 - Centro por resolucao dominante da referencia

## Objetivo

Corrigir `After you`, que estava sendo harmonizada em F maior pela melodia, apesar da referencia apontar uma chegada funcional em Bb maior.

O problema teorico era que a analise da harmonia de referencia reconhecia bem ii-V-I, mas nao pontuava resolucoes V-I locais. Assim, uma cadeia como `C7 | F7 | Bb6` nao tinha forca suficiente para disputar com o centro melodico.

## Mudanca

A analise de referencia agora reconhece:

- `V-I local aponta X maior`
- `V-i local aponta X menor`

Essas evidencias entram na escolha de centro antes da geracao de propostas.

## Caso calibrado

Em `a-010-After you.musicxml`, a janela inicial contem uma cadeia de dominantes que chega em `Bb6`.

Antes:

- Centro: F maior por melodia
- Proposta: `F6/9 | F6/9 | F6/9 | F6/9 | F6/9 | C7/E | F6/9 | F`
- Status F72: trabalho de motor

Depois:

- Centro: Bb maior por referencia
- Proposta: `Bb6 / Bdim7 / C7 / F7`
- Status F72: base aprovada

## Resultado no lote F72

- Base aprovada: 5
- Revisao musical: 1
- Trabalho de motor: 0

## Observacao

A grafia `Bdim7/Cb` foi removida no passo seguinte: o baixo enarmonico redundante agora e limpo antes da apresentacao da cifra.
