# F102 - Lacuna de geracao para chegadas laterais

Esta auditoria cruza os casos F98 da referencia com as propostas que o gerador produz na janela harmonizavel escolhida.

## Resumo

- Casos analisados: 8
- Casos dentro da janela harmonizavel: 1
- Casos com candidato lateral gerado: 1

## Casos

| # | Arquivo | Comp. | Acorde ref. | Alvo | Chegada | Relação | Melodia | Janela | Propostas | Matches | Diagnóstico | Exemplos |
| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: | --- | --- |
| 1 | Airegin.musicxml | 30 | E7(b9) | A | Ab | target-lower-chromatic-neighbor | melody-supports-dominant | outside-window | 4 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 2 | imported-real-book/a-014-Ain't misbehavin.musicxml | 30 | E7(b9) | A | Ab | target-lower-chromatic-neighbor | melody-supports-dominant | outside-window | 8 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 3 | imported-real-book/a-027-All of you.musicxml | 16 | E7(#9) | A | Ab | target-lower-chromatic-neighbor | melody-supports-side-arrival | outside-window | 5 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 4 | imported-real-book/b-033-Blue Monk.musicxml | 31 | B7(#9) | E | Eb | target-lower-chromatic-neighbor | melody-supports-side-arrival | outside-window | 7 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 5 | imported-real-book/c-002-Cantaloupe island.musicxml | 31 | G7alt | C | F | target-plagal-region | melody-weak-evidence | outside-window | 6 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 6 | imported-real-book/d-003-Daahood.musicxml | 23 | Ab7(b9) | Db | Gb | target-plagal-region | melody-supports-dominant | outside-window | 3 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 7 | imported-real-book/d-003-Daahood.musicxml | 24 | D7(b13,b9) | G | F | target-lower-whole-neighbor | melody-ambiguous | outside-window | 3 | 0 | O caso da referencia nao cai na janela harmonizavel escolhida. | - |
| 8 | imported-real-book/d-023-Dolphin dance.musicxml | 3 | C7(#9)/Eb | F | G | target-upper-whole-neighbor | melody-weak-evidence | covered-by-window | 6 | 1 | O gerador ja produziu candidato com a chegada lateral. | Estratégia — Gramática funcional ii-V: 4:Gm7 \| 8:C7 \| 9:Fmaj7 |

## Leitura

Alguns casos ja aparecem como candidatos. O proximo passo e comparar ranking e apresentacao desses candidatos.

