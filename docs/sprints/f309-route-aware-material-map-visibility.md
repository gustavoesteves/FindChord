# F309 - Visibilidade do mapa por rota

## Objetivo

Garantir que materiais de tensao e outside aparecam no braco quando a rota musical pede esse tipo de nota.

## Alteracoes

- Criada `effectiveWriterMaterialCategoryVisibility`.
- A rota `Tensionar` abre automaticamente notas de tensao no mapa.
- A rota `Sair e voltar` abre automaticamente tensoes e passagens.
- A preferencia base do usuario continua preservada; a abertura e efetiva por rota.

## Decisao

O mapa no braco precisa acompanhar a intencao musical ativa. Se o usuario escolhe outside, esconder tensoes e passagens por padrao torna o material invisivel justamente quando ele deveria ser explorado.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-category-visibility.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-fretboard-view.spec.ts scripts/local-chord-vamp-materials.spec.ts`
- `npm run build`
