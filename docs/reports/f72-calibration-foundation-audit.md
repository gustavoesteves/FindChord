# F72 - Auditoria da base harmonica

Esta auditoria pega apenas os casos de `Centro de referencia` e `Harmonia basica` da F71.
O objetivo e confirmar se a primeira resposta do Harmonizar esta musicalmente estavel antes de refinarmos cromatismo, baixo e ranking.

## Leitura geral

- Casos auditados: 6
- Base aprovada: 6
- Revisao musical: 0
- Trabalho de motor: 0
- Sem proposta: 0
- Erro de parse: 0

## Resultado por musica

| Arquivo | Tipo | Status | Funcao | Raiz | Proposta | Acao |
| --- | --- | --- | ---: | ---: | --- | --- |
| `a-010-After you.musicxml` | Centro de referencia | base aprovada | 100% | 0% | Bb6 / Bdim7 / C7 / F7 | Usar como ancora positiva da calibragem. |
| `a-006-African flower.musicxml` | Centro de referencia | base aprovada | 100% | 100% | Fmaj7 / Fm7/Bb / Fmaj7/C / Fm7 | Usar como ancora positiva da calibragem. |
| `a-013-Ain't it the truth.musicxml` | Centro de referencia | base aprovada | 100% | 100% | Ebmaj7 / Bb7/Ab / Ebmaj7/Bb / Ebmaj7 | Usar como ancora positiva da calibragem. |
| `b-032-Blue in green.musicxml` | Harmonia basica | base aprovada | 100% | 100% | Bbmaj7 / F7/Eb / Bb6/F / Bbmaj7 | Usar como ancora positiva da calibragem. |
| `f-033-Freight trane.musicxml` | Harmonia basica | base aprovada | 50% | 100% | C13 \| C13 \| Bb13 \| C13 \| Bb13 \| C13sus4 / C13 \| Bb13sus4 / Bb13 \| C13sus4 / C13 | Usar como ancora positiva da calibragem. |
| `e-011-End of a love affair.musicxml` | Harmonia basica | base aprovada | 100% | 0% | F#maj7 / A#dim7/G / B#dim7/G / G#7 | Usar como ancora positiva da calibragem. |

## Evidencias

### After you

- Arquivo: `a-010-After you.musicxml`
- Comparacao: alinhada; funcao 100%, raiz 0%
- Causas: function-preserved-root-changed, global-center-aligned-local-mismatch, root-drift
- 1/1 compassos preservam a função aparente da referência.
- 0/1 compassos mantêm a mesma raiz da referência.
- A proposta converge funcionalmente com a harmonia de referência.

### African flower

- Arquivo: `a-006-African flower.musicxml`
- Comparacao: alinhada; funcao 100%, raiz 100%
- 1/1 compassos preservam a função aparente da referência.
- 1/1 compassos mantêm a mesma raiz da referência.
- A proposta converge funcionalmente com a harmonia de referência.

### Ain't it the truth

- Arquivo: `a-013-Ain't it the truth.musicxml`
- Comparacao: alinhada; funcao 100%, raiz 100%
- 1/1 compassos preservam a função aparente da referência.
- 1/1 compassos mantêm a mesma raiz da referência.
- A proposta converge funcionalmente com a harmonia de referência.

### Blue in green

- Arquivo: `b-032-Blue in green.musicxml`
- Comparacao: alinhada; funcao 100%, raiz 100%
- 1/1 compassos preservam a função aparente da referência.
- 1/1 compassos mantêm a mesma raiz da referência.
- A proposta converge funcionalmente com a harmonia de referência.

### Freight trane

- Arquivo: `f-033-Freight trane.musicxml`
- Comparacao: alinhada; funcao 50%, raiz 100%
- Causas: apparent-function-preserved, local-center-aligned-global-mismatch
- 4/8 compassos preservam a função aparente da referência.
- 8/8 compassos mantêm a mesma raiz da referência.
- A proposta converge com a harmonia de referência dentro do idioma indicado.

### End of a love affair

- Arquivo: `e-011-End of a love affair.musicxml`
- Comparacao: alinhada; funcao 100%, raiz 0%
- Causas: function-preserved-root-changed, global-center-aligned-local-mismatch, root-drift
- 1/1 compassos preservam a função aparente da referência.
- 0/1 compassos mantêm a mesma raiz da referência.
- A proposta converge funcionalmente com a harmonia de referência.

## Proxima acao

Promover ajustes de motor apenas para casos marcados como `trabalho de motor`. Casos em `revisao musical` devem ser conferidos por escuta ou comparacao com a partitura antes de alterar regras.

