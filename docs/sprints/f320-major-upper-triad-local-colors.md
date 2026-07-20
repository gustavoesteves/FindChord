# F320 - Triades superiores para acorde maior

## Objetivo

Adicionar um material local para acordes maiores no modulo `Escrever`.

## Alteracoes

- Criado o material `major upper triad colors`.
- Acordes maiores passam a oferecer arpejo da tonica, triade do II grau e triade do V grau.
- O material entra como intencao `functional`, pois colore o acorde sem depender de progressao.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

No acorde maior isolado, o compositor precisa de caminhos de cor que ainda preservem repouso. As triades superiores mostram 9, #11, 13 e 7M como vocabulário tocavel, em vez de apenas listar uma escala maior ou lidia.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
