# F328 - Apresentacao compartilhada de intencoes materiais

## Objetivo

Aproximar visualmente `Escrever` e `Harmonizar` para que o compositor reconheca a mesma linguagem de material nas duas telas.

## Alteracoes

- Criado `materialIntentPresentation` como contrato compartilhado para intencoes de material.
- `Harmonizar` passou a usar o helper para badges de `Estavel`, `Direcao`, `Tensao` e `Exterior`.
- `Escrever` passou a carregar o `intent` real no item de paleta quando o material vem de candidato contextual/local.
- Cards de `Materiais do acorde` passaram a usar as mesmas cores de intencao do painel de `Improviso`.
- Rotas do `Escrever` agora podem resolver por `intent` antes de recorrer ao label exibido.
- Adicionado teste de contrato visual/semantico.

## Decisao

As telas continuam com vocabulários adequados ao seu papel: `Escrever` fala em navegacao local do acorde, enquanto `Harmonizar` fala em leitura contextual da progressao. Ainda assim, as categorias musicais de fundo devem ser as mesmas para evitar que o sistema pareca ter dois motores conceituais separados.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/material-intent-presentation.spec.ts scripts/writer-material-palette.spec.ts scripts/writer-material-routes.spec.ts scripts/contextual-material-candidates.spec.ts`
- `npm run build`
