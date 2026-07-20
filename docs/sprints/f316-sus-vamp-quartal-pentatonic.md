# F316 - Material quartal para vamp sus

## Objetivo

Adicionar um material local especifico para acordes sus no modulo `Escrever`.

## Alteracoes

- Criado o material `sus quartal pentatonic`.
- `sus4`, `sus2` e `dominant7sus4` passam a receber celulas quartais/pentatonicas locais.
- O material entra como intencao `inside`, pois sustenta a propria identidade do acorde suspenso.
- Adicionadas descricao, dica e linha tocavel para apresentacao na UI.

## Decisao

Em um acorde sus isolado, a quarta nao precisa ser tratada como atraso que obrigatoriamente resolve para a terca. No `Escrever`, ela pode ser o centro sonoro do vamp; por isso o material privilegia quartas e pentatonica sus sem inventar proximo acorde.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
