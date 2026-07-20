# F358 - Timeline tonal e metrica no MusicXML

## Contexto

A auditoria tecnica marcou que o parser achatava informacoes estruturais do MusicXML: preservava apenas a primeira armadura e a primeira formula de compasso. Isso escondia modo menor, modulacoes e mudancas metricas dos motores posteriores.

## Alteracoes

- `ScoreSnapshot.metadata` agora possui `keyTimeline` e `timeTimeline`.
- O parser registra cada mudanca de `<key>` com compasso, tick, `fifths`, `mode` e `keySignature`.
- O parser registra cada mudanca de `<time>` com compasso, tick, numerador, denominador e texto da formula.
- `keySignature` e `timeSignature` permanecem como campos de compatibilidade, representando o primeiro contexto encontrado.
- Foi adicionada regressao com C menor inicial, modulacao para D maior e troca de 4/4 para 3/4.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/musicxml-parser-timeline.spec.ts scripts/score-ingestion-modes.spec.ts scripts/bright-size-life-diagnostic.spec.ts scripts/palhaco-diagnostic.spec.ts`
- `npm run lint`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`

