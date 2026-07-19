# F307 - Rota outside em Materiais do acorde

## Objetivo

Dar um lugar explicito para materiais locais que saem do acorde e retornam, como o side slip pentatonico.

## Alteracoes

- `WriterMaterialRouteId` ganha a rota `outside`.
- A intencao `Fora` deixa de cair em `Tensionar`.
- A UI passa a exibir a rota `Sair e voltar`.
- O navegador de rotas passa a acomodar quatro intencoes.
- O card outside passa a usar a acao `Sair e voltar`.

## Decisao

No `Escrever`, tensao e outside nao sao a mesma coisa. Tensao ainda orbita o vocabulario reconhecivel do acorde; outside desloca o material para fora e exige retorno consciente do musico.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-routes.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-palette.spec.ts scripts/writer-material-focus.spec.ts scripts/local-chord-vamp-materials.spec.ts`
- `npm run build`
