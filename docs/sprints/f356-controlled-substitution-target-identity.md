# F356 - Substituicao controlada preserva identidade do alvo

## Contexto

A auditoria tecnica marcou que uma substituicao controlada era aplicada por `measure + chordSymbol`. Quando a mesma cifra aparecia mais de uma vez no mesmo compasso, uma unica proposta podia trocar todas as ocorrencias iguais.

## Alteracoes

- A proposta controlada agora carrega `targetTickStart` e `targetOccurrenceInMeasure`.
- A aplicacao da proposta substitui apenas o evento que coincide com compasso, tick, ocorrencia e cifra original.
- Foi adicionada regressao com dois `Fmaj7` no mesmo compasso para garantir que apenas um vira `F#m7(b5)`.
- A spec direta do gerador verifica a identidade temporal do alvo.
- O timeout do relatorio de corpus real foi ampliado para 60s, pois a suite curada passou a oscilar acima do limite antigo de 20s com o catalogo atual.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/harmonizer-controlled-proposals.spec.ts scripts/controlled-substitution-proposals.spec.ts`
- `npm run lint`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts scripts/real-music-audit-report.spec.ts`
- `npx vitest run --config vitest.curated.config.ts`

