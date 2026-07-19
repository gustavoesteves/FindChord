# F300 - Renomeacao da tela Materiais do acorde

## Objetivo

Remover o principal residuo estrutural da antiga tela de escalas compativeis.

## Alteracoes

- `ScaleOverlayPanel` passa a ser `WriterMaterialPanel`.
- A aba interna deixa de usar o id `scales` e passa a usar `materials`.
- `WriterTabSurface` passa a importar e renderizar o componente com o nome atual.

## Decisao

A tela ja nao e mais uma lista de escalas compativeis. O nome interno precisa acompanhar o contrato atual: navegacao de materiais melodicos sobre o acorde.

## Validacao

- `rg -n "ScaleOverlayPanel|activeTab === \"scales\"|\"scales\"" src scripts`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-action.spec.ts scripts/writer-material-routes.spec.ts scripts/writer-material-fretboard-view.spec.ts scripts/local-material-note-roles.spec.ts`
