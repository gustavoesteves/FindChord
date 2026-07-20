# F348 - Secao ativa efetiva sem render transitorio invalido

## Origem

A auditoria em `docs/auditoria.md` apontou que, apos uma nova sincronizacao, IDs instaveis de secao podiam invalidar `selectedSectionId`. Mesmo com IDs agora deterministicos, ainda havia um render intermediario em que `activeSection` podia ficar `undefined` ate o `useEffect` corrigir a selecao.

## Objetivo

Garantir que o Harmonizar sempre receba uma secao efetiva no mesmo render quando existem secoes disponiveis.

## Implementacao

- `useActiveSection` passa a calcular `effectiveSelectedSectionId`.
- Se a secao selecionada ainda existe, ela e preservada.
- Se a selecao ficou invalida, a primeira secao e usada imediatamente, antes do effect normalizar o estado.
- A regra foi extraida para `effectiveSectionId` e coberta por teste puro.

## Resultado

Reduzimos o risco de uma analise transitoria do score inteiro durante ressincronizacao ou troca de snapshot.

## Validacao

- Teste preservando `sec_b` apos ressincronizacao com os mesmos IDs.
- Teste caindo para `sec_a` quando a selecao antiga nao existe.
- `npx vitest run --config vitest.curated.config.ts scripts/active-section-selection.spec.ts scripts/score-ingestion-modes.spec.ts`
- `npm run build`
