# F350 - Aberturas do Writer preservam baixo e inversao

## Contexto

A auditoria funcional marcou um P1 no modulo Escrever: ao buscar aberturas alternativas para um acorde invertido, o Writer tratava o acorde como uma colecao de notas sem baixo obrigatorio. Assim, um `C/E` podia sugerir uma forma com `C` no baixo e, ao carregar a abertura, o acorde voltava a ser reconhecido como `C`.

## Alteracoes

- `WriterContext` agora passa o pitch class do baixo do acorde ativo para `generateVoicings`.
- O cache de `generateVoicings` passou a distinguir `chordRoot`, `activeQuality` e `bassPC`, alem das notas e afinacao.
- Foi adicionada uma regressao para garantir que buscas de `C/E` retornam apenas aberturas com `E` como baixo fisico.
- A regressao tambem cobre o caso em que uma busca generica anterior nao pode contaminar uma busca posterior por inversao.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-voicing-inversion.spec.ts`
- `npm run build`
- `npx vitest run --config vitest.curated.config.ts`

