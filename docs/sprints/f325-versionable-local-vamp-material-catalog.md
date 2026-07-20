# F325 - Catalogo versionavel de materiais locais

## Objetivo

Preparar o catalogo de materiais locais para ser compartilhado entre `Escrever` e o futuro `Improviso` no `Harmonizar`.

## Alteracoes

- `localChordVampMaterialCatalog` passa a exportar `LOCAL_CHORD_VAMP_MATERIAL_CATALOG`.
- Cada entrada explicita `id`, `sourceType`, `label`, `qualities`, `intent` e `build`.
- O catalogo agora pode ser consultado por qualidade (`localChordVampCatalogEntriesForQuality`) e por intencao (`localChordVampCatalogEntriesForIntent`) antes de materializar candidatos.
- Adicionado teste para unicidade de ids e sourceTypes.
- Adicionado teste para consumo por metadados sem executar o builder.
- Adicionado teste para consulta por qualidade e intencao.

## Decisao

O catalogo nao deve ser apenas uma colecao de funcoes privadas. Para que o `Harmonizar` consiga reaproveitar essa inteligencia, os materiais precisam ter metadados estaveis e consultaveis por qualidade, intencao e tipo de fonte, sem depender da UI do `Escrever`.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-material-catalog.spec.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-chord-materials.spec.ts`
- `npx vitest run --config vitest.curated.config.ts`
- `npm run build`
