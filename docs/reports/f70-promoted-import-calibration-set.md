# F70 - Conjunto de calibragem do corpus importado

Este relatorio escolhe um subconjunto pequeno das musicas importadas para calibrar o Harmonizar sem depender de olhar os 181 arquivos de uma vez.

## Leitura geral

- Corpus de entrada: 181 arquivos auditados na F69
- Casos selecionados: 24
- Categorias: 8

## Casos selecionados

### Referencia forte

- Pergunta: Quando a cifra do autor e muito presente, o centro escolhido e a proposta fazem sentido musical?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `a-010-After you.musicxml` | Bb major | referencia | 14 | 8 | Bb6 / Bdim7 / C7 / F7 |
| `a-006-African flower.musicxml` | F minor | referencia | 13 | 8 | Fmaj7 / Fm7/Bb / Fmaj7/C / Fm7 |
| `a-013-Ain't it the truth.musicxml` | Eb major | referencia | 12 | 8 | Ebmaj7 / Bb7/Ab / Ebmaj7/Bb / Ebmaj7 |

### Melodia primeiro

- Pergunta: Quando a melodia sustenta a escolha, a harmonia basica evita excesso de dependencia da referencia?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `b-032-Blue in green.musicxml` | Bb major | melodia | 11 | 8 | Bbmaj7 / F7/Eb / Bb6/F / Bbmaj7 |
| `f-033-Freight trane.musicxml` | C major | melodia | 9 | 8 | C13 \| C13 \| Bb13 \| C13 \| Bb13 \| C13sus4 / C13 \| Bb13sus4 / Bb13 \| C13sus4 / C13 |
| `e-011-End of a love affair.musicxml` | F# major | melodia | 5 | 8 | F#maj7 / A#dim7/G / B#dim7/G / G#7 |

### Muitas propostas

- Pergunta: Quando ha muitas rotas possiveis, o ranking escolhe a proposta mais clara?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `d-025-Donna Lee.musicxml` | C major | referencia | 12 | 8 | Cmaj7 / Fmaj7 \| G7 / C6 |
| `f-015-Firm roots.musicxml` | C major | referencia | 14 | 7 | Cmaj7 / G7/F / Cmaj7/G / Cmaj7 |
| `a-052-Ask me now.musicxml` | C major | referencia | 12 | 7 | Cmaj7 / Dm7/F / Gm7 / Cmaj7 |

### Cromatico linear

- Pergunta: Quando o motor escolhe cromatismo, isso soa como condução funcional ou como artificio?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `c-034-Crazeology.musicxml` | Eb major | referencia | 10 | 8 | Ebmaj7 / Adim7/E / F7 / D7/Bb |
| `d-017-Detour ahead.musicxml` | Bb major | referencia | 10 | 8 | Bbmaj7 / Ddim7/B / Ddim7/B \| Am7b5/C |
| `e-002-E.S.P..musicxml` | C major | referencia | 9 | 8 | Cmaj7 / Cdim7/Db / D7 / G#dim7/G |

### Contraponto de baixo

- Pergunta: A conducao do baixo esta ajudando a frase ou criando complexidade antes da hora?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `b-037-Blueberry hill.musicxml` | D minor | referencia | 10 | 8 | Dm7 / Gm6 / E7/G# / A7 / Dmaj7 |
| `a-039-Another Time.musicxml` | Bb major | referencia | 9 | 8 | Bbmaj7 / F7/Eb / C7/E / A7/F / G#dim7/Bb |
| `e-008-Eighty one.musicxml` | F minor | referencia | 9 | 8 | Fmaj9 / Bbmaj7 / G7/B / E7/C / Fmaj9 |

### Centros menores

- Pergunta: O sistema separa bem menor funcional, menor modal e centro local sugerido pela referencia?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `b-035-Blue room.musicxml` | C minor | referencia | 10 | 8 | Cmaj7 / G7/F / Cmaj7/G / Cmaj7 |
| `b-043-Boplicity.musicxml` | C minor | referencia | 8 | 8 | Abmaj7 \| Cm6/G \| Cm \| Cm \| Fm7 \| Fm7 \| Dm7b5 \| Cm |
| `c-006-Casa forte.musicxml` | D minor | referencia | 8 | 8 | Dmaj7 / Gmaj7 / Fmaj7/E / A7 / Dmaj7 |

### Formas curtas

- Pergunta: Em musicas curtas, o app encontra uma janela representativa sem superinterpretar pouca informacao?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `a-053-At last.musicxml` | F major | referencia | 8 | 8 | Fmaj7 / Gm7/Bb / Fmaj7(#11)/C / Fmaj7 |
| `c-003-Caravan.musicxml` | F major | referencia | 6 | 8 | Fmaj7 / Bbmaj7 / C13 / Fmaj9 |
| `b-031-Blue Daniel.musicxml` | Bb major | referencia | 6 | 8 | Edim7/Bb / Ebmaj7 / Dm7/C / F7 / Bbmaj7 |

### Alta densidade harmonica

- Pergunta: Em cifras densas, a proposta gerada permanece legivel para o usuario?

| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |
| --- | --- | --- | ---: | ---: | --- |
| `b-026-Black Orpheus.musicxml` | Eb major | referencia | 8 | 8 | Ebmaj7 / Fm7/Ab / Bb7 / Ebmaj7 |
| `c-013-Chameleon.musicxml` | C major | referencia | 7 | 8 | C6 / Fmaj7 / C6/G / Cmaj7 |
| `a-027-All of you.musicxml` | A minor | referencia | 5 | 8 | Amaj7 / C#dim7/Bb / C#dim7/Bb / B#dim7/B |

## Como usar

- Primeiro, ouvir/inspecionar os casos de `Referencia forte` e `Melodia primeiro` para calibrar o caminho basico.
- Depois, usar `Cromatico linear`, `Contraponto de baixo` e `Muitas propostas` para testar ranking e linguagem de explicacao.
- Por fim, usar `Centros menores`, `Formas curtas` e `Alta densidade harmonica` como testes de borda musical.

