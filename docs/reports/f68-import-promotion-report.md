# F68 - Promocao do staging importado

Este relatorio registra a separacao operacional do staging gerado pelos livros importados.

## Resultado

- Candidatos promovidos: 181
- Arquivos para revisao manual: 32
- Destino dos candidatos: `docs/musics/imported-real-book`
- Destino da revisao: `docs/imports/review`

## Decisao

Os candidatos tecnicos foram copiados para uma pasta propria dentro de `docs/musics`, preservando o catalogo curado no topo de `docs/musics`.
Os arquivos de revisao continuam separados para inspecao manual, porque podem conter cifras duplicadas na mesma posicao, marcacoes de partitura exportadas como cifra ou vocabulario raro ainda fora do contrato.

## Arquivos promovidos por volume

| Volume | Arquivos |
| --- | ---: |
| A | 44 |
| B | 39 |
| C | 29 |
| D | 26 |
| E | 16 |
| F | 27 |

## Revisao manual por volume

| Volume | Arquivos |
| --- | ---: |
| A | 6 |
| B | 8 |
| C | 5 |
| D | 2 |
| E | 3 |
| F | 8 |

## Fila de revisao

| Arquivo | Motivo |
| --- | --- |
| `a-003-A fine romance.musicxml` | parser leu 91% das cifras MusicXML |
| `a-016-Air mail special.musicxml` | G(2): Cifra nao reconhecida pelo contrato Find Chord: (2) |
| `a-038-Another star.musicxml` | Ab(b9): Cifra nao reconhecida pelo contrato Find Chord: (b9); Db(#9): Cifra nao reconhecida pelo contrato Find Chord: (#9); Gb(b6): Cifra nao reconhecida pelo contrato Find Chord: (b6) |
| `a-041-Antigua.musicxml` | Bb(add9)(#11): Cifra nao reconhecida pelo contrato Find Chord: (add9)(#11); G(add9)(#11): Cifra nao reconhecida pelo contrato Find Chord: (add9)(#11) |
| `a-050-Asa.musicxml` | Ab(b5,#5,b9,#9): Cifra nao reconhecida pelo contrato Find Chord: (b5,#5,b9,#9) |
| `a-057-Avalon.musicxml` | Bbm9(#5): Cifra nao reconhecida pelo contrato Find Chord: m9(#5); Db(13): Cifra nao reconhecida pelo contrato Find Chord: (13); DmM7(9): Cifra nao reconhecida pelo contrato Find Chord: mM7(9) |
| `b-006-Barbados.musicxml` | F*: Cifra nao reconhecida pelo contrato Find Chord: * |
| `b-015-Bird feather.musicxml` | parser leu 94% das cifras MusicXML |
| `b-016-Birdland.musicxml` | parser leu 94% das cifras MusicXML |
| `b-023-Black narcissus.musicxml` | Em7(b5)(9): Cifra nao reconhecida pelo contrato Find Chord: m7(b5)(9); Gm7(#11): Cifra nao reconhecida pelo contrato Find Chord: m7(#11) |
| `b-040-Body and soul.musicxml` | Adi: Cifra nao reconhecida pelo contrato Find Chord: di |
| `b-044-Born to the blue.musicxml` | Dm(b6): Cifra nao reconhecida pelo contrato Find Chord: m(b6) |
| `b-045-Bossa Dorado.musicxml` | C#(b9): Cifra nao reconhecida pelo contrato Find Chord: (b9) |
| `b-049-Boy next door.musicxml` | Bbm(b6): Cifra nao reconhecida pelo contrato Find Chord: m(b6) |
| `c-007-Catch me.musicxml` | Ebpedal: Cifra nao reconhecida pelo contrato Find Chord: pedal; Fpedal: Cifra nao reconhecida pelo contrato Find Chord: pedal |
| `c-011-Ceora.musicxml` | Fft/C: Cifra nao reconhecida pelo contrato Find Chord: ft |
| `c-014-Cheek to cheek.musicxml` | E(b7): Cifra nao reconhecida pelo contrato Find Chord: (b7) |
| `c-019-Chicken feathers.musicxml` | Dr.fill: Cifra nao reconhecida pelo contrato Find Chord: r.fill |
| `c-023-Come sunday.musicxml` | parser leu 88% das cifras MusicXML |
| `d-007-Dat dere.musicxml` | Ebm7(#11): Cifra nao reconhecida pelo contrato Find Chord: m7(#11) |
| `d-027-Don't get around much anymore.musicxml` | Fsus4(1,3,7): Cifra nao reconhecida pelo contrato Find Chord: sus4(1,3,7) |
| `e-004-East of the sun.musicxml` | G5(#5): Cifra nao reconhecida pelo contrato Find Chord: 5(#5) |
| `e-012-Epistrophy.musicxml` | parser leu 85% das cifras MusicXML |
| `e-017-Everythong happens to me.musicxml` | Dm(b7): Cifra nao reconhecida pelo contrato Find Chord: m(b7) |
| `f-002-F Blues Tootsie.musicxml` | D(b9,#9): Cifra nao reconhecida pelo contrato Find Chord: (b9,#9); G(b9): Cifra nao reconhecida pelo contrato Find Chord: (b9) |
| `f-003-Fables of Faubus.musicxml` | An: Cifra nao reconhecida pelo contrato Find Chord: n |
| `f-012-Festive minor.musicxml` | An: Cifra nao reconhecida pelo contrato Find Chord: n |
| `f-016-Five brothers.musicxml` | parser leu 92% das cifras MusicXML |
| `f-022-Fools rush in.musicxml` | F#m7(b5)(9,11): Cifra nao reconhecida pelo contrato Find Chord: m7(b5)(9,11) |
| `f-027-Forest flower.musicxml` | Break: Cifra nao reconhecida pelo contrato Find Chord: reak |
| `f-029-Four brothers.musicxml` | Eb(#11,b9): Cifra nao reconhecida pelo contrato Find Chord: (#11,b9) |
| `f-031-Freddie the freeloader.musicxml` | parser leu 50% das cifras MusicXML |

