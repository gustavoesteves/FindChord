# F327 - Curadoria de alternativas no Improviso

## Objetivo

Garantir que os materiais curados pelo catalogo comum aparecam como alternativas musicais no `Improviso`, em vez de ficarem escondidos atras das duas proximas leituras do ranking.

## Alteracoes

- O painel de materiais contextuais passou a selecionar alternativas por contraste de intencao.
- A leitura principal continua sendo a mais bem ranqueada pelo motor.
- As alternativas agora tentam preservar variedade entre `Estavel`, `Direcao`, `Tensao` e `Exterior`.
- Quando nao ha variedade suficiente, o painel preenche com as proximas leituras unicas por tipo.

## Decisao

O compositor precisa enxergar escolhas musicais diferentes, nao apenas pequenas variacoes do mesmo material. Essa curadoria visual permite que o catalogo compartilhado apareca no `Harmonizar` sem forcar o motor a promover artificialmente materiais mais coloridos.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/contextual-material-candidates.spec.ts scripts/contextual-material-candidate-behavior.spec.ts`
- `npm run build`
