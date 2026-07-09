# F71 - Plano de calibragem do Harmonizar

## Objetivo

Transformar os 24 casos selecionados na F70 em uma pauta de escuta e decisao.

## Entrada

- `docs/reports/f70-promoted-import-calibration-set.csv`

## Saida

- Relatorio: `docs/reports/f71-calibration-workplan.md`
- CSV: `docs/reports/f71-calibration-workplan.csv`
- Script: `scripts/generate-calibration-workplan.ts`

## Decisoes que o plano organiza

- Centro de referencia.
- Harmonia basica.
- Ranking de propostas.
- Cromatismo.
- Conducao de baixo.
- Centro menor.
- Forma curta.
- Legibilidade.

## Uso esperado

O plano nao altera o motor. Ele define a ordem de escuta e o tipo de decisao esperada para cada caso antes de criarmos ajustes no Harmonizar.
