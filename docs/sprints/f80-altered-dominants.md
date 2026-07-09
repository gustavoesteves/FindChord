# F80 - Dominantes alteradas iniciais

## Objetivo

Abrir o proximo bloco indicado pela comparacao com Almada: gerar dominantes alteradas como vocabulario de rearmonizacao, sem deslocar a leitura harmonica principal.

## Implementacao

A estrategia `Dominantes alteradas` nasce a partir das dominantes secundarias ja resolvidas. O motor primeiro confirma a progressao funcional e depois troca algumas dominantes por variantes como:

- `7(b9)`;
- `7(b13)`;
- `7alt`.

O filtro ainda e conservador: a variante alterada precisa manter cobertura melodica proxima da dominante original e a progressao inteira precisa continuar aceita pelo validador de dominantes secundarias.

## Resultado no exemplo Almada

Em `docs/musics/exemplo.musicxml`, a proposta aparece como alternativa:

`C / Am / C7(b9)/Bb / F/A / F/C / Bm7b5 / D7(b13)/C / G7/B / C`

Ela melhora a cobertura da familia de dominantes alteradas, mas ainda nao reproduz a escada pedagogica completa do Almada (`A7(b9)`, `D7alt`, `G7(b13 b9)`). Isso e bom sinal: o motor ganhou vocabulario, mas a lacuna teorica continua visivel.

## Decisao

Manter `Dominantes alteradas` como camada de rearmonizacao alternativa. O proximo refinamento deve trabalhar densidade e encadeamento local para chegar mais perto das rearmonizacoes avancadas sem virar copia fixa do exemplo.

## Artefatos

- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`
- `scripts/altered-dominant-strategy.spec.ts`
- `docs/reports/f79-almada-example-comparison.md`

