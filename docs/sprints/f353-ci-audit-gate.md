# F353 - Gate de CI alinhado a auditoria tecnica

## Contexto

A auditoria tecnica marcou que o deploy publicava com `build` verde, mas sem lint nem testes. Tambem havia uma spec duplicada na suite curada e duas specs temporais existentes fora do include.

## Alteracoes

- O workflow de Pages agora roda `npm run lint` antes de testar e publicar.
- O workflow agora roda `npm run test:curated` antes do build.
- `vitest.curated.config.ts` passou a incluir:
  - `scripts/active-section-selection.spec.ts`
  - `scripts/musicxml-parser-timeline.spec.ts`
- A duplicata de `scripts/local-route-repetition-audit.spec.ts` foi removida.

## Validacao

- `npm run lint`
- `npx vitest run --config vitest.curated.config.ts`
- `npm run build`

