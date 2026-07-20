# F324 - Catalogo de materiais locais de vamp

## Objetivo

Separar os materiais locais curados do orquestrador de leitura de vamp.

## Alteracoes

- Criado `localChordVampMaterialCatalog`.
- `localChordVampMaterials` passa a montar fontes-base e anexar o catalogo suplementar.
- Os materiais por qualidade de acorde ficam centralizados em uma camada propria.
- O comportamento musical dos materiais existentes foi preservado.

## Decisao

O modulo `Escrever` comeca a ter vocabulario suficiente para exigir organizacao. O orquestrador deve responder "quais materiais existem para este acorde"; o catalogo deve conter "como cada material curado e construido".

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-material-presentation.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts`
- `npm run build`
