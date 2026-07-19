# F173 - Cor de tonica 6/6-9 sustentada pela melodia

## Objetivo

Refinar o caminho melodia-only para nao tratar toda tonica maior como acorde seco quando a propria melodia sustenta a sexta ou a nona.

O caso-guia veio da F172: `Air mail special.musicxml` mostrou varias tonicas `6/6-9` na referencia. A regra implementada, porem, nao depende da obra; ela olha apenas para centro tonal, funcao de tonica e notas estruturais da melodia.

## Ajuste

Na expansao diatonica usada tambem pela estrategia de dominantes secundarias:

- se a melodia do compasso traz a sexta maior sobre a tonica, usa `I6`;
- se traz sexta maior e nona, usa `I6/9`;
- caso contrario, preserva `I`.

## Resultado no caso-guia

Em `Air mail special.musicxml`, o caminho melodia-only passou a produzir `Ab6` em regioes de tonica sustentadas pela sexta:

```text
antes: ... 4:Ab ... 8:Ab
depois: ... 4:Ab6 ... 8:Ab6
```

A referencia continua mais rica em densidade e contorno:

```text
2:Ab6, Fm7 | 3:Bbm7, Eb7 | 4:Ab6, Fm7 | ...
```

Isso confirma que a melhoria e parcial e saudavel: o motor nao copiou a partitura, mas aproximou a cor harmonica quando a melodia autorizou.

## Teste

Foi adicionado um teste de estrategia para garantir que `C6` aparece em regiao de tonica quando a melodia sustenta `A` em `C major`, sem produzir nomes exagerados como `Cmaj13`.

## Proximo passo sugerido

Separar duas camadas futuras:

1. cor de repouso (`I6`, `I6/9`) guiada pela melodia;
2. densidade temporal de referencia (`I6 -> vi7`, ii-V recorrente), que exige outra regra e nao deve ser confundida com simples coloracao da tonica.
