# F318 - Ciclo local para diminuto completo

## Objetivo

Adicionar um material local para acordes diminutos completos no modulo `Escrever`.

## Alteracoes

- Criado o material `diminished symmetric cycle`.
- O material rotaciona a propria colecao do acorde por tercas menores.
- A grafia permanece consistente dentro da colecao, evitando enarmonias diferentes a cada inversao.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

No acorde diminuto completo, a simetria e o proprio material. Em vez de tratar cada ponto de partida como uma nova transposicao independente, o sistema rotaciona a colecao do acorde para preservar leitura musical e visual.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
