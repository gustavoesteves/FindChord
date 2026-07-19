# F315 - Pilha pentatonica dorica para vamp menor

## Objetivo

Adicionar um material local util para acordes menores no modulo `Escrever`.

## Alteracoes

- Criado o material `minor dorian pentatonic stack`.
- Para acordes menores, o motor local oferece pentatonicas menores da tonica, da quinta e do segundo grau.
- O material entra como intencao `functional`, portanto aparece na rota `Colorir`.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

No `Escrever`, nao ha proximo acorde nem centro tonal confiavel. Em vamp menor, a pilha pentatonica dorica oferece um caminho musical pratico: manter o menor reconhecivel e abrir 9, 11 e 13 sem fingir resolucao funcional.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-palette.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
