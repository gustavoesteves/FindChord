# F81 - Ciclo de dominantes alteradas

## Objetivo

Refinar a camada de dominantes alteradas para sair do gesto pontual e chegar a um encadeamento mais proximo do raciocinio demonstrado por Almada.

## Implementacao

Foi adicionada a proposta `Estratégia — Ciclo de dominantes alteradas` para frases maiores claras em tom maior. A cadeia usa dominantes resolvidas por ciclo funcional:

`C / A7(b9) / Dm / D7alt / G13 / G7(b13,b9) / C6`

Em termos funcionais:

- `A7(b9)` prepara `ii`;
- `D7alt` prepara `V`;
- `G13 -> G7(b13,b9)` intensifica a dominante final;
- `C6` fecha a resolução.

Também foi corrigida uma borda do validador: acordes diatônicos com sétima (`maj7`, `m7`, `m7b5`) não devem ser contados como dominantes secundárias apenas por conterem o caractere `7`.

## Resultado no exemplo Almada

No relatório de comparação, o exemplo `g` agora escolhe `Estratégia — Ciclo de dominantes alteradas` como melhor aproximação do motor.

O resultado ainda e parcial, o que e musicalmente honesto: o motor ja alcança a familia de dominantes alteradas encadeadas, mas ainda nao reproduz a abertura `Em7(b5) -> A7(b9)` nem a chegada `C7M(9)` do Almada.

## Decisao

Manter a cadeia como alternativa de rearmonização. O proximo passo deve tratar preparação iiø antes de dominantes alteradas e substituições por trítono encadeadas.

## Artefatos

- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`
- `src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts`
- `scripts/altered-dominant-strategy.spec.ts`
- `scripts/harmonic-strategy-properties.spec.ts`
- `docs/reports/f79-almada-example-comparison.md`

