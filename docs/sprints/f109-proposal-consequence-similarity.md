# F109 - Similaridade de consequencia harmonica

## Objetivo

Encontrar cards que nao possuem cifras identicas, mas oferecem uma experiencia
harmonica muito proxima.

## Regra conservadora

Duas propostas so sao consideradas quase equivalentes quando:

- ocupam exatamente os mesmos pontos temporais;
- preservam todas as raizes;
- preservam todos os baixos, inclusive inversoes;
- preservam toda a sequencia funcional contextual;
- mantem pelo menos 60% de sobreposicao media entre as notas dos acordes.

Dominantes sao lidas por alvo e tipo de resolucao. Assim, por exemplo, `C` e
`C7 -> F` nao sao confundidos apenas porque possuem a mesma raiz.

## Limite desta etapa

Nenhum card sera ocultado automaticamente. A auditoria servira para revisar os
pares reais e decidir se variacoes de extensao devem ser agrupadas dentro de um
card ou preservadas como ideias independentes por sua conducao de vozes.

## Artefatos

- `src/utils/music/analysis/strategies/ProposalConsequenceSimilarity.ts`;
- `scripts/audit-proposal-consequence-similarity.ts`;
- `scripts/generate-proposal-consequence-report.ts`;
- `scripts/proposal-consequence-similarity.spec.ts`;
- `scripts/proposal-consequence-audit.spec.ts`;
- `docs/reports/f109-proposal-consequence-similarity.md`;
- `docs/reports/f109-proposal-consequence-similarity.csv`.

## Resultado

- 199 partituras analisadas;
- 4 partituras com pares quase equivalentes;
- 4 pares encontrados;
- 8 ideias envolvidas;
- todos os pares ocorreram entre propostas principais;
- nenhum par envolveu trechos locais;
- `asa branca.musicxml` nao apresentou quase repeticoes.

Os quatro casos repetem o mesmo padrao: `Dominantes alteradas` e `Dominantes
secundarias`. As progressoes preservam tempo, raizes, baixos e funcao, com 96%
a 98% de sobreposicao sonora. As diferencas sao tensoes como `b9` e `b13`.

## Conclusao

Nao ha evidencia para ocultar propostas por uma similaridade generica. Ha,
porem, evidencia forte e bem delimitada para agrupar versoes simples e
alteradas de uma mesma rota de dominantes dentro de um unico card, preservando
as duas como variacoes aplicaveis.
