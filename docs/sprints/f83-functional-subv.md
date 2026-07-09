# F83 - SubV funcional ampliado

## Objetivo

Expandir o SubV para alem da cadencia final, seguindo a leitura do Almada de que cada grau diatonico pode ter duas preparacoes de qualidade X7: o V do grau e seu SubV.

## Implementacao

Foi adicionada a proposta `Estratégia — SubV funcional`.

Ela nasce a partir da expansao diatonica e insere SubV apenas quando ha alvo funcional claro:

- `Gb7 -> F` para preparar IV;
- `Ab7 -> G7` para preparar V;
- `Db7 -> C` para preparar a tonica cadencial.

O mecanismo evita duplicar o mesmo alvo quando a expansao diatonica usa inversoes do mesmo acorde.

## Resultado no exemplo Almada

No exemplo de `docs/musics/exemplo.musicxml`, a proposta aparece como alternativa:

`C / Am / Gb7/Bb / F/A / F/C / Bm7b5 / G7 / Db7/Ab / C`

As inversoes aparecem por efeito da camada de conducao de vozes, mas o nucleo funcional do SubV esta presente: `Gb7 -> F` e `Db7 -> C`.

## Decisao

Manter o SubV funcional como rearmonizacao alternativa. O proximo refinamento deve melhorar dois pontos:

- explicitar melhor `Ab7 -> G7` quando a melodia sustentar essa preparacao;
- separar SubV secundario de substituicoes por tritono mais densas, como no exemplo `h` do Almada.

## Artefatos

- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`
- `src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts`
- `scripts/subv7-cadential-strategy.spec.ts`
- `docs/reports/f79-almada-example-comparison.md`

