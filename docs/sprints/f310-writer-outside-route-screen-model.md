# F310 - Rota outside no modelo da tela

## Objetivo

Garantir que a rota `Sair e voltar` chegue ao modelo de `Materiais do acorde` como uma intencao musical completa.

## Alteracoes

- Adicionado teste de `G7` em vamp local no modelo da tela.
- A rota `outside` passa a ser validada como rota efetiva.
- O foco inicial da rota outside passa a ser protegido por teste com `side slip minor pentatonic`.
- A acao tocavel da rota foi validada como `Pentatonica fora e volta`.

## Decisao

O modulo `Escrever` nao conhece a progressao harmonica. Por isso, o outside aqui deve ser tratado como vocabulario local de vamp: sair por material reconhecivel e voltar aos apoios do acorde, sem inventar destino funcional.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-screen-model.spec.ts scripts/local-chord-vamp-materials.spec.ts scripts/writer-material-routes.spec.ts`
- `npm run build`
