# F321 - Triades superiores para dominante natural

## Objetivo

Adicionar um material local para dominantes naturais no modulo `Escrever`.

## Alteracoes

- Criado o material `dominant upper triad colors`.
- Dominantes naturais passam a oferecer arpejo 7, triade menor do quinto grau, triade maior da b7 e triade menor da 9.
- O material entra como intencao `functional`, pois colore o dominante sem entrar em alteracoes.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

No acorde dominante isolado, nem toda cor precisa apontar para alterado ou resolucao forte. As triades naturais ajudam o compositor a explorar 9, 11, 13 e b7 mantendo o som mixolidio/blues-modal do vamp.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
