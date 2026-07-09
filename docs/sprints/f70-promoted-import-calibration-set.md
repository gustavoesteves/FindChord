# F70 - Conjunto de calibragem do corpus importado

## Objetivo

Selecionar um subconjunto pequeno das 181 musicas importadas para calibrar o Harmonizar com escuta e inspeção dirigida.

## Entrada

- `docs/reports/f69-promoted-import-corpus-audit.csv`

## Saida

- Relatorio: `docs/reports/f70-promoted-import-calibration-set.md`
- CSV: `docs/reports/f70-promoted-import-calibration-set.csv`
- Script: `scripts/select-promoted-import-calibration-set.ts`

## Categorias

- Referencia forte.
- Melodia primeiro.
- Muitas propostas.
- Cromatico linear.
- Contraponto de baixo.
- Centros menores.
- Formas curtas.
- Alta densidade harmonica.

## Uso esperado

Esse conjunto deve servir como fila curta de trabalho:

1. ouvir/inspecionar cada caso;
2. comparar a proposta com a cifra de referencia;
3. decidir se o problema e centro, janela, ranking, vocabulario ou explicacao;
4. transformar a decisao em ajuste pequeno do harmonizador.
