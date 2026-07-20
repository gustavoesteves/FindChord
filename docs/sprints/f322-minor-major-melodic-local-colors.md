# F322 - Cores locais para menor-maior

## Objetivo

Adicionar um material local para acordes menor-maior no modulo `Escrever`.

## Alteracoes

- Criado o material `minor major melodic colors`.
- Acordes `m(maj7)` passam a oferecer arpejo menor-maior, triade menor do II grau e triade maior do V grau.
- O material entra como intencao `functional`, pois colore o acorde sem depender de progressao.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

O acorde menor-maior nao deve cair na mesma leitura do menor dorico ou menor natural. A tensao entre b3 e 7M e a identidade do acorde; por isso o material preserva essa friccao e abre 9, 11 e 13 como cor melodica local.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
