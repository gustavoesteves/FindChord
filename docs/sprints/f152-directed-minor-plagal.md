# F152 - Cadência plagal menor com cromatismo dirigido

## Objetivo

Refinar a família `Cadência plagal menor` para aproximar o motor do exemplo `l` do Almada.

Antes desta etapa, o sistema reconhecia a cor principal `iv -> I`, mas a proposta era curta demais:

`C / Am / F / F/C / Bm7b5 / G7 / Fm / C`

Ela continha a cadência plagal menor, mas não a preparação cromática nem a linha de baixos indicada pelo exemplo.

## Mudança

- `StrategyGuidedHarmonizer` passou a gerar uma versão dirigida da cadência plagal menor em frases de quatro compassos:
  - `i7 -> bIIº -> ii7 -> bVII7 -> vii7/#IV -> V7/IV -> I/III -> iv -> I`
- Em C, isso gera:
  - `Cm7 / Dbdim7 / Dm7 / Bb7 / Bm7/F# / G7/F / C/E / Fm / C`
- A proposta continua sendo uma rearmonização alternativa, não o fundamento da frase.

## Evidência

No relatório Almada:

- o exemplo `l` passou de `partial` para `covered`;
- a afinidade subiu para `88%`;
- a diferença de densidade caiu para `0`;
- a proposta agora preserva a ideia de mistura modal, cromatismo preparatório e baixos dirigidos até `Fm -> C`.

## Validação

- `npx vitest run scripts/harmonic-strategy-properties.spec.ts scripts/almada-example-comparison.spec.ts --config vitest.curated.config.ts`
- `npm run import:audit-almada-example`
- `npm run test:curated`
- `npm run build`
- `git diff --check`

## Próximo Passo

Depois da F151 e F152, o contraste com Almada ficou com 8 exemplos cobertos e 4 parciais. As lacunas restantes estão concentradas em:

- dominantes secundárias com preparação cromática (`d`);
- dominantes secundárias/alteradas com densidade mais idiomática (`e`, `g`);
- substituições por trítono com densidade mais próxima do exemplo (`h`).
