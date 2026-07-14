# F151 - Diminutos de passagem com baixo dirigido

## Objetivo

Refinar a família `Diminutos de passagem` para aproximar o motor do exemplo `i` do Almada.

Antes desta etapa, o sistema já gerava diminutos resolvidos, mas a solução era mais genérica:

`C / G#dim7 / Am / Edim7 / F / F/C / Bm7b5 / F#dim7 / G7 / C`

Ela continha o vocabulário correto, mas não reproduzia a ideia central do exemplo: a linha de baixo cromática conduzindo os acordes.

## Mudança

- `StrategyGuidedHarmonizer` passou a tentar uma rota dirigida para frases maiores de quatro compassos:
  - `I -> IIIº -> ii/IV -> #IVº -> Imaj7/V -> V7 -> I`
- Em C, isso gera:
  - `C / Edim7 / Dm/F / F#dim7 / Cmaj7/G / G7 / C`
- `HarmonicStrategyValidator` passou a aceitar diminutos que resolvem por semitom para o baixo explícito do acorde seguinte.
- O classificador funcional passou a ler `Imaj7/V` como preparação dominante, isto é, uma forma de cadencial 6/4 expandido, sem transformar qualquer `I/V` simples em dominante.

## Evidência

No relatório Almada:

- o exemplo `i` passou de `partial` para `covered`;
- a afinidade subiu para `84%`;
- a diferença de densidade caiu para `0`;
- o baixo gerado passou a ser `C -> E -> F -> F# -> G -> G -> C`.

## Validação

- `npx vitest run scripts/chromatic-calibration.spec.ts scripts/harmonic-strategy-properties.spec.ts scripts/almada-example-comparison.spec.ts --config vitest.curated.config.ts`
- `npm run import:audit-almada-example`
- `npm run test:curated`
- `npm run build`
- `git diff --check`

## Próximo Passo

As lacunas restantes no contraste com Almada ficam principalmente em:

- dominantes secundárias e alteradas com densidade mais próxima dos exemplos `d`, `e` e `g`;
- cadência plagal menor com cromatismo preparatório mais rico no exemplo `l`;
- SubV funcional ainda mais próximo da densidade do exemplo `h`.
