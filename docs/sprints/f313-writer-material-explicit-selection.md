# F313 - Selecao explicita de material

## Objetivo

Evitar que um card ativo em `Materiais do acorde` pareca alternar estado sem produzir retorno visual claro.

## Alteracoes

- O clique em uma ideia passa a selecionar explicitamente a fonte.
- A troca de rota continua limpando a selecao local.
- O foco automatico da primeira ideia da rota permanece como fallback.

## Decisao

Na tela de materiais, cards representam escolhas musicais. Clicar em uma escolha deve fixar essa escolha; limpar o foco fica reservado para a acao explicita do cabecalho ou para a troca de rota.

## Validacao

- `npm run build`
