# F69 - Auditoria musical do corpus importado

Este relatorio roda uma auditoria leve de harmonizacao sobre `docs/musics/imported-real-book`.
Ele nao substitui a curadoria musical; serve para indicar quais arquivos ja alimentam bem o harmonizador.

## Leitura geral

- Arquivos auditados: 181
- Harmonizados: 181
- Sem proposta: 0
- Sem melodia: 0
- Erro de parse: 0
- Notas lidas: 20416
- Cifras lidas: 6838

## Por volume

| Volume | Arquivos | Harmonizados | Sem proposta | Sem melodia | Parse erro |
| --- | ---: | ---: | ---: | ---: | ---: |
| A | 44 | 44 | 0 | 0 | 0 |
| B | 39 | 39 | 0 | 0 | 0 |
| C | 29 | 29 | 0 | 0 | 0 |
| D | 26 | 26 | 0 | 0 | 0 |
| E | 16 | 16 | 0 | 0 | 0 |
| F | 27 | 27 | 0 | 0 | 0 |

## Bons casos de comparacao com referencia

| Arquivo | Centro | Propostas | Sobreposicao ref. | Cifras geradas |
| --- | --- | ---: | ---: | --- |
| `a-010-After you.musicxml` | Bb major | 14 | 8 | Bb6 / Bdim7 / C7 / F7 |
| `a-006-African flower.musicxml` | F minor | 13 | 8 | Fmaj7 / Fm7/Bb / Fmaj7/C / Fm7 |
| `a-013-Ain't it the truth.musicxml` | Eb major | 12 | 8 | Ebmaj7 / Bb7/Ab / Ebmaj7/Bb / Ebmaj7 |
| `d-025-Donna Lee.musicxml` | C major | 12 | 8 | Cmaj7 / Fmaj7 \| G7 / C6 |
| `b-032-Blue in green.musicxml` | Bb major | 11 | 8 | Bbmaj7 / F7/Eb / Bb6/F / Bbmaj7 |
| `b-035-Blue room.musicxml` | C minor | 10 | 8 | Cmaj7 / G7/F / Cmaj7/G / Cmaj7 |
| `b-037-Blueberry hill.musicxml` | D minor | 10 | 8 | Dm7 / Gm6 / E7/G# / A7 / Dmaj7 |
| `c-034-Crazeology.musicxml` | Eb major | 10 | 8 | Ebmaj7 / Adim7/E / F7 / D7/Bb |
| `d-017-Detour ahead.musicxml` | Bb major | 10 | 8 | Bbmaj7 / Ddim7/B / Ddim7/B \| Am7b5/C |
| `a-030-All the things you are.musicxml` | Bb major | 9 | 8 | Bbmaj7 / F13/Eb / Bb6/F / Bb6 |
| `a-039-Another Time.musicxml` | Bb major | 9 | 8 | Bbmaj7 / F7/Eb / C7/E / A7/F / G#dim7/Bb |
| `b-034-Blue moon.musicxml` | F major | 9 | 8 | F \| C7/E \| F \| F \| F7 \| Bb \| Em7b5 / G7/F / C7/E \| F |
| `c-033-Cousin Mary.musicxml` | Bb major | 9 | 8 | Bbmaj7 / Bbdim7/B / C7 / F7 |
| `e-002-E.S.P..musicxml` | C major | 9 | 8 | Cmaj7 / Cdim7/Db / D7 / G#dim7/G |
| `e-008-Eighty one.musicxml` | F minor | 9 | 8 | Fmaj9 / Bbmaj7 / G7/B / E7/C / Fmaj9 |
| `e-013-Equinox.musicxml` | G major | 9 | 8 | G13sus4 / G13 \| G13 \| F13sus4 / F13 \| G13 \| G13sus4 / G13 \| G13sus4 / G13 \| G13sus4 / G13 \| G13 |
| `f-020-Fly me to the moon.musicxml` | Eb major | 9 | 8 | Ebmaj7 / Abmaj7 / Bb13 / Ebmaj7 |
| `f-033-Freight trane.musicxml` | C major | 9 | 8 | C13 \| C13 \| Bb13 \| C13 \| Bb13 \| C13sus4 / C13 \| Bb13sus4 / Bb13 \| C13sus4 / C13 |
| `a-053-At last.musicxml` | F major | 8 | 8 | Fmaj7 / Gm7/Bb / Fmaj7(#11)/C / Fmaj7 |
| `b-026-Black Orpheus.musicxml` | Eb major | 8 | 8 | Ebmaj7 / Fm7/Ab / Bb7 / Ebmaj7 |
| `b-042-Bolivia.musicxml` | F major | 8 | 8 | F6 / Adim7/Gb / Adim7/Gb / G7 |
| `b-043-Boplicity.musicxml` | C minor | 8 | 8 | Abmaj7 \| Cm6/G \| Cm \| Cm \| Fm7 \| Fm7 \| Dm7b5 \| Cm |
| `c-006-Casa forte.musicxml` | D minor | 8 | 8 | Dmaj7 / Gmaj7 / Fmaj7/E / A7 / Dmaj7 |
| `c-022-Come rain or come shine.musicxml` | Bb major | 8 | 8 | Gm7 \| F7 \| Gm7 \| F7 \| Gm7 \| Gm7 \| Bb \| Bb |
| `c-025-Con Alma.musicxml` | G major | 8 | 8 | Gmaj7 / D7/C / G6/D / Gdim7 |
| `d-010-Dear old Stockholm.musicxml` | D minor | 8 | 8 | Gmaj7/D / Gmaj7 \| A7 / D6 |
| `e-006-Easy to love.musicxml` | Eb major | 8 | 8 | Bb7 \| Eb \| Bb7/D \| Eb \| Bb7/D \| Cm7 \| Eb \| Eb |
| `f-028-Four.musicxml` | Ab major | 8 | 8 | Abmaj7 / Dbmaj7 / Abmaj7/Eb / Ab6 |
| `a-017-Aja.musicxml` | D minor | 7 | 8 | Gmaj7/D / Gmaj7 / A7 / Dmaj7 |
| `a-020-Alfie's theme.musicxml` | C major | 7 | 8 | Cmaj7 / Fmaj7 / G7 / Cmaj7 |

## Itens que ainda precisam investigacao

Nenhum item tecnico pendente neste passe.

## Proxima acao

Usar os casos harmonizados com boa sobreposicao de referencia como lote de calibragem do Harmonizar. Os itens sem proposta devem virar investigacao de janela melodica, centro ou vocabulario melodico.

