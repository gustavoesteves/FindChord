# F298 - Linguagem do bloco de acao

## Objetivo

Polir o bloco principal de `Materiais do acorde` para reforcar a ideia de material musical tocavel.

## Alteracoes

- O botao de audicao passa a usar icone `Play` da biblioteca de icones.
- A descricao do bloco principal fica limitada a duas linhas.
- O fallback de audicao deixa de falar em `Notas do material` e passa a falar em `Ouvir material`.
- A descricao padrao de material local deixa de comecar por `Escala de improvisacao`.

## Decisao

Mesmo quando ainda nao ha frase curada, a UI deve apresentar o conteudo como material musical navegavel, nao como uma lista tecnica de notas ou escalas.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-action.spec.ts scripts/writer-active-material-panel.spec.ts scripts/local-material-presentation.spec.ts`
- `npm run build`
