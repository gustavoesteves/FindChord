# F78 - Calibracao de contraponto de baixo

## Objetivo

Validar se a estrategia `Contraponto de Baixo` pode permanecer como proposta primaria quando a inversao melhora a continuidade do baixo sem esconder a funcao harmonica.

## Corpus

- `b-037-Blueberry hill.musicxml`
- `a-039-Another Time.musicxml`
- `e-008-Eighty one.musicxml`

## Resultado

Nos tres casos auditados, a estrategia `Contraponto de Baixo` ficou como proposta primaria.

| Musica | Primaria | Baixo | Comparacao |
| --- | --- | --- | --- |
| Blueberry hill | `Dm7 / Gm6 / E7/G# / A7 / Dmaj7` | `D -> G -> G# -> A -> D` | funcao 100%, raiz 0% |
| Another Time | `Bbmaj7 / F7/Eb / C7/E / A7/F / G#dim7/Bb` | `Bb -> Eb -> E -> F -> Bb` | funcao 100%, raiz 100% |
| Eighty one | `Fmaj9 / Bbmaj7 / G7/B / E7/C / Fmaj9` | `F -> Bb -> B -> C -> F` | funcao 100%, raiz 100% |

## Decisao

O criterio atual fica preservado: inversoes sao bem-vindas quando produzem linha de baixo legivel, mantem funcao reconhecivel e nao transformam slash chords em artificio de cifragem.

O caso `Blueberry hill` mostra uma nuance importante: a raiz pode divergir da referencia sem invalidar a proposta se a funcao for preservada e a linha de baixo explicar a escolha.

## Artefatos

- `scripts/audit-bass-calibration.ts`
- `scripts/bass-calibration.spec.ts`
- `docs/reports/f78-bass-calibration-audit.md`
- `docs/reports/f78-bass-calibration-audit.csv`

