# F357 - Amostragem estrutural da frase completa

## Contexto

A auditoria tecnica marcou que o limite de 32 anchors podia cortar a melodia antes da cadencia real. O sistema entao analisava uma nota intermediaria como final de frase, alterando alvo cadencial, centro e ranking.

## Alteracoes

- `selectStructuralAnchors` deixou de usar apenas a primeira janela.
- Quando a melodia excede o limite, a selecao agora preserva o primeiro e o ultimo anchor e distribui os demais pela frase inteira.
- Foi adicionada regressao com 64 notas curtas e uma cadencia final distante para garantir que o alvo final real permanece `C` com confianca alta.
- A auditoria de densidade foi recalibrada: ao ver a frase inteira, Asa Branca continua sem referencia, mas pode expor alternativa cadencial densa como opcao secundaria.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/temporal-melody-window.spec.ts`
- `npx vitest run --config vitest.curated.config.ts scripts/asa-branca-diagnostic.spec.ts scripts/autumn-leaves-diagnostic.spec.ts scripts/bright-size-life-diagnostic.spec.ts scripts/real-music-fire-audit.spec.ts`
- `npm run lint`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts scripts/harmonization-density-audit.spec.ts scripts/temporal-melody-window.spec.ts`
- `npx vitest run --config vitest.curated.config.ts`

