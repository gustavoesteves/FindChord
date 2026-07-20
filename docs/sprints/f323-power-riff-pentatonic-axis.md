# F323 - Eixo pentatonico para power chord

## Objetivo

Adicionar um material local para power chords no modulo `Escrever`.

## Alteracoes

- Criado o material `power riff pentatonic axis`.
- Power chords passam a oferecer eixo tonica-quinta, pentatonica menor e pentatonica maior.
- O material entra como intencao `inside`, pois preserva a identidade aberta do acorde.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

Um power chord nao define terca. A UI deve preservar essa ambiguidade em vez de forcar uma leitura maior ou menor. O material apresenta b3 e 3 como cores de riff, mantendo 1 e 5 como centro.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
