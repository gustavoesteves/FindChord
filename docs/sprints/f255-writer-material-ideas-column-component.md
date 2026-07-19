# F255 - Coluna de ideias para tocar

## Objetivo

Separar a lista de ideias tocaveis do painel principal de Materiais do acorde.

## Alteracoes

- Criado `WriterMaterialIdeasColumn`.
- A coluna concentra titulo, marcador de rota objetiva, grade/lista, estado vazio e cards.
- `ScaleOverlayPanel` passa apenas itens, apresentacao da rota, foco atual e handler de selecao.

## Resultado

O painel principal deixa de conhecer os detalhes da grade de ideias. A evolucao futura da lista e dos cards fica isolada.
