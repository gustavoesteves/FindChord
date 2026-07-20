# F351 - Toggle de harmonizacoes expansivel e recolhivel

## Contexto

A auditoria tecnica marcou que o botao `Ver mais harmonizacoes` desaparecia depois de expandir a lista. Como a UI calculava `hiddenCount` como zero quando `isExpanded=true`, o texto `Ver menos` nunca era renderizado.

## Alteracoes

- A lista agora calcula o overflow da forma colapsada independentemente do estado expandido.
- O toggle permanece visivel enquanto houver propostas ocultas no modo colapsado.
- O contador continua aparecendo apenas em `Ver mais harmonizacoes (+N)`; no estado expandido o botao mostra `Ver menos`.
- A regra foi extraida para `collapsedHiddenProposalCount` e coberta por teste.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/harmonizer-proposal-list-curation.spec.ts`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`

