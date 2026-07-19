# F297 - Copia do mapa no braco

## Objetivo

Diminuir a sensacao de painel tecnico no braco de `Materiais do acorde`.

## Alteracoes

- O titulo `Alvos no braco` passa para `Mapa no braco`.
- O seletor `Posicao` passa para `Funcao`.
- O menu `Alvos` passa para `Ajustar mapa`.

## Decisao

O braco deve ser lido como mapa musical do material ativo. Os controles continuam disponiveis, mas a linguagem precisa apoiar a navegacao do compositor em vez de parecer uma configuracao interna.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/writer-material-fretboard-view.spec.ts scripts/local-material-fretboard-notes.spec.ts`
- `npm run build`
