# F317 - Estruturas locais para meio-diminuto

## Objetivo

Adicionar um material local para acordes meio-diminutos no modulo `Escrever`.

## Alteracoes

- Criado o material `half diminished upper structures`.
- O acorde meio-diminuto ganha arpejo ø7, celula com 9 natural e celula superior da colecao locria #2.
- O material entra como intencao `functional`, pois colore o acorde sem depender de destino harmonico.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

No `Harmonizar`, o meio-diminuto frequentemente prepara uma dominante menor. No `Escrever`, esse contexto nao existe; por isso o material precisa funcionar como cor local tocavel, sem prometer resolucao.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
