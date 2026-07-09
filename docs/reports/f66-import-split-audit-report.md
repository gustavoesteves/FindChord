# F66 - Auditoria do staging importado

Este relatorio avalia os arquivos desmembrados em `docs/imports/split` antes de qualquer promocao para `docs/musics`.

## Leitura geral

- Arquivos auditados: 213
- Candidatos tecnicos: 181
- Precisam revisao: 32
- Erro de parse: 0
- Cifras MusicXML brutas: 8185
- Cifras lidas pelo parser: 8144
- Notas lidas: 25020

## Por volume

| Volume | Arquivos | Candidatos | Revisao | Parse erro | Notas | Cifras |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 50 | 44 | 6 | 0 | 6327 | 2163 |
| B | 47 | 39 | 8 | 0 | 5025 | 1729 |
| C | 34 | 29 | 5 | 0 | 3708 | 1134 |
| D | 28 | 26 | 2 | 0 | 3400 | 1117 |
| E | 19 | 16 | 3 | 0 | 2044 | 730 |
| F | 35 | 27 | 8 | 0 | 4516 | 1271 |

## Melhores candidatos tecnicos

| Arquivo | Compassos | Notas | Cifras | Cifras unicas | Score | Amostra |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `f-036-Friends and strangers.musicxml` | 43 | 279 | 59 | 25 | 94 | A, A/G, Ab7, Am7, Asus4, B7 |
| `d-009-Dear John.musicxml` | 35 | 277 | 33 | 13 | 94 | A7(#9), A7(b9), Bb(#11)/A, Bb7(b5), C7, C9sus4 |
| `f-013-Fever.musicxml` | 54 | 267 | 52 | 16 | 93 | A13, Ab13, Bb13, Bb7, Bb7(#11,#9), Bb7(#9) |
| `a-049-Asa.musicxml` | 29 | 260 | 53 | 11 | 92 | A7alt, Bb13, Bbmaj7, C9, D7(#9), Dm7 |
| `a-048-As time goes by.musicxml` | 29 | 254 | 53 | 11 | 91 | A7alt, Bb13, Bbmaj7, C9, D7(#9), Dm7 |
| `d-015-Desafinado.musicxml` | 55 | 237 | 78 | 32 | 89 | Ab13, Am, Am7, Am7(b5), B7, B7alt |
| `a-015-Airegin.musicxml` | 34 | 224 | 54 | 13 | 88 | Ab6, Ab6/Eb, Ab7, Ab°, Bbm7, Db6 |
| `d-023-Dolphin dance.musicxml` | 39 | 220 | 40 | 20 | 87 | Ab, Ab°, Bb13(b9)/Eb, Bb7, Bbm7, C/E |
| `c-015-Chega de saudade.musicxml` | 84 | 215 | 69 | 38 | 86 | A, A13sus4, A7, A7(#5), A9sus4, Ab9 |
| `c-008-Cedar's blues.musicxml` | 33 | 214 | 33 | 15 | 86 | Ab7, B7, Bb, C7, Cm7, Cm7(b5) |
| `a-004-Actual proof.musicxml` | 36 | 214 | 21 | 14 | 85 | Am7, Asus4(7), Bb, Bm7, D, D7 |
| `f-024-For all we know.musicxml` | 35 | 196 | 61 | 12 | 84 | A7, Ab7, B7, Bb7, C7, D7sus4 |
| `c-026-Confessin' that i love you.musicxml` | 33 | 196 | 48 | 24 | 84 | A7, Ab7, Am7(b5), B7, Bb, Bb7 |
| `b-007-Basin street blues.musicxml` | 37 | 188 | 58 | 18 | 83 | Ab7(#5), Bb7, Bb7(#5), C7, C7(#5), C7(b5) |
| `f-035-Fried bananas.musicxml` | 27 | 186 | 36 | 7 | 83 | A, Am7, Asus4, C, Dm7, Em7 |
| `f-010-Feels so good.musicxml` | 66 | 179 | 80 | 30 | 82 | A7(b5), Ab, Ab6, Ab7, Ab9, Am7(b5) |
| `c-028-Coquette.musicxml` | 42 | 180 | 40 | 24 | 82 | A7, A7(b13), Abdim, Abdim7, Am, Am/G |
| `f-033-Freight trane.musicxml` | 29 | 168 | 51 | 20 | 81 | A7alt, Ab(#5)/G, B13, B13sus4, Bb13, Bb13sus4 |
| `f-020-Fly me to the moon.musicxml` | 29 | 168 | 49 | 16 | 81 | Ab, B7, Bb7, Bb7(#9), Cm, E7/B |
| `b-021-Black and tan fantasy.musicxml` | 36 | 163 | 52 | 24 | 80 | A7, Ab7, Ab7alt, Ab9sus4(7,9), Absus4(7,9), B9 |
| `b-003-Bag's groove.musicxml` | 32 | 167 | 40 | 14 | 80 | A7, Bb, C7, Cm, D, D7 |
| `d-017-Detour ahead.musicxml` | 26 | 166 | 40 | 15 | 80 | Ab7, Am7, Bb, Bb7, C7, Cm7 |
| `a-046-April joy.musicxml` | 36 | 163 | 37 | 17 | 80 | Abm/Bb, Ab°, C7(b9), Cm, Cm7, D7 |
| `a-037-Angel eyes.musicxml` | 41 | 160 | 34 | 14 | 80 | A7, B7, Bm7, C#7, C#7alt, C#m7 |
| `d-029-Don't take your love from me.musicxml` | 25 | 164 | 31 | 20 | 80 | Ab7, Abm9, Ab°, A°, Bb7, Bb° |
| `f-014-Filthy McNasty.musicxml` | 46 | 164 | 28 | 17 | 80 | Abm11, Am, Bb, Bb7, Bbm, C |
| `a-005-Affirmation.musicxml` | 41 | 165 | 23 | 11 | 80 | Ab7, Abm7, Bb7, Bbm, Cb7, D7 |
| `b-002-Baby It's Cold Outside.musicxml` | 25 | 177 | 19 | 4 | 80 | Bb7, C7, F7, Gm7 |
| `e-011-End of a love affair.musicxml` | 34 | 154 | 59 | 8 | 79 | B7, C#7, D#7, D7, Db7, E7 |
| `e-016-Everybody loves my baby.musicxml` | 28 | 157 | 59 | 29 | 79 | A7alt, Ab9, B7, Bb, Bb6, Bb7(#9) |

## Itens para revisao

Total de itens com revisao: 32. A tabela abaixo mostra os primeiros 40 por prioridade tecnica.

| Arquivo | Status | Motivo |
| --- | --- | --- |
| `a-003-A fine romance.musicxml` | revisao | parser leu 91% das cifras MusicXML |
| `a-016-Air mail special.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `a-038-Another star.musicxml` | revisao | 3 cifras ambiguas no resolvedor |
| `a-041-Antigua.musicxml` | revisao | 2 cifras ambiguas no resolvedor |
| `a-050-Asa.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `a-057-Avalon.musicxml` | revisao | 3 cifras ambiguas no resolvedor |
| `b-006-Barbados.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `b-015-Bird feather.musicxml` | revisao | parser leu 94% das cifras MusicXML |
| `b-016-Birdland.musicxml` | revisao | parser leu 94% das cifras MusicXML |
| `b-023-Black narcissus.musicxml` | revisao | 2 cifras ambiguas no resolvedor |
| `b-040-Body and soul.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `b-044-Born to the blue.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `b-045-Bossa Dorado.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `b-049-Boy next door.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `c-007-Catch me.musicxml` | revisao | 2 cifras ambiguas no resolvedor |
| `c-011-Ceora.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `c-014-Cheek to cheek.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `c-019-Chicken feathers.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `c-023-Come sunday.musicxml` | revisao | parser leu 88% das cifras MusicXML |
| `d-007-Dat dere.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `d-027-Don't get around much anymore.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `e-004-East of the sun.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `e-012-Epistrophy.musicxml` | revisao | parser leu 85% das cifras MusicXML |
| `e-017-Everythong happens to me.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `f-002-F Blues Tootsie.musicxml` | revisao | 2 cifras ambiguas no resolvedor |
| `f-003-Fables of Faubus.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `f-012-Festive minor.musicxml` | revisao | parser leu 89% das cifras MusicXML |
| `f-016-Five brothers.musicxml` | revisao | parser leu 92% das cifras MusicXML |
| `f-022-Fools rush in.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `f-027-Forest flower.musicxml` | revisao | 1 cifras ambiguas no resolvedor |
| `f-029-Four brothers.musicxml` | revisao | parser leu 95% das cifras MusicXML |
| `f-031-Freddie the freeloader.musicxml` | revisao | parser leu 50% das cifras MusicXML |

## Padroes de cifra fora do contrato

| Padrao | Ocorrencias | Exemplos |
| --- | ---: | --- |
| (b9) | 3 | Ab(b9), C#(b9), G(b9) |
| (add9)(#11) | 2 | Bb(add9)(#11), G(add9)(#11) |
| m(b6) | 2 | Dm(b6), Bbm(b6) |
| m7(#11) | 2 | Gm7(#11), Ebm7(#11) |
| n | 2 | An |
| pedal | 2 | Ebpedal, Fpedal |
| (#11,b9) | 1 | Eb(#11,b9) |
| (#9) | 1 | Db(#9) |
| (13) | 1 | Db(13) |
| (2) | 1 | G(2) |
| (b5,#5,b9,#9) | 1 | Ab(b5,#5,b9,#9) |
| (b6) | 1 | Gb(b6) |
| (b7) | 1 | E(b7) |
| (b9,#9) | 1 | D(b9,#9) |
| * | 1 | F* |
| 5(#5) | 1 | G5(#5) |
| di | 1 | Adi |
| ft | 1 | Fft/C |
| m(b7) | 1 | Dm(b7) |
| m7(b5)(9,11) | 1 | F#m7(b5)(9,11) |
| m7(b5)(9) | 1 | Em7(b5)(9) |
| m9(#5) | 1 | Bbm9(#5) |
| mM7(9) | 1 | DmM7(9) |
| r.fill | 1 | Dr.fill |
| reak | 1 | Break |
| sus4(1,3,7) | 1 | Fsus4(1,3,7) |

## Proxima acao

Usar os melhores candidatos tecnicos como fila de escuta/curadoria. Depois disso, promover apenas um subconjunto para `docs/musics`, mantendo o restante em staging.

