# F98 - Triagem melodica das dominantes alteradas sem alvo local

Este relatorio observa apenas os casos que continuam `unresolved` apos F97.

A leitura nao libera cromatismo automaticamente. Ela mede se a melodia, durante a dominante, apoia mais a propria dominante, a chegada lateral seguinte ou nenhum dos dois com forca suficiente.

## Resumo

- Casos analisados: 8
- melody-supports-dominant: 3
- melody-supports-side-arrival: 2
- melody-weak-evidence: 2
- melody-ambiguous: 1

## Relação da chegada lateral com o alvo esperado

- target-lower-chromatic-neighbor: 4
- target-plagal-region: 2
- target-lower-whole-neighbor: 1
- target-upper-whole-neighbor: 1

## Casos

| # | Arquivo | Comp. | Acorde | Alvo esp. | Chegada | Relação | Próximos acordes | Melodia | Cob. dom. | Cob. chegada | Cob. alvo | Classe | Nota |
| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | Airegin.musicxml | 30 | E7(b9) | A | Ab | target-lower-chromatic-neighbor | Ab / Ab6 / Gm7(b5) / C7 | E D | 1 | 0 | 0 | melody-supports-dominant | A melodia sustenta a sonoridade da dominante alterada, mesmo sem alvo local claro. |
| 2 | imported-real-book/a-014-Ain't misbehavin.musicxml | 30 | E7(b9) | A | Ab | target-lower-chromatic-neighbor | Ab / Ab6 / Gm7(b5) / C7 | E D | 1 | 0 | 0 | melody-supports-dominant | A melodia sustenta a sonoridade da dominante alterada, mesmo sem alvo local claro. |
| 3 | imported-real-book/a-027-All of you.musicxml | 16 | E7(#9) | A | Ab | target-lower-chromatic-neighbor | Ab / Ab / Ab(#5) / Ab6 | Eb | 0 | 1 | 0 | melody-supports-side-arrival | A melodia sustenta melhor a chegada lateral do que o alvo funcional esperado. |
| 4 | imported-real-book/b-033-Blue Monk.musicxml | 31 | B7(#9) | E | Eb | target-lower-chromatic-neighbor | Eb6 / A7(b5) / Abm7 / Fm7 | F Eb C | 0 | 0.67 | 0 | melody-supports-side-arrival | A melodia sustenta melhor a chegada lateral do que o alvo funcional esperado. |
| 5 | imported-real-book/c-002-Cantaloupe island.musicxml | 31 | G7alt | C | F | target-plagal-region | Fm6(9) | C G | 0.5 | 1 | 0.5 | melody-weak-evidence | A melodia nao oferece suporte forte para liberar a dominante automaticamente. |
| 6 | imported-real-book/d-003-Daahood.musicxml | 23 | Ab7(b9) | Db | Gb | target-plagal-region | Gb7(#11) / D7(b13,b9) / F7/Eb | Eb | 1 | 0 | 0 | melody-supports-dominant | A melodia sustenta a sonoridade da dominante alterada, mesmo sem alvo local claro. |
| 7 | imported-real-book/d-003-Daahood.musicxml | 24 | D7(b13,b9) | G | F | target-lower-whole-neighbor | F7/Eb | Eb | 1 | 1 | 0 | melody-ambiguous | A melodia cabe tanto na dominante quanto na chegada lateral; exige escuta local. |
| 8 | imported-real-book/d-023-Dolphin dance.musicxml | 3 | C7(#9)/Eb | F | G | target-upper-whole-neighbor | G7alt / D/E / C/E / D/E | G Ab Bb F | 0.5 | 0.5 | 0.25 | melody-weak-evidence | A melodia nao oferece suporte forte para liberar a dominante automaticamente. |

## Leitura para o motor

- `melody-supports-side-arrival` pode indicar encadeamento lateral real, mas ainda pede regra harmonica especifica.
- `melody-supports-dominant` sugere tensao expressiva sustentada pela melodia, nao necessariamente erro.
- `target-lower-chromatic-neighbor` e `target-plagal-region` sao candidatos a investigacao antes de virarem regra.
- `melody-weak-evidence` deve manter penalidade forte ate que outra evidencia explique o acorde.

