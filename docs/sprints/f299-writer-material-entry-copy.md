# F299 - Copia de entrada em Materiais do acorde

## Objetivo

Alinhar cabecalho e estados vazios de `Materiais do acorde` com o novo fluxo musical da tela.

## Alteracoes

- O cabecalho passa de `Materiais do Acorde` para `Navegar o acorde`.
- O subtitulo passa a falar em transformar a forma em frase.
- O estado sem acorde deixa de falar em acorde `detectado`.
- O estado sem materiais deixa de falar em ideias `cadastradas`.

## Decisao

Estados vazios nao devem expor a mecanica interna da aplicacao. Eles precisam orientar o proximo gesto musical do usuario.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-action.spec.ts scripts/writer-material-routes.spec.ts scripts/writer-material-fretboard-view.spec.ts`
- `npm run build`
