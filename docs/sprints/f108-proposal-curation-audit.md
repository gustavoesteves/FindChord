# F108 - Auditoria da curadoria de propostas

## Objetivo

Medir no catalogo real se a nova apresentacao remove repeticoes sem reduzir o
harmonizador a poucas ideias.

## Escopo

- 18 partituras do conjunto principal;
- 181 partituras importadas do Real Book;
- propostas principais, referencia do autor e trechos locais;
- mesma identidade harmonica e mesma politica equilibrada usadas pela tela.

## Artefatos

- `scripts/audit-proposal-curation.ts`;
- `scripts/generate-proposal-curation-report.ts`;
- `scripts/proposal-curation-audit.spec.ts`;
- `docs/reports/f108-proposal-curation.md`;
- `docs/reports/f108-proposal-curation.csv`.

## Criterio

Uma repeticao possui os mesmos compassos e a mesma sequencia normalizada de
cifras. Inversoes, densidades, posicoes temporais e percursos diferentes
continuam preservados.

Os casos com zero ou uma ideia visivel formam uma fila de investigacao. Eles
podem revelar tanto melodias restritivas quanto lacunas reais do vocabulario do
motor.

## Resultado

- 199 partituras analisadas;
- 1.121 ideias principais antes da curadoria;
- 1.099 ideias principais unicas;
- 22 repeticoes principais removidas;
- 581 trechos locais antes da curadoria;
- 576 trechos locais unicos;
- 5 repeticoes locais removidas;
- 16 partituras tiveram pelo menos uma repeticao removida;
- nenhuma partitura ficou com zero ou apenas uma ideia visivel.

Em `asa branca.musicxml`, permaneceram quatro ideias distintas: `Melodia
primeiro`, `Harmonia fundamental I-IV-V`, `Contraponto de Baixo` e `Tonal
Classico`. Isso confirma que a repeticao percebida vinha principalmente da
alternancia entre os antigos perfis de exibicao.

## Leitura

A deduplicacao esta atuando de forma seletiva: remove equivalencias reais sem
empobrecer o conjunto apresentado. O proximo refinamento deve avaliar se as
ideias que permaneceram sao suficientemente diferentes em consequencia
musical, mesmo quando suas sequencias de cifras nao sao identicas.
