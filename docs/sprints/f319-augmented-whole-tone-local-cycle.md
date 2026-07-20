# F319 - Ciclo local para acorde aumentado

## Objetivo

Adicionar um material local para acordes aumentados no modulo `Escrever`.

## Alteracoes

- Criado o material `augmented whole tone cycle`.
- O acorde aumentado passa a oferecer duas triades aumentadas dentro da colecao de tons inteiros.
- A linha tocavel alterna a triade do acorde, a triade um tom acima e o retorno ao apoio.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

No acorde aumentado isolado, o valor musical esta na simetria da colecao de tons inteiros. O material deve ajudar o compositor a frasear essa simetria, nao apenas listar a escala.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
